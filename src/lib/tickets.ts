import { Prisma } from "@prisma/client";
import { db } from "./db";

export const RESERVE_MINUTES = 30;

/** Números ocupados = pagos + reservas ainda dentro do prazo. */
export async function takenNumbers(
  campaignId: string,
  client: Pick<Prisma.TransactionClient, "ticket"> = db,
) {
  const rows = await client.ticket.findMany({
    where: {
      campaignId,
      order: { OR: [{ status: "PAID" }, { status: "PENDING", expiresAt: { gt: new Date() } }] },
    },
    select: { number: true },
  });
  return new Set(rows.map((r) => r.number));
}

function pickRandom(total: number, taken: Set<number>, qty: number) {
  const free: number[] = [];
  for (let i = 0; i < total; i++) if (!taken.has(i)) free.push(i);
  if (free.length < qty) return null;
  for (let i = 0; i < qty; i++) {
    const j = i + Math.floor(Math.random() * (free.length - i));
    [free[i], free[j]] = [free[j], free[i]];
  }
  return free.slice(0, qty);
}

/**
 * Reserva `qty` números aleatórios. A garantia contra venda dupla é o
 * @@unique([campaignId, number]): se duas pessoas pegarem o mesmo número,
 * uma delas leva P2002 e tentamos de novo com outros números.
 */
export async function reserveRandom(slug: string, qty: number, userId: string) {
  if (!Number.isInteger(qty) || qty < 1)
    throw new Error("Escolha uma quantidade válida de números.");

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const campaignRef = await tx.campaign.findUnique({
          where: { slug },
          select: { id: true },
        });
        if (!campaignRef) throw new Error("Esta campanha não está aberta.");

        await tx.$queryRaw<Array<{ id: string }>>`
          SELECT "id" FROM "Campaign" WHERE "id" = ${campaignRef.id} FOR UPDATE
        `;

        const campaign = await tx.campaign.findUnique({ where: { id: campaignRef.id } });
        if (!campaign || campaign.status !== "ACTIVE" || campaign.drawnAt)
          throw new Error("Esta campanha não está aberta.");

        await tx.order.deleteMany({
          where: { campaignId: campaign.id, status: "PENDING", expiresAt: { lt: new Date() } },
        });

        const numbers = pickRandom(campaign.totalTickets, await takenNumbers(campaign.id, tx), qty);
        if (!numbers) throw new Error("Não há números suficientes disponíveis.");

        return tx.order.create({
          data: {
            campaignId: campaign.id,
            userId,
            total: campaign.ticketPrice.mul(qty),
            expiresAt: new Date(Date.now() + RESERVE_MINUTES * 60_000),
            tickets: { create: numbers.map((number) => ({ campaignId: campaign.id, number })) },
          },
        });
      }, { maxWait: 10_000, timeout: 30_000 });
    } catch (e) {
      const conflict = e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!conflict) throw e;
    }
  }
  throw new Error("Muita gente comprando ao mesmo tempo. Tente de novo.");
}
