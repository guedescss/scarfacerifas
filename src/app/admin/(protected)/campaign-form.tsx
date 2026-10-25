"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampaign, updateCampaignImage } from "../actions";
import { CampaignImagePicker } from "./campaign-image-picker";

export function CampaignForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createCampaign(formData);
      if (!result.ok) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Campanha criada");
      router.push(`/admin/campanhas/${result.campaignId}`);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Nova campanha</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="title">Título</Label><Input id="title" name="title" required /></div>
          <div className="space-y-2"><Label htmlFor="prize">Prêmio</Label><Input id="prize" name="prize" required /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticketPrice">Valor do número (R$)</Label>
              <Input id="ticketPrice" name="ticketPrice" type="number" step="0.01" min="0.01" defaultValue={45} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalTickets">Total de números</Label>
              <Input id="totalTickets" name="totalTickets" type="number" defaultValue={10000} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rules">Regulamento</Label>
            <textarea
              id="rules"
              name="rules"
              rows={4}
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
            />
          </div>
          <CampaignImagePicker />
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <Button disabled={pending}>{pending ? "Criando campanha..." : "Criar rascunho"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CampaignImageForm({
  campaignId,
  imageUrl,
}: {
  campaignId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await updateCampaignImage(campaignId, formData);
      if (!result.ok) {
        setFormError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success("Imagem da campanha atualizada");
      if (result.warning) toast.warning(result.warning);
      form.reset();
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Imagem da campanha</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CampaignImagePicker currentImageUrl={imageUrl} required />
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <Button disabled={pending}>{pending ? "Enviando imagem..." : "Atualizar imagem"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
