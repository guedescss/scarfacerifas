import "server-only";

import { randomInt } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function getAdminCampaigns() {
  await requireAdmin();
  return db.campaign.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getAdminCampaign(id: string) {
  await requireAdmin();
  return db.campaign.findUnique({
    where: { id },
    include: {
      winnerUser: true,
      orders: {
        orderBy: { createdAt: "desc" },
        include: { user: true, _count: { select: { tickets: true } } },
      },
    },
  });
}

export async function getAdminPaidNumbers(campaignId: string) {
  await requireAdmin();
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { slug: true },
  });
  if (!campaign) return null;

  const tickets = await db.ticket.findMany({
    where: { campaignId, order: { status: "PAID" } },
    select: { number: true },
    orderBy: { number: "asc" },
  });
  return { slug: campaign.slug, numbers: tickets.map(({ number }) => number) };
}

export async function drawAdminCampaign(campaignId: string) {
  await requireAdmin();
  return db.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Campaign" WHERE "id" = ${campaignId} FOR UPDATE
    `;

    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true, drawnAt: true },
    });
    if (!campaign) return { status: 404 as const, error: "Campanha não encontrada." };
    if (campaign.drawnAt) return { status: 409 as const, error: "Esta campanha já foi sorteada." };
    if (campaign.status !== "CLOSED") {
      return { status: 409 as const, error: "Encerre as vendas antes de realizar o sorteio." };
    }

    const paidTickets = await tx.ticket.findMany({
      where: { campaignId, order: { status: "PAID" } },
      select: { number: true, order: { select: { userId: true, user: { select: { name: true } } } } },
    });
    if (paidTickets.length === 0) return { status: 422 as const, error: "Nenhum número pago" };

    const winner = paidTickets[randomInt(0, paidTickets.length)];
    const drawnAt = new Date();
    const updated = await tx.campaign.updateMany({
      where: { id: campaignId, status: "CLOSED", drawnAt: null },
      data: {
        winnerNumber: winner.number,
        winnerUserId: winner.order.userId,
        drawnAt,
        status: "CLOSED",
      },
    });
    if (updated.count !== 1) {
      return { status: 409 as const, error: "Esta campanha já foi sorteada." };
    }

    return {
      status: 200 as const,
      winner: {
        number: winner.number,
        name: winner.order.user.name,
        drawnAt: drawnAt.toISOString(),
      },
    };
  }, { maxWait: 10_000, timeout: 30_000 });
}
