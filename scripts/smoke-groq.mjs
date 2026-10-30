// One real question through a RUNNING app that uses Groq. For the owner to run once GROQ_API_KEY exists.
//   Terminal 1:  set GROQ_API_KEY in .env (or the environment), then  npm run dev
//   Terminal 2:  $env:GROQ_API_KEY="gsk_..."; node scripts/smoke-groq.mjs [baseUrl] ["your question"]
// The key in THIS process is only a guard; the running server needs the key too. Exits 1 if Groq did not answer.
const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const QUESTION = process.argv[3] || "How much is the Business plan?";

if (!process.env.GROQ_API_KEY) {
  console.error("GROQ_API_KEY is not set in this shell. Set it (and make sure the server has it too), then re-run.");
  process.exit(1);
}

async function main() {
  const health = await (await fetch(BASE + "/api/health")).json();
  console.log(`provider=${health.provider} model=${health.model} mode=${health.mode} docs=${health.docs}`);
  if (health.provider !== "groq") {
    console.error(`Server reports provider "${health.provider}", not "groq". Check GROQ_API_KEY / LLM_PROVIDER on the server and restart it.`);
    process.exit(1);
  }

  const r = await fetch(BASE + "/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: QUESTION, history: [], sessionId: "smoke-groq-" + Date.now() }),
  });
  const j = await r.json().catch(() => ({}));
  console.log(`\nQ: ${QUESTION}\nA: ${j.reply ?? JSON.stringify(j)}\nsources=${JSON.stringify(j.sources)} mode=${j.mode} status=${r.status}`);

  if (j.mode !== "ai") {
    console.error("\nThe answer came from the extractive fallback, so the Groq call failed after retries. Check the server log (bad key, quota, or model name in GROQ_MODEL).");
    process.exit(1);
  }
  console.log("\nGroq answered.");
}

main().catch((e) => { console.error("smoke-groq crashed:", e.message); process.exit(1); });
