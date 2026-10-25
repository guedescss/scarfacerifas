import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { safeNextDestination } from "@/lib/auth-destination";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Completar cadastro" };

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextDestination((await searchParams).next);
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(`/completar-cadastro?next=${encodeURIComponent(next)}`)}`);
  const profile = await db.profile.findUnique({ where: { id: user.id } });
  if (profile) redirect(next);

  const metadataName = user.user_metadata.full_name;
  const defaultName = typeof metadataName === "string" ? metadataName : "";
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader><CardTitle className="font-display text-3xl uppercase tracking-[0.06em] text-gold">Completar cadastro</CardTitle></CardHeader>
        <CardContent><ProfileForm next={next} defaultName={defaultName} /></CardContent>
      </Card>
    </div>
  );
}
