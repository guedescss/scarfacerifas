import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { brl } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const LABEL = { ACTIVE: "Aberta", CLOSED: "Encerrada", DRAFT: "" } as const;

export default async function Home() {
  const campaigns = await db.campaign.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <section className="space-y-6">
      <h1 className="font-display text-4xl uppercase tracking-[0.06em] text-gold sm:text-5xl">Campanhas</h1>
      {campaigns.length === 0 && <p className="text-muted-foreground">Nenhuma campanha publicada ainda.</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {campaigns.map((c) => (
          <li key={c.id} className="min-w-0">
            <Link href={`/campanha/${c.slug}`} className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold motion-reduce:transform-none">
              <Card className="h-full overflow-hidden border-gold/20 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-gold/50 group-hover:shadow-[0_8px_24px_rgba(212,175,55,0.12)] motion-reduce:transition-none motion-reduce:transform-none">
                <CardContent className="flex h-full min-h-36 items-center gap-3 p-4 sm:gap-4 sm:p-5">
                  {c.imageUrl ? (
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-[rgba(212,175,55,0.20)] bg-[#0a0a0a] sm:size-28">
                      <Image
                        src={c.imageUrl}
                        alt={c.title}
                        fill
                        sizes="(min-width: 640px) 112px, 96px"
                        quality={100}
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                      />
                    </div>
                  ) : (
                    <div
                      aria-label="Campanha sem imagem"
                      className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-gold/30 bg-gradient-to-br from-zinc-900 to-black px-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground sm:size-28 sm:text-xs"
                    >
                      Sem imagem
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold">{c.title}</p>
                    <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">{c.prize}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                    <p className="font-semibold text-gold">{brl(c.ticketPrice)}</p>
                    <Badge variant={c.status === "ACTIVE" ? "success" : "secondary"}>{LABEL[c.status]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
