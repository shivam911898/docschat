"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = { name: string; chunks?: number; error?: string };

export default function UploadForm({ docs, maxMb }: { docs: { name: string; n: number }[]; maxMb: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true); setError(""); setResults([]);
    try {
      const r = await fetch("/api/docs", { method: "POST", body: new FormData(form) });
      if (r.status === 401) { router.push("/admin/login"); return; }
      const j = await r.json();
      if (!r.ok) setError(j.error ?? "Upload failed");
      else { setResults(j.results); form.reset(); }
    } catch { setError("Upload failed - check your connection."); }
    setBusy(false);
    router.refresh();
  }
  async function del(name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    await fetch("/api/docs?name=" + encodeURIComponent(name), { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={upload} className="upload-row">
        <input type="file" name="files" accept=".pdf,.txt,.md" multiple required />
        <button className="btn primary small" disabled={busy}>{busy ? "Indexing..." : "Upload & index"}</button>
      </form>
      <p className="hint">PDF, TXT or MD &middot; up to {maxMb} MB per file &middot; re-uploading a file with the same name replaces it.</p>
      {error && <p className="msg-err">{error}</p>}
      {results.map((r) => (
        <p key={r.name} className={r.error ? "msg-err" : "msg-ok"}>{r.name}: {r.error ?? `indexed (${r.chunks} chunks)`}</p>
      ))}
      <ul className="doc-list">
        {docs.length === 0 && <li className="empty">No documents yet. Upload one above.</li>}
        {docs.map((d) => (
          <li key={d.name}>
            <span>{d.name} <span className="hint">({d.n} chunks)</span></span>
            <button className="btn small" onClick={() => del(d.name)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
