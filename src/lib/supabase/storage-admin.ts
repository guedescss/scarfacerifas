import "server-only";

import { createClient } from "@supabase/supabase-js";

const BUCKET = "campanhas";

function storageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function uploadCampaignImage(
  campaignId: string,
  uniqueId: string,
  extension: string,
  file: File,
) {
  const storage = storageAdmin();
  const path = `${campaignId}/${uniqueId}-${Date.now()}.${extension}`;
  const { error } = await storage.storage.from(BUCKET).upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
    cacheControl: "3600",
  });
  if (error) {
    console.error("Supabase Storage upload failed:", error);
    const message = error.message.toLowerCase();
    if (message.includes("bucket not found") || message.includes("bucket does not exist")) {
      throw new Error('O bucket público "campanhas" não existe no projeto Supabase configurado.');
    }
    throw new Error(`Falha ao enviar a imagem para o Supabase Storage: ${error.message}`);
  }

  return storage.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deleteCampaignImage(imageUrl: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurada.");

  const base = new URL(supabaseUrl);
  const url = new URL(imageUrl, base);
  const objectPrefix = "/storage/v1/object/public/campanhas/";
  if (url.origin !== base.origin || !url.pathname.includes(objectPrefix)) return;

  const path = decodeURIComponent(url.pathname.slice(url.pathname.indexOf(objectPrefix) + objectPrefix.length));
  if (!path) return;

  const { error } = await storageAdmin().storage.from(BUCKET).remove([path]);
  if (error) throw new Error("Falha ao remover a imagem antiga do Supabase Storage.");
}
