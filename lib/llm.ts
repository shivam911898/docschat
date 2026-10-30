import { GoogleGenAI } from "@google/genai";
import { model, groqModel, groqBaseUrl } from "./config";

/* ---------- provider selection (the only place that reads LLM_PROVIDER / the API keys) ---------- */
export type Provider = "groq" | "gemini" | "none";

/**
 * LLM_PROVIDER = groq | gemini | none picks explicitly (a named provider without its key means none).
 * Unset: groq if GROQ_API_KEY is set, else gemini if GEMINI_API_KEY is set, else none.
 */
export function provider(): Provider {
  const has = { groq: !!process.env.GROQ_API_KEY, gemini: !!process.env.GEMINI_API_KEY };
  const want = (process.env.LLM_PROVIDER ?? "").trim().toLowerCase();
  if (want === "none") return "none";
  if (want === "groq" || want === "gemini") return has[want] ? want : "none";
  return has.groq ? "groq" : has.gemini ? "gemini" : "none";
}
export const aiEnabled = () => provider() !== "none";
/** Model name for the active provider (null in demo mode). */
export const llmModel = () => { const p = provider(); return p === "groq" ? groqModel() : p === "gemini" ? model() : null; };

export const ai = (timeout = 15000) => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { timeout } });

/* ---------- retry ---------- */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** True for transient Gemini errors worth retrying: 503 (overloaded) and 429 (rate limited). */
export function isTransient(e: unknown): boolean {
  const err = e as { status?: number; code?: number; message?: string };
  const status = err.status ?? err.code;
  if (status === 503 || status === 429) return true;
  return /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded/i.test(err.message ?? "");
}

/** Groq: 429, any 5xx, or a network failure/timeout (status 0). Other 4xx (bad key, bad request) will not fix themselves. */
export function isGroqTransient(e: unknown): boolean {
  const status = (e as { status?: number }).status;
  return status === 0 || status === 429 || (status !== undefined && status >= 500);
}

/** Retry with exponential backoff + jitter: ~1s, 2s, 4s between attempts. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 4, transient: (e: unknown) => boolean = isTransient): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await fn(); }
    catch (e) {
      if (i >= attempts - 1 || !transient(e)) throw e;
      await sleep(1000 * 2 ** i + Math.random() * 400);
    }
  }
}

export type Turn = { role: "user" | "bot"; content: string };

/* ---------- generation ---------- */
async function groqComplete(system: string, history: Turn[], message: string): Promise<string> {
  const messages = [
    { role: "system", content: system },
    ...history.map((m) => ({ role: m.role === "bot" ? "assistant" : "user", content: m.content })),
    { role: "user", content: message },
  ];
  let res: Response;
  try {
    res = await fetch(`${groqBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: groqModel(), messages, temperature: 0.1, max_tokens: 512 }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw Object.assign(new Error(`Groq request failed: ${(e as Error).message}`), { status: 0 });
  }
  if (!res.ok) {
    throw Object.assign(new Error(`Groq ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`), { status: res.status });
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string | null } }[] };
  return (json.choices?.[0]?.message?.content ?? "").trim();
}

export async function answerFromContext(system: string, history: Turn[], message: string): Promise<string> {
  if (provider() === "groq") return withRetry(() => groqComplete(system, history, message), 3, isGroqTransient);

  const contents = [...history, { role: "user" as const, content: message }].map((m) => ({
    role: m.role === "bot" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const res = await withRetry(() =>
    ai().models.generateContent({ model: model(), contents, config: { systemInstruction: system, temperature: 0.1 } }),
  );
  return (res.text ?? "").trim();
}
