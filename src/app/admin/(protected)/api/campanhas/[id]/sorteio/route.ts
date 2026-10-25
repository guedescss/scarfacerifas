import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Campaign" WHERE "id" = ${id} FOR UPDATE
      `;

      const campaign = await tx.campaign.findUnique({
        where: { id },
        select: { id: true, status: true, drawnAt: true },
      });
      if (!campaign) return { status: 404 as const, error: "Campanha não encontrada." };
      if (campaign.drawnAt) return { status: 409 as const, error: "Esta campanha já foi sorteada." };
      if (campaign.status !== "CLOSED") {
        return { status: 409 as const, error: "Encerre as vendas antes de realizar o sorteio." };
      }

      const paidTickets = await tx.ticket.findMany({
        where: { campaignId: id, order: { status: "PAID" } },
        select: { number: true, order: { select: { userId: true, user: { select: { name: true } } } } },
      });
      if (paidTickets.length === 0) return { status: 422 as const, error: "Nenhum número pago" };

      const winner = paidTickets[randomInt(0, paidTickets.length)];
      const drawnAt = new Date();
      const updated = await tx.campaign.updateMany({
        where: { id, status: "CLOSED", drawnAt: null },
        data: {
          winnerNumber: winner.number,
          winnerUserId: winner.order.userId,
          drawnAt,
          status: "CLOSED",
        },
      });
      if (updated.count !== 1) return { status: 409 as const, error: "Esta campanha já foi sorteada." };

      return {
        status: 200 as const,
        winner: {
          number: winner.number,
          name: winner.order.user.name,
          drawnAt: drawnAt.toISOString(),
        },
      };
    }, { maxWait: 10_000, timeout: 30_000 });

    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.winner, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Falha ao realizar sorteio da campanha:", error);
    return NextResponse.json({ error: "Não foi possível realizar o sorteio." }, { status: 500 });
  }
}
