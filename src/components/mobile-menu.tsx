"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutList, ListChecks, LogIn, LogOut, Menu, MessageCircle, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/auth/actions";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const publicLinks = [
  { label: "Campanhas", href: "/campanhas", icon: LayoutList },
];

export function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP;
  const links = loggedIn
    ? [...publicLinks, { label: "Meus números", href: "/meus-numeros", icon: ListChecks }]
    : [...publicLinks, { label: "Cadastro", href: "/cadastrar", icon: LogIn }];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menu" className="text-gold hover:bg-white/5 hover:text-gold-light">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full border-0 bg-black p-6 text-white sm:max-w-sm"
      >
        <div className="flex items-center justify-between">
          <BrandLogo />
          <SheetClose asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Fechar menu"
              className="size-10 rounded-full border-gold/50 text-white hover:bg-white/5 hover:text-gold"
            >
              <X aria-hidden="true" />
            </Button>
          </SheetClose>
        </div>
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <SheetDescription className="sr-only">Acesse as páginas principais da loja.</SheetDescription>

        <nav aria-label="Navegação principal" className="mt-8">
          {links.map(({ label, href, icon: Icon }, index) => {
            const active = href === "/campanhas"
              ? pathname === "/" || pathname === "/campanhas"
              : pathname === href;
            return (
              <SheetClose asChild key={`${label}-${index}`}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "nav-underline flex h-16 items-center gap-4 border-b border-white/10 px-2 text-[15px] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
                    active ? "text-gold" : "text-white",
                  )}
                >
                  <Icon size={20} aria-hidden="true" className="shrink-0 text-gold" />
                  <span>{label}</span>
                </Link>
              </SheetClose>
            );
          })}
          {whatsapp && (
            <SheetClose asChild>
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="nav-underline flex h-16 items-center gap-4 border-b border-white/10 px-2 text-[15px] text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <MessageCircle size={20} aria-hidden="true" className="shrink-0 text-gold" />
                <span>Falar no WhatsApp</span>
              </a>
            </SheetClose>
          )}
        </nav>

        <div className="mt-auto pt-8">
          {loggedIn ? (
            <form action={signOut}>
              <SheetClose asChild>
                <Button type="submit" variant="outline" className="h-11 w-full rounded-full border-gold/50 text-gold hover:bg-gold hover:text-black">
                  <LogOut aria-hidden="true" />
                  Sair
                </Button>
              </SheetClose>
            </form>
          ) : (
            <SheetClose asChild>
              <Button asChild className="h-11 w-full rounded-full">
                <Link href="/entrar">
                  <LogIn aria-hidden="true" />
                  Entrar
                </Link>
              </Button>
            </SheetClose>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
