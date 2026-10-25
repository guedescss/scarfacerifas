import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { brl, padNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CancelOrderButton } from "../cancel-order-button";
import { ClaimPaymentButton } from "../claim-payment-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seu pedido" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();
  const order = await db.order.findUnique({
    where: { id: (await params).id },
    include: { campaign: true, tickets: { orderBy: { number: "asc" } } },
  });
  if (!order || order.userId !== user.id) notFound();

  const now = new Date();
  const expired = (order.status === "PENDING" && order.expiresAt <= now)
    || (order.status === "AWAITING_CONFIRMATION"
      && (!order.verificationExpiresAt || order.verificationExpiresAt <= now));
  const wa = process.env.WHATSAPP;
  const waText = encodeURIComponent(`Olá! Paguei o pedido ${order.id} (${order.campaign.title}). Segue o comprovante.`);
  const status = order.status === "PAID"
    ? { label: "Pagamento confirmado", variant: "success" as const }
    : order.status === "AWAITING_CONFIRMATION" && !expired
    ? { label: "Aguardando confirmação do pagamento", variant: "warning" as const }
    : expired
      ? { label: "Reserva expirada", variant: "destructive" as const }
      : { label: "Aguardando pagamento", variant: "warning" as const };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl uppercase tracking-[0.06em] text-gold sm:text-5xl">{order.campaign.title}</h1>
        <Badge variant={status.variant} className="mt-3">{status.label}</Badge>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Seus números</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {order.tickets.map((ticket) => (
            <Badge key={ticket.id} variant="outline" className="border-gold/40 font-mono text-sm text-gold">
              {padNumber(ticket.number, order.campaign.totalTickets)}
            </Badge>
          ))}
          {expired && <p className="mt-2 w-full text-sm text-muted-foreground">Estes números foram liberados. Faça um novo pedido.</p>}
        </CardContent>
      </Card>

      {order.status === "AWAITING_CONFIRMATION" && !expired && (
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="font-medium text-gold">Aguardando confirmação do pagamento</p>
            <p className="text-sm text-muted-foreground">
              Seus números continuam reservados até {order.verificationExpiresAt?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
              Envie o comprovante para confirmarmos o Pix.
            </p>
          </CardContent>
        </Card>
      )}

      {order.status === "PENDING" && !expired && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Pague por Pix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Valor: <strong className="text-gold">{brl(order.total)}</strong></p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Chave Pix</p>
              <code className="block select-all break-all rounded-md bg-zinc-900 p-3 text-sm text-white">{process.env.PIX_KEY}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Reservado até {order.expiresAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
              Depois de pagar, envie o comprovante para confirmarmos.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {wa && (
                <Button asChild>
                  <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noreferrer">
                    Enviar comprovante no WhatsApp
                  </a>
                </Button>
              )}
              <ClaimPaymentButton orderId={order.id} />
              <CancelOrderButton orderId={order.id} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
