import { NextResponse } from "next/server";
import { COOKIE, cookieOptions } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = new NextResponse(null, { status: 303, headers: { Location: "/admin/login" } });
  res.cookies.set(COOKIE, "", cookieOptions(0));
  return res;
}
