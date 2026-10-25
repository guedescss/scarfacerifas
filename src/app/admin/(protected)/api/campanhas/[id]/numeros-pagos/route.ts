import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { id } = await params;
  const campaign = await db.campaign.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });

  const tickets = await db.ticket.findMany({
    where: { campaignId: id, order: { status: "PAID" } },
    select: { number: true },
    orderBy: { number: "asc" },
  });
  const csv = `numero\n${tickets.map(({ number }) => number).join("\n")}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${campaign.slug}-numeros-pagos.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
