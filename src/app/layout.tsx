import type { Metadata } from "next";
import { Bebas_Neue, Schibsted_Grotesk } from "next/font/google";
import { brand } from "@/lib/brand";
import { BrandLogo } from "@/components/brand-logo";
import { MobileMenu } from "@/components/mobile-menu";
import { DesktopNavigation } from "@/components/desktop-navigation";
import { CursorGlow } from "@/components/cursor-glow";
import { Toaster } from "@/components/ui/sonner";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import "./globals.css";

const grotesk = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas" });

export const metadata: Metadata = {
  title: { default: brand.name, template: `%s · ${brand.name}` },
  description: `${brand.name}: participe das campanhas e acompanhe seus números.`,
  icons: { icon: "/assets/logo.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="pt-BR" className={`dark ${grotesk.variable} ${bebas.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <CursorGlow />
        <header className="sticky top-0 z-50 border-b border-[rgba(212,175,55,0.20)] bg-black">
          <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
            <BrandLogo />
            <DesktopNavigation loggedIn={Boolean(user)} />
            <div className="md:hidden">
              <MobileMenu loggedIn={Boolean(user)} />
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 md:py-10">{children}</main>
        <Toaster />
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
            <BrandLogo />
            <span>© 2026 {brand.name}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
