"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reserveRandom } from "@/lib/tickets";

export type FormState = { error?: string } | null;

export async function createOrder(_: FormState, fd: FormData): Promise<FormState> {
  const slug = String(fd.get("slug") ?? "");
  const qty = Number(fd.get("qty"));
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { error: "Entre na sua conta para reservar números." };

  const profile = await db.profile.findUnique({ where: { id: user.id } });
  if (!profile) redirect(`/completar-cadastro?next=${encodeURIComponent(`/campanha/${slug}`)}`);

  let orderId: string;
  try {
    orderId = (await reserveRandom(slug, qty, user.id)).id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível reservar. Tente de novo." };
  }
  redirect(`/pedido/${orderId}`);
}
