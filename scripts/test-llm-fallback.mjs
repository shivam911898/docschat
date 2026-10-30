// Offline test of the Groq model fallback: a local FAKE Groq server, no network, no real key.   npm run test:llm
// Covers lib/llm.ts (answerFromContext) and the /api/chat route handler: a daily-cap (TPD) 429 on the primary model
// is retried once on GROQ_FALLBACK_MODEL and the reply reports the model that answered.
import http from "node:http";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const PRIMARY = "openai/gpt-oss-120b";
const FALLBACK = "openai/gpt-oss-20b";
const TPD = "Rate limit reached for model `openai/gpt-oss-120b` in organization `org_test` service tier `on_demand` on tokens per day (TPD): Limit 200000, Used 199724, Requested 923. Please try again in 4m39.504s. Need more tokens? Upgrade to Dev Tier";

// ---- fake Groq: scripted replies are consumed from `queue`; after that it answers like a good model
const seen = [];
let queue = [];
const ok = (model) => ({ status: 200, body: { id: "x", model, choices: [{ index: 0, message: { role: "assistant", content: `Answer from ${model}` }, finish_reason: "stop" }] } });
const err = (status, message) => ({ status, body: { error: { message, type: "test_error" } } });
const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    const body = JSON.parse(raw);
    seen.push({ path: req.url, auth: req.headers.authorization, body });
    const step = queue.length ? queue.shift() : ok(body.model);
    res.writeHead(step.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(step.body));
  });
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docschat-llm-"));
Object.assign(process.env, {
  GROQ_API_KEY: "fake-groq-key", LLM_PROVIDER: "groq", GROQ_BASE_URL: `http://127.0.0.1:${server.address().port}/openai/v1`,
  DATA_DIR: tmp, AUTO_SEED: "1", RATE_LIMIT_PER_MIN: "1000",
});
for (const k of ["GEMINI_API_KEY", "GROQ_MODEL", "GROQ_FALLBACK_MODEL", "TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"]) delete process.env[k];

const { answerFromContext } = await import("../lib/llm.ts");
const { POST } = await import("../app/api/chat/route.ts");

let failed = 0;
const check = (cond, msg) => { console.log((cond ? "PASS  " : "FAIL  ") + msg); if (!cond) failed++; };
const reset = (...steps) => { queue = steps; seen.length = 0; };
const quietly = async (fn) => { // capture console.warn / console.error output of the code under test
  const lines = [], w = console.warn, e = console.error;
  console.warn = console.error = (...a) => lines.push(a.join(" "));
  try { return [await fn(), lines]; } finally { console.warn = w; console.error = e; }
};
const ask = (message = "How much is the Business plan?") =>
  POST(new Request("http://localhost/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, history: [], sessionId: "test-fallback" }) })).then((r) => r.json());

try {
  // --- primary healthy
  reset();
  let [r] = await quietly(() => answerFromContext("sys", [], "hi"));
  check(seen.length === 1 && seen[0].body.model === PRIMARY && seen[0].auth === "Bearer fake-groq-key" && r.model === PRIMARY && r.reply === `Answer from ${PRIMARY}`,
    `healthy: one call on ${PRIMARY}, model reported (${r.model})`);

  // --- daily token cap on the primary -> the SAME request once on the fallback, no backoff
  reset(err(429, TPD));
  const t0 = Date.now();
  let lines;
  [r, lines] = await quietly(() => answerFromContext("sys", [{ role: "user", content: "earlier" }], "hi"));
  const dt = Date.now() - t0;
  check(seen.length === 2 && seen[0].body.model === PRIMARY && seen[1].body.model === FALLBACK
    && JSON.stringify(seen[0].body.messages) === JSON.stringify(seen[1].body.messages)
    && r.model === FALLBACK && r.reply === `Answer from ${FALLBACK}`,
    `TPD 429: same request retried on ${FALLBACK}, result clean, reports the fallback model (${r.model})`);
  check(dt < 900, `TPD 429: no backoff before the fallback (${dt} ms)`);
  check(lines.filter((l) => l.includes("fallback")).length === 1 && !lines.join(" ").includes("fake-groq-key"), "fallback logs exactly one line, no API key in it");

  // --- chat API response carries the model that answered
  reset(err(429, TPD));
  let out;
  [out] = await quietly(() => ask());
  check(out.mode === "ai" && out.model === FALLBACK && out.demo === false && /Answer from/.test(out.reply) && seen.length === 2,
    `/api/chat after a TPD 429: mode=${out.mode}, model=${out.model}`);
  reset();
  [out] = await quietly(() => ask());
  check(out.mode === "ai" && out.model === PRIMARY, `/api/chat healthy: model=${out.model}`);
  reset();
  [out] = await quietly(() => ask("hello"));
  check(out.model === null && seen.length === 0, "/api/chat greeting: no model call, model=null");

  // --- the fallback fails too -> fails as today (the route degrades to an extractive answer)
  reset(err(429, TPD), err(429, TPD));
  let thrown;
  await quietly(() => answerFromContext("sys", [], "hi").catch((e) => (thrown = e)));
  check(seen.length === 2 && thrown?.status === 429 && /fallback/.test(thrown.message), "both models at their daily cap: 2 calls, then the error surfaces");
  reset(err(429, TPD), err(429, TPD));
  [out] = await quietly(() => ask());
  check(out.mode === "extractive" && out.model === null && out.demo === false, "route: both capped -> extractive answer, model=null");

  // --- fallback disabled
  process.env.GROQ_FALLBACK_MODEL = "";
  reset(err(429, TPD));
  thrown = undefined;
  await quietly(() => answerFromContext("sys", [], "hi").catch((e) => (thrown = e)));
  check(seen.length === 1 && thrown?.status === 429, "GROQ_FALLBACK_MODEL empty: fallback disabled, TPD 429 fails as before");
  delete process.env.GROQ_FALLBACK_MODEL;

  // --- a 429 that survives the retries (not a daily cap) -> fallback; a persistent 500 does not
  reset(err(429, "Rate limit reached on requests per minute"), err(429, "again"), err(429, "again"));
  [r] = await quietly(() => answerFromContext("sys", [], "hi"));
  check(seen.length === 4 && seen.slice(0, 3).every((s) => s.body.model === PRIMARY) && seen[3].body.model === FALLBACK && r.model === FALLBACK,
    `429 after all 3 tries: one more call on the fallback (${seen.length} calls)`);
  reset(err(500, "boom"), err(500, "boom"), err(500, "boom"));
  thrown = undefined;
  await quietly(() => answerFromContext("sys", [], "hi").catch((e) => (thrown = e)));
  check(seen.length === 3 && thrown?.status === 500, "persistent 500: 3 tries on the primary, fallback not used");
} finally {
  server.close();
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* the SQLite file stays locked on Windows until exit; it is in the OS temp dir */ }
}

console.log(failed ? `\n${failed} CHECK(S) FAILED` : "\nALL CHECKS PASSED");
process.exit(failed ? 1 : 0);
