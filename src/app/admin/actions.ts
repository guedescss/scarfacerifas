"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { CampaignStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { loginAdmin, logoutAdmin } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-auth";
import { slugify } from "@/lib/format";
import { deleteCampaignImage, uploadCampaignImage } from "@/lib/supabase/storage-admin";

const MAX_CAMPAIGN_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getCampaignImage(formData: FormData): { file: File; extension: string } | null {
  const value = formData.get("image");
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_CAMPAIGN_IMAGE_SIZE) {
    throw new Error("A imagem deve ter no máximo 5 MB.");
  }
  const extension = IMAGE_EXTENSIONS[value.type];
  if (!extension) {
    throw new Error("Envie uma imagem JPG, PNG ou WebP.");
  }
  return { file: value, extension };
}

function campaignFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const prize = String(formData.get("prize") ?? "").trim();
  const ticketPrice = Number(formData.get("ticketPrice"));
  const totalTickets = Number(formData.get("totalTickets"));
  const rules = String(formData.get("rules") ?? "").trim() || null;

  if (!title || !prize || !(ticketPrice > 0) || !Number.isInteger(totalTickets) || totalTickets < 10 || totalTickets > 100000) {
    throw new Error("Preencha título, prêmio, valor e quantidade (10 a 100000).");
  }

  return { title, prize, ticketPrice, totalTickets, rules };
}

function actionError(error: unknown, fallback: string) {
  console.error(fallback, error);
  return { ok: false as const, error: error instanceof Error ? error.message : fallback };
}

export async function login(fd: FormData) {
  const ok = await loginAdmin(String(fd.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin/login?erro=1");
}

export async function logout() {
  await requireAdmin({ onUnauthorized: "interrupt" });
  await logoutAdmin();
  redirect("/admin/login");
}

export async function createCampaign(fd: FormData) {
  await requireAdmin({ onUnauthorized: "interrupt" });
  let campaignId: string | undefined;
  let imageUrl: string | undefined;
  try {
    const fields = campaignFields(fd);
    const image = getCampaignImage(fd);
    const base = slugify(fields.title) || "campanha";
    const exists = await db.campaign.findUnique({ where: { slug: base } });
    const slug = exists ? `${base}-${Date.now().toString(36)}` : base;

    const campaign = await db.campaign.create({ data: { ...fields, slug } });
    campaignId = campaign.id;

    if (image) {
      imageUrl = await uploadCampaignImage(campaign.id, randomUUID(), image.extension, image.file);
      await db.campaign.update({ where: { id: campaign.id }, data: { imageUrl } });
    }

    revalidatePath("/", "layout");
    return { ok: true as const, campaignId: campaign.id };
  } catch (error) {
    if (imageUrl) {
      try {
        await deleteCampaignImage(imageUrl);
      } catch (cleanupError) {
        console.error("Falha ao remover imagem após erro ao criar campanha:", cleanupError);
      }
    }
    if (campaignId) {
      try {
        await db.campaign.delete({ where: { id: campaignId } });
      } catch (cleanupError) {
        console.error("Falha ao remover campanha após erro de criação:", cleanupError);
      }
    }
    return actionError(error, "Não foi possível criar a campanha.");
  }
}

export async function updateCampaignImage(campaignId: string, fd: FormData) {
  await requireAdmin({ onUnauthorized: "interrupt" });
  let newImageUrl: string | undefined;
  try {
    const image = getCampaignImage(fd);
    if (!image) throw new Error("Selecione uma imagem para enviar.");

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, imageUrl: true, slug: true },
    });
    if (!campaign) throw new Error("Campanha não encontrada.");

    newImageUrl = await uploadCampaignImage(campaign.id, randomUUID(), image.extension, image.file);
    await db.campaign.update({ where: { id: campaign.id }, data: { imageUrl: newImageUrl } });

    let warning: string | undefined;
    if (campaign.imageUrl) {
      try {
        await deleteCampaignImage(campaign.imageUrl);
      } catch (error) {
        console.error("Falha ao remover a imagem anterior da campanha:", error);
        warning = "A nova imagem foi salva, mas não foi possível remover a imagem anterior do Storage.";
      }
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath(`/campanha/${campaign.slug}`);
    } catch (error) {
      console.error("Falha ao revalidar páginas após atualizar imagem:", error);
      warning ??= "A imagem foi salva, mas a página pode precisar ser recarregada.";
    }

    return { ok: true as const, warning };
  } catch (error) {
    if (newImageUrl) {
      try {
        await deleteCampaignImage(newImageUrl);
      } catch (cleanupError) {
        console.error("Falha ao remover upload após erro ao atualizar imagem:", cleanupError);
      }
    }
    return actionError(error, "Não foi possível atualizar a imagem da campanha.");
  }
}

