import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <div className="mb-6 flex items-center justify-between border-b border-gold/20 pb-3">
        <Link href="/admin" className="font-display text-2xl uppercase tracking-[0.06em] text-gold">Admin</Link>
        <form action={logout}><Button variant="outline">Sair</Button></form>
      </div>
      {children}
    </>
  );
}
