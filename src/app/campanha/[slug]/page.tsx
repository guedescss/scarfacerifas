import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { brl, maskName, padNumber } from "@/lib/format";
import { takenNumbers } from "@/lib/tickets";
import { BuyForm } from "./buy-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import Image from "next/image";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

function winnerName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return rest.length ? `${first} ${rest[0][0]}.` : first;
}

const campaignImageFrameClass =
  "relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[rgba(212,175,55,0.20)] bg-[#0a0a0a] md:aspect-[16/10]";
const campaignImageClass = "object-cover object-center";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await db.campaign.findUnique({ where: { slug: (await params).slug } });
  const metadata: Metadata = { title: c?.title ?? "Campanha" };
  if (c?.imageUrl) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL precisa estar configurada para gerar a prévia da campanha.");
    metadata.openGraph = {
      images: [{ url: new URL(c.imageUrl, siteUrl).toString() }],
    };
  }
  return metadata;
}

export default async function CampaignPage({ params }: Props) {
  const { slug } = await params;
  const c = await db.campaign.findUnique({
    where: { slug },
    include: { winnerUser: { select: { name: true } } },
  });
  if (!c || c.status === "DRAFT") notFound();

  const sold = (await takenNumbers(c.id)).size;
  const available = Math.max(c.totalTickets - sold, 0);
  const pct = Math.round((sold / c.totalTickets) * 100);
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await db.profile.findUnique({ where: { id: user.id } }) : null;
  if (user && !profile && c.status === "ACTIVE") {
    redirect(`/completar-cadastro?next=${encodeURIComponent(`/campanha/${c.slug}`)}`);
  }
  const openOrder = user
    ? await db.order.findFirst({
        where: { userId: user.id, status: "PENDING", expiresAt: { gt: new Date() } },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      })
    : null;

  const winnerTicket =
    c.status === "CLOSED" && c.winnerNumber !== null && !c.winnerUser
      ? await db.ticket.findUnique({
          where: { campaignId_number: { campaignId: c.id, number: c.winnerNumber } },
          select: { order: { select: { user: { select: { name: true } } } } },
        })
      : null;

  return (
    <article className="space-y-6">
      <header>
        <h1 className="font-display text-4xl uppercase tracking-[0.06em] text-gold sm:text-5xl">{c.title}</h1>
        <p className="mt-2 text-muted-foreground">{c.prize}</p>
      </header>

      {c.imageUrl ? (
        <div className={campaignImageFrameClass}>
          <Image
            src={c.imageUrl}
            alt={c.title}
            fill
            priority
            sizes="(min-width: 1024px) 976px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
            quality={95}
            className={campaignImageClass}
          />
        </div>
      ) : (
        <div
          aria-label="Campanha sem imagem"
          className={`${campaignImageFrameClass} flex items-center justify-center border-dashed bg-gradient-to-br from-zinc-900 to-black text-sm uppercase tracking-[0.2em] text-muted-foreground`}
        >
          Sem imagem
        </div>
      )}

      <Card aria-label="Andamento">
        <CardContent className="space-y-3 p-5">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <span className="flex items-baseline gap-2">
              <span>{pct}% vendido</span>
              <span className="text-xs text-muted-foreground">{available} restantes</span>
            </span>
            <span className="font-medium text-gold">{brl(c.ticketPrice)} por número</span>
          </div>
          <Progress value={pct} />
        </CardContent>
      </Card>

      {c.status === "ACTIVE" && (user ? (
        <BuyForm
          slug={c.slug}
          price={Number(c.ticketPrice.toString())}
          available={available}
          openOrderId={openOrder?.id ?? null}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Entre para participar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <GoogleButton next={`/campanha/${c.slug}`} />
            <Button asChild className="w-full">
              <Link href={`/entrar?next=${encodeURIComponent(`/campanha/${c.slug}`)}`}>Entrar com e-mail</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/cadastrar?next=${encodeURIComponent(`/campanha/${c.slug}`)}`}>Criar conta</Link>
            </Button>
          </CardContent>
        </Card>
      ))}

      {c.status === "CLOSED" && (
        <Card className="border-gold/40">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            {c.drawnAt && c.winnerNumber !== null && c.winnerUser ? (
              <p>
                Sorteio realizado em{" "}
                <strong>{new Intl.DateTimeFormat("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "America/Sao_Paulo",
                }).format(c.drawnAt)}</strong>
                {" — Número sorteado: "}
                <strong className="text-gold">{padNumber(c.winnerNumber, c.totalTickets)}</strong>
                {" — Ganhador: "}
                <strong className="text-gold">{winnerName(c.winnerUser.name)}</strong>
              </p>
            ) : c.winnerNumber === null ? (
              <p className="text-muted-foreground">Campanha encerrada. O resultado será divulgado aqui.</p>
            ) : (
              <div className="space-y-2">
                <p>
                  Número sorteado: <strong className="text-gold">{padNumber(c.winnerNumber, c.totalTickets)}</strong>
                  {winnerTicket && <> — {maskName(winnerTicket.order.user.name)}</>}
                </p>
                {c.drawSource && <p className="text-sm text-muted-foreground">Base do sorteio: {c.drawSource}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {c.rules && (
        <section>
          <h2 className="mb-2 font-display text-2xl uppercase tracking-[0.06em] text-gold">Regulamento</h2>
          <p className="whitespace-pre-line text-muted-foreground">{c.rules}</p>
        </section>
      )}
    </article>
  );
}
