// In-memory sliding-window rate limiter. Per server instance: good enough to stop a public
// demo being hammered; for hard guarantees on multi-instance hosting put Upstash/Redis behind it.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs = 60_000): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v[v.length - 1] > windowMs) hits.delete(k);
  return { ok: true, retryAfter: 0 };
}

/** Client IP behind a trusted proxy (Vercel sets x-real-ip). The LAST x-forwarded-for entry is the one our proxy appended, so it cannot be spoofed by the client. */
export function clientIp(req: Request): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",").pop()!.trim();
  return "local";
}
