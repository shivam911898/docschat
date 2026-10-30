"use client";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons";

/** Code box with a copy-to-clipboard button. Falls back to execCommand where the Clipboard API is unavailable (plain http). */
export default function CodeBlock({ code, label = "HTML" }: { code: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.setAttribute("readonly", "");
      ta.className = "sr-only";
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    setState(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2200);
  }

  return (
    <div className="codebox">
      <div className="codebox-bar">
        <span className="codebox-label">{label}</span>
        <button type="button" className={`btn sm codebox-copy${state === "copied" ? " is-done" : ""}`} onClick={copy}>
          {state === "copied" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          {state === "copied" ? "Copied" : state === "failed" ? "Press Ctrl+C" : "Copy code"}
        </button>
      </div>
      <pre tabIndex={0}><code>{code}</code></pre>
      <span className="sr-only" role="status">{state === "copied" ? "Embed code copied to clipboard" : ""}</span>
    </div>
  );
}
