import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { brl, padNumber } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meus números" };

export default async function MyNumbers({
  searchParams,
}: {
  searchParams: Promise<{ cancelado?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=%2Fmeus-numeros");
  const { cancelado } = await searchParams;

  const profile = await db.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect("/completar-cadastro?next=%2Fmeus-numeros");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { campaign: true, tickets: { orderBy: { number: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const groups = [
    {
      title: "Aguardando pagamento",
      orders: orders.filter((order) => order.status === "PENDING" && order.expiresAt >= now),
      label: "Pendente",
      variant: "warning" as const,
    },
    {
      title: "Pagos",
      orders: orders.filter((order) => order.status === "PAID"),
      label: "Pago",
      variant: "success" as const,
    },
    {
      title: "Expirados",
      orders: orders.filter((order) => order.status === "PENDING" && order.expiresAt < now),
      label: "Expirado",
      variant: "destructive" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl uppercase tracking-[0.06em] text-gold sm:text-5xl">Meus números</h1>
      {cancelado === "1" && (
        <p role="status" className="text-sm text-green-500">
          Pedido cancelado. Os números já estão disponíveis novamente.
        </p>
      )}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-5">
            <p className="text-muted-foreground">Você ainda não tem pedidos.</p>
            <Button asChild><Link href="/">Ver campanhas</Link></Button>
          </CardContent>
        </Card>
      ) : groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="font-display text-2xl uppercase tracking-[0.06em] text-gold">{group.title}</h2>
          {group.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido nesta categoria.</p>
          ) : (
            <ul className="space-y-3">
              {group.orders.map((order) => (
                <li key={order.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="break-words font-medium">{order.campaign.title}</p>
                          {order.campaign.winnerUserId === user.id &&
                            order.tickets.some((ticket) => ticket.number === order.campaign.winnerNumber) && (
                              <Badge variant="success">Você foi o ganhador</Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.tickets.map((ticket) => (
                            <Badge key={ticket.id} variant="outline" className="border-gold/40 font-mono text-gold">
                              {padNumber(ticket.number, order.campaign.totalTickets)}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {brl(order.total)} · {order.createdAt.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Badge variant={group.variant}>{group.label}</Badge>
                        <Button asChild variant="outline">
                          <Link href={`/pedido/${order.id}`}>Ver pedido</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