export async function setStatus(fd: FormData) {
  await requireAdmin({ onUnauthorized: "interrupt" });
  const status = String(fd.get("status")) as CampaignStatus;
  if (!Object.values(CampaignStatus).includes(status)) throw new Error("Status inválido.");
  const id = String(fd.get("id"));
  await db.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Campaign" WHERE "id" = ${id} FOR UPDATE
    `;
    const campaign = await tx.campaign.findUnique({ where: { id }, select: { drawnAt: true } });
    if (!campaign) throw new Error("Campanha não encontrada.");
    if (campaign.drawnAt && status !== "CLOSED") throw new Error("Uma campanha sorteada não pode ser reaberta.");
    await tx.campaign.update({ where: { id }, data: { status } });
  }, { maxWait: 10_000, timeout: 30_000 });
  revalidatePath("/", "layout");
}

export async function confirmOrder(orderId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin({ onUnauthorized: "interrupt" });

  const result = await db.$transaction(async (tx) => {
    const orderRef = await tx.order.findUnique({
      where: { id: orderId },
      select: { campaignId: true },
    });
    if (!orderRef) return { ok: false as const, error: "Pedido não encontrado ou cancelado." };

    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Campaign" WHERE "id" = ${orderRef.campaignId} FOR UPDATE
    `;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        expiresAt: true,
        verificationExpiresAt: true,
        campaign: { select: { status: true, drawnAt: true } },
      },
    });
    if (!order) return { ok: false as const, error: "Pedido não encontrado ou cancelado." };
    if (order.status !== "PENDING" && order.status !== "AWAITING_CONFIRMATION") {
      return { ok: false as const, error: "Este pedido não está mais pendente." };
    }
    const now = new Date();
    const verificationExpired = order.status === "AWAITING_CONFIRMATION"
      && (!order.verificationExpiresAt || order.verificationExpiresAt <= now);
    const reservationExpired = order.status === "PENDING" && order.expiresAt <= now;
    if (verificationExpired || reservationExpired) {
      return { ok: false as const, error: "A reserva deste pedido expirou." };
    }
    if (order.campaign.drawnAt || order.campaign.status === "CLOSED") {
      return { ok: false as const, error: "A campanha está encerrada; não é possível confirmar este pedido." };
    }
    if (order.campaign.status !== "ACTIVE") {
      return { ok: false as const, error: "A campanha não está aberta para confirmação." };
    }

    const updated = await tx.order.updateMany({
      where: order.status === "PENDING"
        ? { id: orderId, status: "PENDING", expiresAt: { gt: now } }
        : { id: orderId, status: "AWAITING_CONFIRMATION", verificationExpiresAt: { gt: now } },
      data: { status: "PAID", paidAt: now },
    });
    if (updated.count !== 1) {
      return { ok: false as const, error: "O pedido não está mais pendente ou a reserva expirou." };
    }

    return { ok: true as const };
  }, { maxWait: 10_000, timeout: 30_000 });

  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return result;
}

export async function rejectAwaitingOrder(
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin({ onUnauthorized: "interrupt" });

  const result = await db.$transaction(async (tx) => {
    const orderRef = await tx.order.findUnique({
      where: { id: orderId },
      select: { campaignId: true },
    });
    if (!orderRef) return { ok: false as const, error: "Pedido não encontrado." };

    await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Campaign" WHERE "id" = ${orderRef.campaignId} FOR UPDATE
    `;

    const deleted = await tx.order.deleteMany({
      where: { id: orderId, status: "AWAITING_CONFIRMATION" },
    });
    if (deleted.count !== 1) {
      return {
        ok: false as const,
        error: "Este pedido não está mais aguardando confirmação.",
      };
    }
    return { ok: true as const };
  }, { maxWait: 10_000, timeout: 30_000 });

  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return result;
}
