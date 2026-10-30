"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; content: string; sources?: string[]; saved?: boolean };

const SUGGESTIONS = [
  "How much is the Business plan?",
  "What is your return policy?",
  "Do you ship to Germany?",
  "I'd like a quote for 200 water bottles",
];

export default function ChatClient({ demo: demoInitial, business, banner }: { demo: boolean; business: string; banner: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", content: `Hi! I'm the ${business} assistant. Ask me about pricing, shipping, returns or products, or ask for a quote or callback.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(demoInitial);
  const [framed, setFramed] = useState(false);
  const sid = useRef("s" + Math.random().toString(36).slice(2, 12));
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);
  useEffect(() => {
    const inFrame = window.self !== window.top;
    setFramed(inFrame);
    if (inFrame) document.body.classList.add("embedded");
  }, []);

  async function ask(text: string) {
    text = text.trim();
    if (!text || busy) return;
    const history = msgs.slice(1).map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, sessionId: sid.current }),
      });
      const j = await r.json();
      if (typeof j.demo === "boolean") setDemo(j.demo);
      setMsgs((m) => [...m, { role: "bot", content: j.reply ?? j.error ?? "Something went wrong.", sources: j.sources, saved: j.leadSaved }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", content: "Network error - please check your connection and try again." }]);
    }
    setBusy(false);
  }

  return (
    <div className="chat-page">
      <div className="chat-shell">
        <div className="chat-head">
          <div className="avatar">{"\u{1F4AC}"}</div>
          <div>
            <div className="title">{business} Assistant</div>
            <div className="sub">Answers from our documents &middot; usually replies instantly</div>
          </div>
          {!framed && <a href="/">&larr; Home</a>}
        </div>
        {demo && <div className="banner" role="status">{banner}</div>}
        <div className="msgs" aria-live="polite">
          {msgs.map((m, i) => (
            <div key={i} className={`row ${m.role}`}>
              <div className={`bubble${m.saved ? " saved" : ""}`}>{m.content}</div>
              {m.sources && m.sources.length > 0 && <div className="src">Source: {m.sources.join(", ")}</div>}
            </div>
          ))}
          {busy && <div className="typing">typing&hellip;</div>}
          <div ref={end} />
        </div>
        {msgs.length === 1 && (
          <div className="chips">
            {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => ask(s)}>{s}</button>)}
          </div>
        )}
        <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your question..." aria-label="Your message" maxLength={1000} autoComplete="off" />
          <button disabled={busy || !input.trim()}>Send</button>
        </form>
      </div>
    </div>
  );
}
