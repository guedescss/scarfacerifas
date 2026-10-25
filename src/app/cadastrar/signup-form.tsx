"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type SignupState } from "./actions";

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2"><Label htmlFor="name">Nome completo</Label><Input id="name" name="name" autoComplete="name" required /></div>
      <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="space-y-2"><Label htmlFor="confirmEmail">Confirmar e-mail</Label><Input id="confirmEmail" name="confirmEmail" type="email" autoComplete="email" required /></div>
      <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" name="password" type="password" autoComplete="new-password" required /></div>
      <div className="space-y-2"><Label htmlFor="phone">WhatsApp com DDD</Label><Input id="phone" name="phone" inputMode="tel" autoComplete="tel" required /></div>
      {state?.error && <p role="alert" className="text-sm text-[#ef4444]">{state.error}</p>}
      {state?.confirmation && <p role="status" className="text-sm text-muted-foreground">{state.confirmation}</p>}
      <Button className="w-full" disabled={pending}>{pending ? "Criando conta..." : "Criar conta"}</Button>
    </form>
  );
}
