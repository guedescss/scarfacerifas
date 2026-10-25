import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex min-w-0 shrink-0 items-center gap-2.5 text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        className,
      )}
    >
      <Image
        src="/assets/logo.png"
        alt="Scarface Artigos"
        width={192}
        height={192}
        unoptimized
        priority
        className="size-12 shrink-0 rounded-full object-cover"
      />
      <span className="whitespace-nowrap font-display text-xl tracking-[0.06em]">
        {brand.name.toUpperCase()}
      </span>
    </Link>
  );
}
