import { NextResponse } from "next/server";
import { checkPassword, COOKIE, cookieOptions, makeToken } from "../../../../lib/auth";
import { clientIp, rateLimit } from "../../../../lib/ratelimit";

export const dynamic = "force-dynamic";
const redirect = (to: string) => new NextResponse(null, { status: 303, headers: { Location: to } });

export async function POST(req: Request) {
  if (!rateLimit("login:" + clientIp(req), 10).ok) return redirect("/admin/login?error=rate");
  const password = String((await req.formData()).get("password") ?? "");
  if (!checkPassword(password)) return redirect("/admin/login?error=1");
  const t = makeToken();
  const res = redirect("/admin");
  res.cookies.set(COOKIE, t.value, cookieOptions(t.maxAge));
  return res;
}
