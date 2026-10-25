"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { onlyDigits } from "@/lib/format";
import { safeNextDestination } from "@/lib/auth-destination";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileState = { error?: string } | null;

export async function completeProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/entrar?next=%2Fcompletar-cadastro");

  const name = String(formData.get("name") ?? "").trim();
  const phone = onlyDigits(String(formData.get("phone") ?? ""));
  const next = safeNextDestination(String(formData.get("next") ?? null));
  if (!name || phone.length < 10 || phone.length > 11) {
    return { error: "Informe seu nome e um WhatsApp com DDD válido." };
  }
  await db.profile.upsert({
    where: { id: user.id },
    create: { id: user.id, name, phone },
    update: { name, phone },
  });
  redirect(next);
}
