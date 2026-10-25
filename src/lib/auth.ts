import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "admin";
const DAY = 86_400;

const sign = (v: string) =>
  createHmac("sha256", process.env.ADMIN_SECRET!).update(v).digest("hex");

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function loginAdmin(password: string) {
  if (!safeEqual(password, process.env.ADMIN_PASSWORD!)) return false;
  const exp = String(Date.now() + 7 * DAY * 1000);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {
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

export async function isAdmin() {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  return !!exp && !!sig && safeEqual(sig, sign(exp)) && Number(exp) > Date.now();
}

// Chame no começo de toda página e toda server action do admin.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
