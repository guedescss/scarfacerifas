"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { padNumber } from "@/lib/format";

type DrawResult = { number: number; name: string; drawnAt: string };

function formatDrawTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function DrawPanel({
  campaignId,
  campaignTitle,
  totalNumbers,
  paidNumbers,
  pendingNumbers,
  canDraw,
  initialResult,
}: {
  campaignId: string;
  campaignTitle: string;
  totalNumbers: number;
  paidNumbers: number;
  pendingNumbers: number;
  canDraw: boolean;
  initialResult: DrawResult | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [cleanMode, setCleanMode] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(0);
  const [result, setResult] = useState(initialResult);

  async function performDraw() {
    setOpen(false);
    setCleanMode(true);
    setDrawing(true);
    const startedAt = performance.now();
    let elapsed = 0;
    let tick = 0;

    while (elapsed < 5000) {
      setDisplayNumber((current) => (current + Math.max(1, 1 + (tick % 7))) % totalNumbers);
      const progress = Math.min(elapsed / 5000, 1);
      const delay = Math.min(5000 - elapsed, 45 + 380 * progress ** 3);
      await new Promise((resolve) => setTimeout(resolve, delay));
      elapsed = performance.now() - startedAt;
      tick += 1;
    }

    try {
      const response = await fetch(`/admin/api/campanhas/${campaignId}/sorteio`, {
        method: "POST",
        cache: "no-store",
      });
      const payload = await response.json() as DrawResult | { error?: string };
      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : undefined);
      }

      setResult(payload as DrawResult);
      setDrawing(false);
      toast.success("Sorteio realizado");
      router.refresh();
    } catch (error) {
      setDrawing(false);
      setCleanMode(false);
      toast.error(error instanceof Error && error.message
        ? error.message
        : "Não foi possível realizar o sorteio. Tente novamente.");
    }
  }

  const pageClass = cleanMode
    ? "fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-black p-5 sm:p-10"
    : "space-y-4";

  return (
    <section className={pageClass}>
      {cleanMode && (
        <Button
          variant="outline"
          className="absolute right-5 top-5 border-gold/40 text-gold"
          onClick={() => !drawing && setCleanMode(false)}
          disabled={drawing}
        >
          Sair da tela limpa
        </Button>
      )}

      {drawing ? (
        <div className="w-full max-w-4xl space-y-5 text-center">
          <p className="font-display text-2xl uppercase tracking-[0.1em] text-muted-foreground sm:text-4xl">
            {campaignTitle}
          </p>
          <p aria-live="polite" className="font-display text-[min(35vw,18rem)] leading-none text-gold tabular-nums">
            {padNumber(displayNumber, totalNumbers)}
          </p>
          <p className="text-xl text-white sm:text-3xl">Sorteando número pago...</p>
        </div>
      ) : result ? (
        <Card className="w-full max-w-4xl border-gold/50">
          <CardContent className="space-y-5 p-8 text-center sm:p-12">
            <p className="font-display text-3xl uppercase tracking-[0.08em] text-gold sm:text-5xl">
              Resultado do sorteio
            </p>
            <p className="font-display text-[min(30vw,16rem)] leading-none text-gold tabular-nums">
              {padNumber(result.number, totalNumbers)}
            </p>
            <p className="text-2xl font-semibold text-white sm:text-4xl">{result.name}</p>
            <p className="text-sm text-muted-foreground">{formatDrawTime(result.drawnAt)}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-gold/30">
            <CardHeader>
              <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Sorteio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-muted-foreground">Total de números</dt><dd className="mt-1 text-lg font-semibold">{totalNumbers}</dd></div>
                <div><dt className="text-muted-foreground">Números pagos</dt><dd className="mt-1 text-lg font-semibold text-green-500">{paidNumbers}</dd></div>
                <div><dt className="text-muted-foreground">Números pendentes</dt><dd className="mt-1 text-lg font-semibold text-amber-500">{pendingNumbers}</dd></div>
              </dl>
              {pendingNumbers > 0 && (
                <p role="alert" className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                  Há {pendingNumbers} número(s) em pedido(s) pendente(s). Eles não participarão do sorteio.
                </p>
              )}
              {!canDraw && (
                <p className="text-sm text-muted-foreground">Encerre as vendas antes de realizar o sorteio.</p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" className="border-gold/40 text-gold">
                  <a href={`/admin/api/campanhas/${campaignId}/numeros-pagos`}>Exportar números pagos (CSV)</a>
                </Button>
                <Button variant="ghost" onClick={() => setCleanMode(true)}>Modo tela limpa</Button>
                {canDraw && (
                  <AlertDialog open={open} onOpenChange={setOpen}>
                    <AlertDialogTrigger asChild>
                      <Button className="h-12 px-8 text-lg">Realizar sorteio</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Realizar sorteio?</AlertDialogTitle>
                        <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={(event) => { event.preventDefault(); void performDraw(); }}>
                          Confirmar sorteio
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
