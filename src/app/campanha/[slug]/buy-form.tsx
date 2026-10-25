"use client";

import { useActionState, useState } from "react";
import { createOrder, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BuyForm({ slug, price, available }: { slug: string; price: number; available: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createOrder, null);
  const [qty, setQty] = useState(1);
  const total = (Math.max(qty, 0) * price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Escolha seus números</CardTitle>
      </CardHeader>
      <CardContent>
        {available > 0 ? (
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
