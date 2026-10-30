"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckIcon, FileIcon, TrashIcon, UploadIcon, XIcon } from "../components/Icons";

type Doc = { name: string; n: number };
type Result = { name: string; chunks?: number; error?: string };

const ALLOWED = /\.(pdf|txt|md)$/i;
const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default function UploadForm({ docs, maxMb, maxFiles }: { docs: Doc[]; maxMb: number; maxFiles: number }) {
  const router = useRouter();
  const maxBytes = maxMb * 1024 * 1024;
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Doc | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  // Open the native modal dialog (focus trap + Escape for free) whenever a delete is pending.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (toDelete && !d.open) d.showModal();
    if (!toDelete && d.open) d.close();
  }, [toDelete]);

  function addFiles(list: FileList | File[]) {
    const next: File[] = [...files];
    const issues: string[] = [];
    for (const f of Array.from(list)) {
      if (!ALLOWED.test(f.name)) { issues.push(`${f.name}: only PDF, TXT and MD files are accepted.`); continue; }
      if (f.size > maxBytes) { issues.push(`${f.name}: ${fmtSize(f.size)} is over the ${maxMb} MB limit.`); continue; }
      const dup = next.findIndex((x) => x.name === f.name);
      if (dup >= 0) next[dup] = f;
      else if (next.length >= maxFiles) { issues.push(`${f.name}: only ${maxFiles} files can be uploaded at a time.`); }
      else next.push(f);
    }
    setFiles(next);
    setProblems(issues);
    setResults([]); setError(""); setNotice("");
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }

  async function upload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!files.length || busy) return;
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    setBusy(true); setError(""); setResults([]); setNotice("");
    try {
      const r = await fetch("/api/docs", { method: "POST", body: fd });
      if (r.status === 401) { router.push("/admin/login"); return; }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setError(j.error ?? "Upload failed. Try again.");
      else { setResults(j.results); setFiles([]); setProblems([]); }
    } catch { setError("Upload failed. Check your connection and try again."); }
    setBusy(false);
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const name = toDelete.name;
    setDeleting(true); setError("");
    try {
      const r = await fetch("/api/docs?name=" + encodeURIComponent(name), { method: "DELETE" });
      if (r.status === 401) { router.push("/admin/login"); return; }
      if (!r.ok) setError(`Could not delete ${name}. Try again.`);
      else { setNotice(`Deleted ${name}. The chatbot no longer answers from it.`); setResults([]); }
    } catch { setError(`Could not delete ${name}. Check your connection and try again.`); }
    setDeleting(false);
    setToDelete(null);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={upload}>
        <label
          className={`dropzone${dragging ? " is-dragging" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={input} className="sr-only" type="file" name="files" accept=".pdf,.txt,.md" multiple
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />
          <span className="dropzone-icon"><UploadIcon size={22} /></span>
          <span className="dropzone-title">Drop files here, or <span className="dropzone-link">choose files</span></span>
          <span className="dropzone-hint">PDF, TXT or Markdown &middot; up to {maxMb} MB each &middot; up to {maxFiles} files at a time</span>
        </label>

        {problems.length > 0 && (
          <ul className="notes" role="alert">{problems.map((p) => <li key={p} className="msg-err">{p}</li>)}</ul>
        )}

        {files.length > 0 && (
          <ul className="file-list" aria-label="Files ready to upload">
            {files.map((f) => (
              <li key={f.name}>
                <FileIcon size={16} className="file-ico" />
                <span className="file-name">{f.name}</span>
                <span className="hint">{fmtSize(f.size)}</span>
                <button type="button" className="icon-btn sm" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((x) => x !== f))}><XIcon size={16} /></button>
              </li>
            ))}
          </ul>
        )}

        <div className="form-actions">
          <button className="btn primary" disabled={busy || files.length === 0}>
            {busy ? <><span className="spinner" aria-hidden="true" />Indexing...</> : files.length > 1 ? `Upload and index ${files.length} files` : "Upload and index"}
          </button>
          <span className="hint">Re-uploading a file with the same name replaces it. Scanned PDFs without text cannot be read.</span>
        </div>
      </form>

      <div className="notes" role="status" aria-live="polite">
        {error && <p className="msg-err">{error}</p>}
        {notice && <p className="msg-ok"><CheckIcon size={16} />{notice}</p>}
        {results.map((r) => (
          <p key={r.name} className={r.error ? "msg-err" : "msg-ok"}>
            {r.error ? null : <CheckIcon size={16} />}{r.name}: {r.error ?? `indexed (${r.chunks} chunks)`}
          </p>
        ))}
      </div>

      {docs.length === 0 ? (
        <div className="empty-state">
          <FileIcon size={22} />
          <p><strong>No documents yet.</strong></p>
          <p>Drop a PDF, TXT or Markdown file above. The chatbot can answer from it within seconds.</p>
        </div>
      ) : (
        <ul className="doc-list" aria-label="Indexed documents">
          {docs.map((d) => (
            <li key={d.name}>
              <FileIcon size={18} className="file-ico" />
              <span className="doc-name">{d.name}</span>
              <span className="pill neutral">{d.n} {d.n === 1 ? "chunk" : "chunks"}</span>
              <button type="button" className="btn sm danger-ghost" onClick={() => setToDelete(d)}><TrashIcon size={16} />Delete<span className="sr-only"> {d.name}</span></button>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={dialog} className="dialog" aria-labelledby="delete-title" onClose={() => setToDelete(null)}>
        <h3 id="delete-title">Delete this document?</h3>
        <p>
          <strong className="break">{toDelete?.name}</strong> and its {toDelete?.n} indexed {toDelete?.n === 1 ? "chunk" : "chunks"} will be removed.
          The chatbot will stop answering from it. This cannot be undone.
        </p>
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={() => setToDelete(null)} disabled={deleting} autoFocus>Cancel</button>
          <button type="button" className="btn danger" onClick={confirmDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete document"}</button>
        </div>
      </dialog>
    </div>
  );
}
