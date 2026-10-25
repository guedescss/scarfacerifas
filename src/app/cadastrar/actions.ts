"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { onlyDigits } from "@/lib/format";
import { safeNextDestination } from "@/lib/auth-destination";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SignupState = { error?: string; confirmation?: string } | null;

export async function signUp(_: SignupState, formData: FormData): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const confirmEmail = String(formData.get("confirmEmail") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = onlyDigits(String(formData.get("phone") ?? ""));
  const next = safeNextDestination(String(formData.get("next") ?? null));

  if (email.toLowerCase() !== confirmEmail.toLowerCase()) return { error: "Os e-mails não conferem." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (!name || phone.length < 10 || phone.length > 11) return { error: "Informe nome e WhatsApp com DDD válido." };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    if (error.code === "user_already_exists" || error.message.toLowerCase().includes("already registered")) {
      return { error: "Este e-mail já está cadastrado." };
    }
    return { error: "Não foi possível criar a conta. Confira os dados e tente novamente." };
  }
  if (!data.user) return { error: "Não foi possível criar a conta. Tente novamente." };
  if (data.user.identities?.length === 0) return { error: "Este e-mail já está cadastrado." };

  await db.profile.upsert({
    where: { id: data.user.id },
    create: { id: data.user.id, name, phone },
    update: { name, phone },
  });

  if (!data.session) {
    return { confirmation: "Enviamos um link de confirmação para seu e-mail. Confirme para entrar." };
  }
  redirect(next);
}
