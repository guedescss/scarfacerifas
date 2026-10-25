"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { safeNextDestination } from "@/lib/auth-destination";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | null;

export async function signInWithPassword(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextDestination(String(formData.get("next") ?? null));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha incorretos." };

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "E-mail ou senha incorretos." };
  const profile = await db.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect(`/completar-cadastro?next=${encodeURIComponent(next)}`);
  redirect(next);
}
