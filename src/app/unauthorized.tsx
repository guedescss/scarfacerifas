import Link from "next/link";

export default function Unauthorized() {
  return (
    <main className="mx-auto max-w-xl space-y-4 p-8 text-center">
      <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-gold">Acesso não autorizado</h1>
      <p className="text-muted-foreground">Entre novamente para continuar.</p>
      <Link className="text-gold underline underline-offset-4" href="/admin/login">Ir para o login</Link>
    </main>
  );
}
