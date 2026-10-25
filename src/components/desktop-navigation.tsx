"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function DesktopNavigation({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const campaignsActive = pathname === "/" || pathname === "/campanhas";

  return (
    <div className="hidden items-center gap-7 md:flex">
      <Link
        href="/campanhas"
        aria-current={campaignsActive ? "page" : undefined}
        className={`nav-underline text-sm hover:text-gold ${campaignsActive ? "text-gold" : "text-white"}`}
      >
        Campanhas
      </Link>
      {loggedIn ? (
        <Link
          href="/meus-numeros"
          aria-current={pathname === "/meus-numeros" ? "page" : undefined}
          className={`nav-underline text-sm hover:text-gold ${pathname === "/meus-numeros" ? "text-gold" : "text-white"}`}
        >
          Meus números
        </Link>
      ) : (
        <Link href="/cadastrar" className="nav-underline text-sm text-white hover:text-gold">
          Cadastro
        </Link>
      )}
      {process.env.NEXT_PUBLIC_WHATSAPP && (
        <Link
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP}`}
          target="_blank"
          rel="noreferrer"
          className="nav-underline text-sm text-white hover:text-gold"
        >
          WhatsApp
        </Link>
      )}
      {loggedIn ? (
        <form action={signOut}>
          <Button type="submit" variant="outline" className="h-9 rounded-full border-gold/40 px-5 text-gold">
            Sair
          </Button>
        </form>
      ) : (
        <Button asChild className="h-9 rounded-full px-5">
          <Link href="/entrar">Entrar</Link>
        </Button>
      )}
    </div>
  );
}
