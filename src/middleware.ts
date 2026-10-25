import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

async function hasValidAdminSession(request: NextRequest) {
  const token = request.cookies.get("admin")?.value;
  const secret = process.env.ADMIN_SECRET;
  if (!token || !secret) return false;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator !== token.lastIndexOf(".")) return false;
  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^\d{13}$/.test(expiresAt) || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  if (!Number.isSafeInteger(Number(expiresAt)) || Number(expiresAt) <= Date.now()) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signatureBytes = Uint8Array.from(
      signature.match(/.{2}/g) ?? [],
      (byte) => Number.parseInt(byte, 16),
    );
    return crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      new TextEncoder().encode(expiresAt),
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/api" || pathname.startsWith("/admin/api/")) {
    return NextResponse.next({ request });
  }
  if (
    (pathname === "/admin" || pathname.startsWith("/admin/"))
    && pathname !== "/admin/login"
    && !(await hasValidAdminSession(request))
  ) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 307);
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
