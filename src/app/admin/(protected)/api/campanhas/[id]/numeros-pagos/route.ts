import "server-only";

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminPaidNumbers } from "@/lib/admin-data";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  if (!(await isAdmin())) {
    return new NextResponse(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const { id } = await params;
  const result = await getAdminPaidNumbers(id);
  if (!result) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  const csv = `numero\n${result.numbers.join("\n")}\n`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${result.slug}-numeros-pagos.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
