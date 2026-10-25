import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { safeNextDestination } from "@/lib/auth-destination";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextDestination(request.nextUrl.searchParams.get("next"));
  const supabase = await createServerSupabaseClient();
  if (!code) return NextResponse.redirect(new URL("/entrar?erro=callback", request.url));

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/entrar?erro=callback", request.url));

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.redirect(new URL("/entrar?erro=callback", request.url));
  const profile = await db.profile.findUnique({ where: { id: user.id } });
  const destination = profile
    ? next
    : `/completar-cadastro?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(new URL(destination, request.url));
}
