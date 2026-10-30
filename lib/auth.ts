import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE = "docschat_admin";
const MAX_AGE_S = 8 * 60 * 60;

export const adminConfigured = () => !!process.env.ADMIN_PASSWORD;
const key = () => `${process.env.ADMIN_PASSWORD}|${process.env.SESSION_SECRET ?? "docschat"}`;
const sign = (v: string) => crypto.createHmac("sha256", key()).update(v).digest("hex");
const sha = (v: string) => crypto.createHash("sha256").update(v).digest();

export function checkPassword(input: string): boolean {
  if (!adminConfigured()) return false;
  return crypto.timingSafeEqual(sha(input), sha(process.env.ADMIN_PASSWORD!));
}

export function makeToken(): { value: string; maxAge: number } {
  const exp = String(Date.now() + MAX_AGE_S * 1000);
  return { value: `${exp}.${sign(exp)}`, maxAge: MAX_AGE_S };
}

function validToken(t: string | undefined): boolean {
  if (!t || !adminConfigured()) return false;
  const [exp, sig] = t.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const good = sign(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good));
}

export async function isAdmin(): Promise<boolean> {
  return validToken((await cookies()).get(COOKIE)?.value);
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge,
});
