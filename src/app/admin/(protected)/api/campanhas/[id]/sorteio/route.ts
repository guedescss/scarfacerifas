import "server-only";

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { drawAdminCampaign } from "@/lib/admin-data";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return new NextResponse(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { id } = await params;

  try {
    const result = await drawAdminCampaign(id);

    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.winner, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Falha ao realizar sorteio da campanha:", error);
    return NextResponse.json({ error: "Não foi possível realizar o sorteio." }, { status: 500 });
  }
}
