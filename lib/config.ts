// Central runtime config. Everything is read lazily so env changes apply without a rebuild.
export const businessName = () => process.env.BUSINESS_NAME || "Northwind Supply Co.";
export const businessContact = () => process.env.BUSINESS_CONTACT || "support@northwindsupply.example";
export const model = () => process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
export const groqModel = () => process.env.GROQ_MODEL || "openai/gpt-oss-120b";
/** Retried once when the primary Groq model is rate limited (Groq caps tokens per day per model). Unset = default; empty = off. */
export const groqFallbackModel = () => { const v = process.env.GROQ_FALLBACK_MODEL; return v === undefined ? "openai/gpt-oss-20b" : v.trim(); };
export const groqBaseUrl = () => (process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1").replace(/\/+$/, "");
export const rateLimitPerMin = () => Number(process.env.RATE_LIMIT_PER_MIN) || 20;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB per file
export const MAX_FILES_PER_UPLOAD = 5;
export const ALLOWED_UPLOAD = /\.(pdf|txt|md)$/i;
export const MAX_MESSAGE_CHARS = 1000;

export const DEMO_BANNER = "Demo mode: showing best-matching text; connect an AI key for conversational answers";

export const fallbackReply = () =>
  `I couldn't find that in ${businessName()}'s documents, so I won't guess. You can email ${businessContact()}, or say "I'd like a callback" and I'll pass your details to the team.`;
