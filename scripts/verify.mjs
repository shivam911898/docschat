// End-to-end smoke test against a RUNNING server (npm run dev / npm start / a deployed URL).
//   node scripts/verify.mjs [baseUrl]            (default http://localhost:3000)
//   ADMIN_PASSWORD must match the server's ADMIN_PASSWORD (default used here: verify-pass)
// Works in demo (no key) and AI mode (Groq or Gemini). Exits 1 if any check fails.
const BASE = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
import fs from "node:fs";
function passwordFromDotEnv() {
  try { return fs.readFileSync(".env", "utf8").match(/^ADMIN_PASSWORD=(.+)$/m)?.[1]?.trim(); } catch { return undefined; }
}
const PASSWORD = process.env.ADMIN_PASSWORD || passwordFromDotEnv() || "verify-pass";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = Date.now();
const email = `verify+${stamp}@example.com`;
const sid = `verify-${stamp}`;

let failed = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : detail ? "  -> " + detail : ""}`);
  if (!ok) failed++;
}

async function chat(message, history = [], sessionId = sid) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(BASE + "/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, sessionId }),
    });
    if (r.status === 429 && attempt < 2) { // earlier run still inside the 1-minute window: wait it out
      const wait = Number(r.headers.get("retry-after") || 30);
      console.log(`      (rate limited, waiting ${wait}s)`);
      await sleep((wait + 1) * 1000);
      continue;
    }
    return { status: r.status, json: await r.json().catch(() => ({})), headers: r.headers };
  }
}

async function main() {
  console.log(`Verifying ${BASE}\n`);

  // --- pages + health -------------------------------------------------------
  const home = await fetch(BASE + "/");
  const homeHtml = await home.text();
  check("GET / returns 200 with hero + embed snippet", home.status === 200 && homeHtml.includes("Turn your docs into a 24/7 support agent") && homeHtml.includes("/widget.js"));
  const chatPage = await fetch(BASE + "/chat");
  const chatHtml = await chatPage.text();
  check("GET /chat returns 200", chatPage.status === 200);
  const health = await (await fetch(BASE + "/api/health")).json();
  check("GET /api/health ok and sample docs auto-seeded", health.ok && health.docs >= 4, JSON.stringify(health));
  const demo = health.mode !== "ai";
  console.log(`      mode=${health.mode} provider=${health.provider} model=${health.model} storage=${health.storage}`);
  if (demo) check("demo banner is rendered on /chat", chatHtml.includes("Demo mode: showing best-matching text; connect an AI key for conversational answers"));
  else check("no demo banner on /chat when an AI provider is configured", !chatHtml.includes('class="banner"'));

  // --- Q&A ------------------------------------------------------------------
  let r = await chat("How much is the Business plan?");
  check("pricing question answered ($99)", r.status === 200 && r.json.reply?.includes("$99"), JSON.stringify(r.json).slice(0, 200));
  check("answer cites a source", r.json.sources?.includes("pricing.md"), JSON.stringify(r.json.sources));
  if (demo) check("no-key mode flags demo=true", r.json.demo === true);

  r = await chat("What is your return policy?");
  check("returns question answered (30 days)", r.json.reply?.includes("30 days"), r.json.reply?.slice(0, 120));

  r = await chat("Do you sell kayaks?");
  check("out-of-scope question gets the safe fallback (no invention)", /couldn't find|could not find|don't have/i.test(r.json.reply ?? "") && !r.json.sources?.length, r.json.reply?.slice(0, 120));

  // --- lead capture ---------------------------------------------------------
  const lsid = sid + "-lead";
  r = await chat("I'd like a quote for 200 water bottles", [], lsid);
  check("quote request starts lead flow (asks name)", r.json.leadStep === "name" && /name/i.test(r.json.reply), r.json.reply);
  r = await chat("Jane Verify", [], lsid);
  check("name accepted, asks email", r.json.leadStep === "email");
  r = await chat("not-an-email", [], lsid);
  check("invalid email rejected and re-asked", r.json.leadStep === "email" && /valid email/i.test(r.json.reply), r.json.reply);
  r = await chat(email, [], lsid);
  check("valid email accepted, asks company", r.json.leadStep === "company");
  r = await chat("Acme Test Co", [], lsid);
  check("company accepted, asks message", r.json.leadStep === "message");
  r = await chat("200 Atlas bottles, delivery in March", [], lsid);
  check("message accepted, shows confirmation summary", r.json.leadStep === "confirm" && r.json.reply.includes(email), r.json.reply);
  r = await chat("yes", [], lsid);
  check("confirmation saves the lead", r.json.leadSaved === true && !r.json.leadStep, JSON.stringify(r.json).slice(0, 200));

  // --- admin protection -----------------------------------------------------
  const noAuth = await fetch(BASE + "/admin", { redirect: "manual" });
  check("/admin redirects to login when logged out", [302, 303, 307, 308].includes(noAuth.status) && (noAuth.headers.get("location") || "").includes("/admin/login"), `${noAuth.status} ${noAuth.headers.get("location")}`);
  const noAuthUpload = await fetch(BASE + "/api/docs", { method: "POST", body: new FormData() });
  check("POST /api/docs requires login (401)", noAuthUpload.status === 401, String(noAuthUpload.status));
  const noAuthDelete = await fetch(BASE + "/api/docs?name=faq.md", { method: "DELETE" });
  check("DELETE /api/docs requires login (401)", noAuthDelete.status === 401, String(noAuthDelete.status));

  const bad = await fetch(BASE + "/api/admin/login", { method: "POST", body: new URLSearchParams({ password: "definitely-wrong" }), redirect: "manual" });
  check("wrong password rejected", bad.status === 303 && (bad.headers.get("location") || "").includes("error") && !bad.headers.getSetCookie().length, `${bad.status} ${bad.headers.get("location")}`);
  const good = await fetch(BASE + "/api/admin/login", { method: "POST", body: new URLSearchParams({ password: PASSWORD }), redirect: "manual" });
  const cookie = (good.headers.getSetCookie()[0] || "").split(";")[0];
  check("correct password logs in (cookie set)", good.status === 303 && cookie.startsWith("docschat_admin="), `${good.status} ${good.headers.get("location")}`);
  const H = { Cookie: cookie };

  const admin = await fetch(BASE + "/admin", { headers: H, redirect: "manual" });
  const adminHtml = await admin.text();
  check("admin dashboard loads when logged in", admin.status === 200 && adminHtml.includes("DocsChat admin"), String(admin.status));
  check("captured lead is visible in admin", adminHtml.includes(email) && adminHtml.includes("Acme Test Co"));

  // --- upload limits --------------------------------------------------------
  const upload = async (file) => {
    const fd = new FormData(); fd.append("files", file);
    const res = await fetch(BASE + "/api/docs", { method: "POST", body: fd, headers: H });
    return { status: res.status, json: await res.json().catch(() => ({})) };
  };
  let u = await upload(new File([new Uint8Array(5 * 1024 * 1024 + 1).fill(97)], "big.txt", { type: "text/plain" }));
  check("upload over 5 MB rejected", /too large/i.test(u.json.results?.[0]?.error ?? u.json.error ?? ""), JSON.stringify(u.json));
  u = await upload(new File(["MZ binary"], "malware.exe", { type: "application/octet-stream" }));
  check("upload of .exe rejected", /unsupported/i.test(u.json.results?.[0]?.error ?? ""), JSON.stringify(u.json));
  u = await upload(new File([`# Verify Widget\n\nThe Verify Widget costs $12.34 and ships in zebra-striped boxes.`], `verify-${stamp}.md`, { type: "text/markdown" }));
  check("small .md upload indexed", u.status === 200 && u.json.results?.[0]?.chunks >= 1, JSON.stringify(u.json));
  r = await chat("What do zebra boxes hold?", [], sid + "-up");
  check("newly uploaded doc is searchable", r.json.reply?.includes("Verify Widget") || r.json.reply?.includes("zebra"), r.json.reply?.slice(0, 160));
  const del = await fetch(BASE + `/api/docs?name=${encodeURIComponent(`verify-${stamp}.md`)}`, { method: "DELETE", headers: H });
  check("uploaded doc can be deleted", del.status === 200);

  // --- rate limit (last: it throttles this client for a minute) -------------
  const codes = [];
  for (let i = 0; i < 30; i++) {
    const res = await fetch(BASE + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "hi", sessionId: "rl-" + stamp }) });
    codes.push(res.status);
    if (res.status === 429) { check("chat API rate-limits bursts (429 + Retry-After)", !!res.headers.get("retry-after")); break; }
  }
  if (!codes.includes(429)) check("chat API rate-limits bursts (429)", false, "no 429 in 30 requests");

  console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("verify crashed:", e); process.exit(1); });
