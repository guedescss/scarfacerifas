"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { VERIFICATION_WINDOW_HOURS } from "@/lib/tickets";

export type ClaimPaymentResult = { ok: true } | { ok: false; error: string };

export async function claimPayment(orderId: string): Promise<ClaimPaymentResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false, error: "Entre na sua conta para informar o pagamento." };
  }
  if (typeof orderId !== "string" || !orderId.trim()) {
    return { ok: false, error: "Pedido inválido." };
  }

  const result = await db.$transaction(async (tx) => {
    const orderRef = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true, campaignId: true },
    });
    if (!orderRef || orderRef.userId !== user.id) {
      return { ok: false as const, error: "Pedido não encontrado." };
    }

    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Profile" WHERE "id" = ${user.id} FOR UPDATE
    `;
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Campaign" WHERE "id" = ${orderRef.campaignId} FOR UPDATE
    `;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true, status: true, expiresAt: true, verificationExpiresAt: true },
    });
    if (!order || order.userId !== user.id) {
      return { ok: false as const, error: "Pedido não encontrado." };
    }
    if (order.status === "AWAITING_CONFIRMATION") {
      return { ok: true as const };
    }
    if (order.status !== "PENDING") {
      return { ok: false as const, error: "Este pedido não está mais aguardando pagamento." };
    }

    const now = new Date();
    if (order.expiresAt <= now) {
      return { ok: false as const, error: "O prazo deste pedido expirou. Faça uma nova reserva." };
    }

    const awaitingCount = await tx.order.count({
      where: {
        userId: user.id,
        status: "AWAITING_CONFIRMATION",
        verificationExpiresAt: { gt: now },
      },
    });
    if (awaitingCount >= 2) {
      return {
        ok: false as const,
        error: "Você já tem 2 pedidos aguardando confirmação. Aguarde a análise ou o prazo de liberação.",
      };
    }

    const verificationExpiresAt = new Date(
      now.getTime() + VERIFICATION_WINDOW_HOURS * 60 * 60 * 1000,
    );
    const updated = await tx.order.updateMany({
      where: { id: orderId, userId: user.id, status: "PENDING", expiresAt: { gt: now } },
      data: {
        status: "AWAITING_CONFIRMATION",
        paymentClaimedAt: now,
        verificationExpiresAt,
      },
    });
    if (updated.count !== 1) {
      return {
        ok: false as const,
        error: "O pedido não está mais aguardando pagamento ou o prazo expirou.",
      };
    }

    return { ok: true as const };
  }, { maxWait: 10_000, timeout: 30_000 });

  if (result.ok) {
    revalidatePath("/", "layout");
    revalidatePath("/meus-numeros");
    revalidatePath(`/pedido/${orderId}`);
  }
  return result;
}

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
