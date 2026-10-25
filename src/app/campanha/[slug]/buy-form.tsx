"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { createOrder, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BuyForm({
  slug,
  price,
  available,
  openOrderId,
}: {
  slug: string;
  price: number;
  available: number;
  openOrderId: string | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createOrder, null);
  const [qty, setQty] = useState(1);
  const total = (Math.max(qty, 0) * price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Escolha seus números</CardTitle>
      </CardHeader>
      <CardContent>
        {openOrderId ? (
          <div className="space-y-3">
            <p role="status" className="text-sm text-amber-400">
              Você já tem um pedido em aberto. Finalize ou cancele para reservar novos números.
            </p>
            <Button asChild className="w-full">
              <Link href={`/pedido/${openOrderId}`}>Ver meu pedido em aberto</Link>
            </Button>
          </div>
        ) : available > 0 ? (
          <form action={action} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />
            <div className="space-y-2">
              <Label htmlFor="qty">Quantos números?</Label>
              <Input id="qty" name="qty" type="number" min={1} max={available} value={qty}
                onChange={(e) => setQty(Number(e.target.value))} required />
              <p className="text-sm text-muted-foreground">Os números são sorteados para você na hora.</p>
            </div>
            {state?.error && <p role="alert" className="text-sm text-[#ef4444]">{state.error}</p>}
            <Button className="w-full" disabled={pending}>
              {pending ? "Reservando…" : `Reservar e pagar ${total}`}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">Não há números disponíveis no momento.</p>
        )}
      </CardContent>
    </Card>
  );
}
