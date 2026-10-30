import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ready } from "../../lib/boot";
import { isAdmin, adminConfigured } from "../../lib/auth";
import { llmModel, provider } from "../../lib/llm";
import { MAX_UPLOAD_BYTES } from "../../lib/config";
import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin - DocsChat" };

type Lead = { id: number; name: string; email: string; company: string; message: string; created_at: string };
type Conv = { session_id: string; role: string; content: string; created_at: string };

export default async function Admin() {
  if (!adminConfigured() || !(await isAdmin())) redirect("/admin/login");
  const s = await ready();
  const docs = await s.all<{ name: string; n: number }>("SELECT doc_name AS name, COUNT(*) AS n FROM chunks GROUP BY doc_name ORDER BY doc_name");
  const leads = await s.all<Lead>("SELECT * FROM leads ORDER BY id DESC LIMIT 200");
  const convs = await s.all<Conv>("SELECT session_id, role, content, created_at FROM conversations ORDER BY id DESC LIMIT 100");
  const [{ msgs }] = await s.all<{ msgs: number }>("SELECT COUNT(*) AS msgs FROM conversations WHERE role='user'");
  const [{ chunks }] = await s.all<{ chunks: number }>("SELECT COUNT(*) AS chunks FROM chunks");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const origin = (process.env.PUBLIC_URL || `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`).replace(/\/$/, "");
  const prov = provider();
  const ai = prov !== "none";

  return (
    <div className="admin-wrap">
      <div className="admin-top">
        <h1>DocsChat admin</h1>
        <div className="actions">
          <span className={`pill ${ai ? "ok" : "warn"}`}>{ai ? `AI mode (${prov === "groq" ? "Groq" : "Gemini"}: ${llmModel()})` : "Demo mode (no AI key)"}</span>
          <span className="pill ok">Storage: {s.kind === "turso" ? "Turso" : "SQLite"}</span>
          <a className="btn small" href="/chat" target="_blank" rel="noreferrer">Open chat</a>
          <form action="/api/admin/logout" method="post"><button className="btn small">Log out</button></form>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{docs.length}</b><span>Documents</span></div>
        <div className="stat"><b>{chunks}</b><span>Indexed chunks</span></div>
        <div className="stat"><b>{leads.length}</b><span>Leads captured</span></div>
        <div className="stat"><b>{msgs}</b><span>Visitor questions</span></div>
      </div>

      <section className="card">
        <h2>Knowledge base</h2>
        <UploadForm docs={docs} maxMb={MAX_UPLOAD_BYTES / 1024 / 1024} />
      </section>

      <section className="card">
        <h2>Leads ({leads.length})</h2>
        {leads.length === 0 ? <p className="empty">No leads yet. In the chat, type &ldquo;I&rsquo;d like a quote&rdquo; to try the lead flow.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>When (UTC)</th><th>Name</th><th>Email</th><th>Company</th><th>Message</th></tr></thead>
            <tbody>{leads.map((l) => (
              <tr key={l.id}><td>{l.created_at}</td><td>{l.name}</td><td><a href={`mailto:${l.email}`}>{l.email}</a></td><td>{l.company}</td><td>{l.message}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>

      <section className="card">
        <h2>Embed on your website</h2>
        <pre className="codeblock"><code>{`<script src="${origin}/widget.js" defer></script>`}</code></pre>
      </section>

      <section className="card">
        <h2>Recent conversation log</h2>
        {convs.length === 0 ? <p className="empty">No conversations yet.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Time (UTC)</th><th>Session</th><th>Who</th><th>Message</th></tr></thead>
            <tbody>{convs.map((c, i) => (
              <tr key={i}><td>{c.created_at}</td><td>{String(c.session_id).slice(0, 6)}</td><td>{c.role}</td><td style={{ whiteSpace: "pre-wrap" }}>{c.content}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}
