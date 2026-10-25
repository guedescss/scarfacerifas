"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeProfile, type ProfileState } from "./actions";

export function ProfileForm({ next, defaultName }: { next: string; defaultName: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(completeProfile, null);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2"><Label htmlFor="name">Nome completo</Label><Input id="name" name="name" defaultValue={defaultName} autoComplete="name" required /></div>
      <div className="space-y-2"><Label htmlFor="phone">WhatsApp com DDD</Label><Input id="phone" name="phone" inputMode="tel" autoComplete="tel" required /></div>
      {state?.error && <p role="alert" className="text-sm text-[#ef4444]">{state.error}</p>}
      <Button className="w-full" disabled={pending}>{pending ? "Salvando..." : "Salvar e continuar"}</Button>
    </form>
  );
}
