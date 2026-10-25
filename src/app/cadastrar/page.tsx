import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleButton } from "@/components/auth/google-button";
import { safeNextDestination } from "@/lib/auth-destination";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Criar conta" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextDestination((await searchParams).next);
  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader><CardTitle className="font-display text-3xl uppercase tracking-[0.06em] text-gold">Criar conta</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <GoogleButton next={next} />
          <div className="flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
          <SignupForm next={next} />
          <p className="text-center text-sm text-muted-foreground">Já tem conta? <Link className="text-gold underline underline-offset-4" href={`/entrar?next=${encodeURIComponent(next)}`}>Entrar</Link></p>
        </CardContent>
      </Card>
    </div>
  );
}
