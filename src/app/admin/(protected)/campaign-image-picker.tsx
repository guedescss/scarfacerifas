"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function CampaignImagePicker({
  currentImageUrl,
  required = false,
}: {
  currentImageUrl?: string | null;
  required?: boolean;
}) {
  const [preview, setPreview] = useState(currentImageUrl ?? null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!preview?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    setValidationError(null);
    if (!file) {
      setPreview(currentImageUrl ?? null);
      return;
    }
    if (!ACCEPTED_TYPES.has(file.type)) {
      input.value = "";
      setValidationError("Envie uma imagem JPG, PNG ou WebP.");
      setPreview(currentImageUrl ?? null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      input.value = "";
      setValidationError("A imagem deve ter no máximo 5 MB.");
      setPreview(currentImageUrl ?? null);
      return;
    }

    setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="campaign-image">Imagem da campanha (JPG, PNG ou WebP; até 5 MB)</Label>
      <Input
        id="campaign-image"
        name="image"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        required={required}
        onChange={handleChange}
      />
      {validationError && <p role="alert" className="text-sm text-destructive">{validationError}</p>}
      {preview ? (
        <div className="relative aspect-[16/9] max-w-md overflow-hidden rounded-lg border border-gold/20 bg-black">
          <Image src={preview} alt="Pré-visualização da imagem da campanha" fill unoptimized className="object-contain" />
        </div>
      ) : (
        <div className="flex aspect-[16/9] max-w-md items-center justify-center rounded-lg border border-dashed border-gold/30 bg-black/40 text-sm text-muted-foreground">
          Pré-visualização da imagem
        </div>
      )}
    </div>
  );
}
