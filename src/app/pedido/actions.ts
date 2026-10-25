"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function cancelOrder(orderId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !orderId) return false;

  const result = await db.order.deleteMany({
    where: {
      id: orderId,
      userId: user.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (result.count !== 1) {
    return false;
  }

  revalidatePath("/", "layout");
  revalidatePath("/meus-numeros");
  revalidatePath(`/pedido/${orderId}`);
  return true;
}
