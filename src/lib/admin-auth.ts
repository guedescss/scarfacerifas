import "server-only";

import { cookies } from "next/headers";
import { redirect, unauthorized } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE = "admin";

export type AdminSession = { expiresAt: number };

function secret() {
  const value = process.env.ADMIN_SECRET;
  return value || null;
}

export function signAdminSession(value: string) {
  const key = secret();
  if (!key) throw new Error("ADMIN_SECRET precisa estar configurada.");
  return createHmac("sha256", key).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const separator = token.indexOf(".");
  if (separator <= 0 || separator !== token.lastIndexOf(".")) return null;
  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!/^\d{13}$/.test(expiresAt) || !/^[a-f0-9]{64}$/i.test(signature)) return null;

  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry <= Date.now()) return null;

  let expected: string;
  try {
    expected = signAdminSession(expiresAt);
  } catch {
    return null;
  }
  if (!safeEqual(signature, expected)) return null;

  return { expiresAt: expiry };
}

export async function isAdmin() {
  return (await getAdminSession()) !== null;
}

export async function requireAdmin(options?: { onUnauthorized?: "interrupt" }): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session) return session;

  if (options?.onUnauthorized === "interrupt") unauthorized();
  redirect("/admin/login");
}
