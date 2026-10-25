import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { safeNextDestination } from "@/lib/auth-destination";
import { db } from "@/lib/db";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextDestination(params.next);
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const profile = await db.profile.findUnique({ where: { id: user.id } });
    redirect(profile ? next : `/completar-cadastro?next=${encodeURIComponent(next)}`);
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-3xl uppercase tracking-[0.06em] text-gold">Entrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {params.erro && <p role="alert" className="text-sm text-[#ef4444]">Não foi possível concluir o acesso. Tente novamente.</p>}
          <GoogleButton next={next} />
          <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
          <LoginForm next={next} />
          <p className="text-center text-sm text-muted-foreground">
            Ainda não tem conta? <Link className="text-gold underline underline-offset-4" href={`/cadastrar?next=${encodeURIComponent(next)}`}>Cadastre-se</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
