"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function GoogleButton({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setPending(true);
    setError("");
    const supabase = createBrowserSupabaseClient();
    const redirectTo = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL);
    redirectTo.searchParams.set("next", next);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    if (oauthError) {
      setError("Não foi possível iniciar o acesso com Google. Tente novamente.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full border-gold/40" onClick={signInWithGoogle} disabled={pending}>
        <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5" focusable="false">
          <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-2 4.6-4.2 6v5.1h6.8c4-3.7 6-9 6-14.8Z" />
          <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.8-5.1c-1.8 1.2-4 1.9-6.7 1.9-5.2 0-9.6-3.5-11.2-8.2H5.8v5.2A20 20 0 0 0 24 44Z" />
          <path fill="#FBBC05" d="M12.8 27.8a12 12 0 0 1 0-7.6V15H5.8a20 20 0 0 0 0 18l7-5.2Z" />
          <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15l7 5.2C14.4 15.5 18.8 12 24 12Z" />
        </svg>
        {pending ? "Conectando..." : "Continuar com Google"}
      </Button>
      {error && <p role="alert" className="text-sm text-[#ef4444]">{error}</p>}
    </div>
  );
}
