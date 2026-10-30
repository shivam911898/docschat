// Rule-based lead capture: a small deterministic state machine, identical with or without an AI key.
// Deterministic on purpose - a model can never "forget" to ask for an email or invent a submission.
import { store } from "./db";
import { appendLeadToSheet } from "./sheets";
import { businessName } from "./config";

type Step = "name" | "email" | "company" | "message" | "confirm";
export type LeadState = { step: Step; name?: string; email?: string; company?: string; message?: string };

const INTENT = /\b(quote|quotation|call[\s-]?back|call me|ring me|demo|talk to (sales|someone|somebody|a (human|person|rep|agent))|speak (to|with)|contact me|get in touch|reach out to me|sales (team|rep)|have someone)\b/i;
const CANCEL = /^\s*(cancel|stop|never ?mind|nevermind|forget it|exit|quit)\b/i;
const SKIP = /^\s*(skip|none|no|nope|n\/a|na|-|nothing)\s*[.!]*\s*$/i;
const YES = /^\s*(y|yes|yep|yeah|yup|sure|ok|okay|confirm|correct|submit|send( it)?|looks good|go ahead)\b/i;
const NO = /^\s*(n|no|nope|nah|wrong|incorrect)\b/i;
const EMAIL = /[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}/;

export const wantsLead = (msg: string) => INTENT.test(msg);

const PROMPTS: Record<Step, string> = {
  name: "Happy to set that up. What's your name?",
  email: "Thanks! What's the best email address to reach you at?",
  company: "Which company are you with? (Type \"skip\" if you'd rather not say.)",
  message: "Anything you'd like the team to know - e.g. product, quantity or timeline? (Type \"skip\" to leave it blank.)",
  confirm: "",
};
export const promptFor = (s: LeadState) => (s.step === "confirm" ? summary(s) : PROMPTS[s.step]);

const clip = (s: string, n: number) => s.trim().replace(/\s+/g, " ").slice(0, n);
function summary(s: LeadState) {
  return [
    "Please confirm your request:",
    `• Name: ${s.name}`,
    `• Email: ${s.email}`,
    `• Company: ${s.company || "-"}`,
    `• Message: ${s.message || "-"}`,
    "Shall I send this to the team? (yes / no)",
  ].join("\n");
}

export async function loadState(sessionId: string): Promise<LeadState | null> {
  const rows = await (await store()).all<{ data: string; updated_at: string }>("SELECT data, updated_at FROM lead_state WHERE session_id=?", [sessionId]);
  if (!rows.length) return null;
  if (Date.now() - new Date(rows[0].updated_at.replace(" ", "T") + "Z").getTime() > 3600_000) { await clearState(sessionId); return null; } // abandoned after 1h
  return JSON.parse(rows[0].data) as LeadState;
}
const saveState = async (sessionId: string, s: LeadState) =>
  void (await (await store()).run("INSERT INTO lead_state(session_id,data,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(session_id) DO UPDATE SET data=excluded.data, updated_at=CURRENT_TIMESTAMP", [sessionId, JSON.stringify(s)]));
export const clearState = async (sessionId: string) =>
  void (await (await store()).run("DELETE FROM lead_state WHERE session_id=?", [sessionId]));

export async function startLead(sessionId: string): Promise<string> {
  const s: LeadState = { step: "name" };
  await saveState(sessionId, s);
  return promptFor(s);
}

export type LeadTurn = { reply: string; done?: "saved" | "cancelled"; lead?: { name: string; email: string } };

/** Advance the flow by one user message. Caller has already checked a state exists. */
export async function advanceLead(sessionId: string, state: LeadState, text: string): Promise<LeadTurn> {
  if (CANCEL.test(text)) {
    await clearState(sessionId);
    return { reply: 'No problem, I\'ve cancelled that. Ask me anything else, or say "quote" whenever you want to start again.', done: "cancelled" };
  }
  const s = { ...state };
  switch (s.step) {
    case "name": {
      const name = clip(text.replace(/^(my name is|i am|i'm|im|it's|its|this is|name:)\s+/i, ""), 80);
      if (name.length < 2 || name.includes("@") || name.split(" ").length > 6) return { reply: "Sorry, I didn't catch your name. What should I call you?" };
      s.name = name; s.step = "email";
      break;
    }
    case "email": {
      const m = text.match(EMAIL);
      if (!m) return { reply: "That doesn't look like a valid email address. Could you re-enter it (e.g. name@company.com)?" };
      s.email = m[0].slice(0, 120); s.step = "company";
      break;
    }
    case "company":
      s.company = SKIP.test(text) ? "" : clip(text, 120); s.step = "message";
      break;
    case "message":
      s.message = SKIP.test(text) ? "" : clip(text, 1000); s.step = "confirm";
      break;
    case "confirm": {
      if (YES.test(text)) {
        const st = await store();
        await st.run("INSERT INTO leads(name,email,company,message,session_id) VALUES(?,?,?,?,?)", [s.name, s.email, s.company ?? "", s.message ?? "", sessionId]);
        await appendLeadToSheet([new Date().toISOString(), s.name!, s.email!, s.company ?? "", s.message ?? ""]);
        await clearState(sessionId);
        return {
          reply: `Thanks, ${s.name}! Your request is with the ${businessName()} team and we'll email you at ${s.email} within one business day. Anything else I can help with?`,
          done: "saved", lead: { name: s.name!, email: s.email! },
        };
      }
      if (NO.test(text)) {
        await clearState(sessionId);
        return { reply: 'No problem - nothing was sent. Say "quote" any time to start again.', done: "cancelled" };
      }
      return { reply: 'Please reply "yes" to send this to the team, or "no" to cancel.\n\n' + summary(s) };
    }
  }
  await saveState(sessionId, s);
  return { reply: promptFor(s) };
}
