import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { signAdminSession } from "@/lib/admin-auth";

const COOKIE = "admin";
const DAY = 86_400;

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function loginAdmin(password: string) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword || !safeEqual(password, expectedPassword)) return false;
  const exp = String(Date.now() + 7 * DAY * 1000);
  let signature: string;
  try {
    signature = signAdminSession(exp);
  } catch (error) {
    console.error("Falha ao assinar a sessão administrativa:", error);
    return false;
  }
  (await cookies()).set(COOKIE, `${exp}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 7 * DAY,
  });
  return true;
}

export async function logoutAdmin() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
