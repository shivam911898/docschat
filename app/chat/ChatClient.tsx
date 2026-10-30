"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Logo from "../components/Logo";
import { AlertIcon, ArrowUpIcon, CheckIcon, FileIcon, XIcon } from "../components/Icons";

type Kind = "answer" | "fallback" | "lead" | "saved" | "error";
type Msg = { role: "user" | "bot"; content: string; kind?: Kind; sources?: string[]; step?: string };

const SUGGESTIONS = [
  "How much is the Business plan?",
  "Can I return an opened item?",
  "Do you ship to Canada?",
  "I'd like a quote for 200 water bottles",
];

const LEAD_STEPS = ["name", "email", "company", "message", "confirm"];
// The fixed "I don't know" reply from lib/config.ts (fallbackReply) starts with this sentence.
const FALLBACK_START = /^I couldn['’]t find that in /;

type QuickReply = { label: string; send: string };
function quickReplies(step?: string): QuickReply[] {
  if (step === "confirm") return [{ label: "Yes, send it", send: "yes" }, { label: "No, cancel", send: "no" }];
  if (step === "company" || step === "message") return [{ label: "Skip", send: "skip" }, { label: "Cancel request", send: "cancel" }];
  return [{ label: "Cancel request", send: "cancel" }];
}

export default function ChatClient({ demo: demoInitial, business, banner }: { demo: boolean; business: string; banner: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", content: `Hi! I'm the ${business} assistant. Ask me about pricing, shipping, returns or products, or ask for a quote or callback.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(demoInitial);
  const sid = useRef("s" + Math.random().toString(36).slice(2, 12));
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the latest message (instant when the visitor prefers reduced motion).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [msgs, busy]);

  // Grow the textarea with its content (up to its CSS max-height); shrink back when cleared.
  useEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = "auto";
    if (input) el.style.height = el.scrollHeight + "px"; // empty: let CSS min-height win, a long placeholder must not grow the box
  }, [input]);

  // Inside the widget iframe, Escape asks the host page to close the panel.
  useEffect(() => {
    if (window.self === window.top) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") closeWidget(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function closeWidget() {
    window.parent.postMessage({ type: "docschat:close" }, "*");
  }

  async function ask(text: string) {
    text = text.trim();
    if (!text || busy) return;
    const history = msgs.slice(1).filter((m) => m.kind !== "error").map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, sessionId: sid.current }),
      });
      const j = await r.json().catch(() => ({}));
      if (typeof j.demo === "boolean") setDemo(j.demo);
      if (!r.ok || !j.reply) {
        setMsgs((m) => [...m, { role: "bot", kind: "error", content: j.error ?? "Something went wrong. Please try again." }]);
      } else {
        const sources: string[] = Array.isArray(j.sources) ? j.sources : [];
        const step: string | undefined = typeof j.leadStep === "string" ? j.leadStep : undefined;
        const kind: Kind = j.leadSaved ? "saved" : step ? "lead" : !sources.length && FALLBACK_START.test(j.reply) ? "fallback" : "answer";
        // Some models emit narrow no-break spaces (U+202F) before units, which render as "$99per month"; show plain spaces.
        const content = String(j.reply).replace(/[   ]/g, " ");
        setMsgs((m) => [...m, { role: "bot", kind, content, sources, step }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "bot", kind: "error", content: "Network error. Check your connection and try again." }]);
    }
    setBusy(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter inserts a newline. Ignore Enter while an IME composition is active.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      ask(input);
    }
  }

  const last = msgs.length - 1;
  const empty = msgs.length === 1;

  return (
    <div className="chat-page">
      <div className="chat-shell">
        <header className="chat-head">
          <Logo size={40} className="chat-logo" />
          <div className="chat-id">
            <h1 className="chat-title">{business}</h1>
            <p className="chat-sub"><FileIcon size={14} />Answers from your documents</p>
          </div>
          <a className="btn sm only-standalone" href="/">Home</a>
          <button type="button" className="icon-btn only-embedded" onClick={closeWidget} aria-label="Close chat"><XIcon size={20} /></button>
        </header>

        {demo && <div className="banner" role="status"><AlertIcon size={16} /><span>{banner}</span></div>}

        <div className="msgs" ref={scroller} role="log" aria-live="polite" aria-label="Conversation">
          {msgs.map((m, i) => {
            const isLast = i === last;
            const step = m.step ? LEAD_STEPS.indexOf(m.step) + 1 : 0;
            return (
              <div key={i} className={`row ${m.role}`}>
                {m.role === "bot" && <span className="bot-avatar"><Logo size={28} /></span>}
                <div className="stack">
                  {m.role === "user" ? (
                    <div className="bubble">{m.content}</div>
                  ) : m.kind === "fallback" ? (
                    <div className="bubble panel">
                      <div className="panel-label">Not in the documents</div>
                      {m.content}
                      {isLast && (
                        <div className="panel-actions">
                          <button type="button" className="btn sm primary" onClick={() => ask("I'd like a callback")} disabled={busy}>Request a callback</button>
                        </div>
                      )}
                    </div>
                  ) : m.kind === "lead" ? (
                    <div className="bubble panel">
                      <div className="panel-label">
                        <span>Contact request</span>
                        {step > 0 && <span className="panel-step">Step {step} of {LEAD_STEPS.length}</span>}
                      </div>
                      {m.content}
                      {isLast && (
                        <div className="panel-actions">
                          {quickReplies(m.step).map((q) => (
                            <button key={q.label} type="button" className={`btn sm${q.send === "yes" ? " primary" : ""}`} onClick={() => ask(q.send)} disabled={busy}>{q.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : m.kind === "saved" ? (
                    <div className="bubble success">
                      <div className="panel-label"><CheckIcon size={14} />Request sent</div>
                      {m.content}
                    </div>
                  ) : m.kind === "error" ? (
                    <div className="bubble error" role="alert">
                      <div className="panel-label"><AlertIcon size={14} />Message not sent</div>
                      {m.content}
                    </div>
                  ) : (
                    <div className="bubble">{m.content}</div>
                  )}
                  {m.sources && m.sources.length > 0 && (
                    <div className="sources">
                      <span>Source</span>
                      {m.sources.map((s) => <span key={s} className="src-chip" title={`Answer based on ${s}`}><FileIcon size={12} />{s}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="row bot">
              <span className="bot-avatar"><Logo size={28} /></span>
              <div className="stack">
                <div className="bubble" role="status">
                  <span className="typing" aria-hidden="true"><i /><i /><i /></span>
                  <span className="sr-only">The assistant is typing</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="composer-wrap">
          {empty && (
            <div className="suggest" aria-label="Suggested questions">
              {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => ask(s)} disabled={busy}>{s}</button>)}
            </div>
          )}
          <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <textarea
              ref={field} rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown}
              placeholder="Ask about pricing or returns" aria-label="Your message" maxLength={1000}
              autoComplete="off" enterKeyHint="send"
            />
            <button type="submit" className="btn primary send" disabled={busy || !input.trim()} aria-label="Send message">
              <span className="send-label">Send</span><ArrowUpIcon size={18} />
            </button>
          </form>
          <p className="composer-note">
            <span className="hide-xs">Enter to send, Shift+Enter for a new line. </span>
            Powered by <a href="/" target="_blank" rel="noopener noreferrer">DocsChat</a>
          </p>
        </div>
      </div>
    </div>
  );
}
