import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminCampaign } from "@/lib/admin-data";
import { brl } from "@/lib/format";
import { setStatus } from "../../../actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DrawPanel } from "./draw-panel";
import { ConfirmOrderButton } from "./confirm-order-button";
import { RejectOrderButton } from "./reject-order-button";
import { CampaignImageForm } from "../../campaign-form";

export const dynamic = "force-dynamic";

function remainingTime(expiresAt: Date, now: Date) {
  const remaining = expiresAt.getTime() - now.getTime();
  if (remaining <= 0) return "Prazo expirado";
  const minutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${restMinutes}min restantes` : `${restMinutes}min restantes`;
}

export default async function AdminCampaign({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const c = await getAdminCampaign(id);
  if (!c) notFound();

  const paid = c.orders.filter((o) => o.status === "PAID");
  const paidQty = paid.reduce((s, o) => s + o._count.tickets, 0);
  const now = new Date();
  const pendingQty = c.orders
    .filter((o) =>
      (o.status === "PENDING" && o.expiresAt > now)
      || (o.status === "AWAITING_CONFIRMATION"
        && o.verificationExpiresAt !== null
        && o.verificationExpiresAt > now),
    )
    .reduce((s, o) => s + o._count.tickets, 0);
  const orderedOrders = [...c.orders].sort((a, b) =>
    Number(b.status === "AWAITING_CONFIRMATION") - Number(a.status === "AWAITING_CONFIRMATION")
    || b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const revenue = paid.reduce((s, o) => s + Number(o.total.toString()), 0);

  const next = c.status === "DRAFT" ? ["ACTIVE", "Publicar"] : c.status === "ACTIVE" ? ["CLOSED", "Encerrar vendas"] : ["ACTIVE", "Reabrir"];
  const initialResult =
    c.drawnAt && c.winnerNumber !== null
      ? {
          number: c.winnerNumber,
          name: c.winnerUser?.name ?? "Perfil do ganhador indisponível",
          drawnAt: c.drawnAt.toISOString(),
        }
      : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-gold sm:text-4xl">{c.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {paidQty} de {c.totalTickets} pagos · {brl(revenue)} · <a className="text-gold underline underline-offset-4" href={`/campanha/${c.slug}`}>ver página</a>
          </p>
        </div>
        {!c.drawnAt && (
          <form action={setStatus}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="status" value={next[0]} />
            <Button>{next[1]}</Button>
          </form>
        )}
      </header>

      <section>
        <h2 className="mb-3 font-display text-2xl uppercase tracking-[0.06em] text-gold">Pedidos</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderedOrders.map((o) => {
                const verificationExpired = o.status === "AWAITING_CONFIRMATION"
                  && (!o.verificationExpiresAt || o.verificationExpiresAt <= now);
                const expired = (o.status === "PENDING" && o.expiresAt <= now) || verificationExpired;
                const awaiting = o.status === "AWAITING_CONFIRMATION" && !verificationExpired;
                return (
                  <TableRow key={o.id} className={awaiting ? "bg-green-950/40 ring-1 ring-inset ring-green-500/40" : undefined}>
                    <TableCell className="min-w-36">
                      <p className="break-words font-medium">{o.user.name}</p>
                      <p className="break-all text-xs text-muted-foreground">{o.user.phone}</p>
                      {awaiting && (
                        <p className="text-xs font-semibold text-green-400">
                          {remainingTime(o.verificationExpiresAt!, now)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span>{o._count.tickets} números</span>
                      <p className="text-xs text-muted-foreground">{brl(o.total)}</p>
                    </TableCell>
                    <TableCell>
                      {o.status === "PAID"
                        ? <Badge variant="success">Pago</Badge>
                        : awaiting
                          ? <Badge className="border-green-500/40 bg-green-950 text-green-300">Aguardando confirmação</Badge>
                        : <Badge variant={expired ? "destructive" : "warning"}>{expired ? "Expirado" : "Pendente"}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {o.status === "PAID" ? (
                        <span className="text-sm text-[#22c55e]">Pago</span>
                      ) : awaiting || verificationExpired ? (
                        <div className="flex flex-col justify-end gap-2 sm:flex-row">
                          {awaiting && <ConfirmOrderButton orderId={o.id} />}
                          <RejectOrderButton orderId={o.id} />
                        </div>
                      ) : (
                        <div className="flex justify-end">
                          <ConfirmOrderButton orderId={o.id} />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {c.orders.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-muted-foreground">Nenhum pedido ainda.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      <CampaignImageForm key={c.imageUrl ?? "no-image"} campaignId={c.id} imageUrl={c.imageUrl} />

      {c.status !== "DRAFT" && (
        <DrawPanel
          campaignId={c.id}
          campaignTitle={c.title}
          totalNumbers={c.totalTickets}
          paidNumbers={paidQty}
          pendingNumbers={pendingQty}
          canDraw={c.status === "CLOSED" && !c.drawnAt}
          initialResult={initialResult}
        />
      )}
    </div>
  );
}
