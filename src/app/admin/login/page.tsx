import { login } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Admin" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  return (
    <div className="flex items-center justify-center">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-gold">Entrar no admin</h1>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {erro && <p role="alert" className="text-sm text-[#ef4444]">Senha incorreta.</p>}
            <Button className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
