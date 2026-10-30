import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ready } from "../../lib/boot";
import { isAdmin, adminConfigured } from "../../lib/auth";
import { llmModel, provider } from "../../lib/llm";
import { MAX_FILES_PER_UPLOAD, MAX_UPLOAD_BYTES } from "../../lib/config";
import CodeBlock from "../components/CodeBlock";
import Logo from "../components/Logo";
import { ChatIcon, InboxIcon, LogOutIcon } from "../components/Icons";
import UploadForm from "./UploadForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

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
    <>
      <header className="site-header">
        <div className="container site-nav">
          <a className="brand" href="/"><Logo size={32} /><span>DocsChat</span></a>
          <div className="bar-actions">
            <a className="btn sm" href="/chat" target="_blank" rel="noreferrer"><ChatIcon size={16} />Open chat</a>
            <form action="/api/admin/logout" method="post"><button className="btn sm"><LogOutIcon size={16} />Log out</button></form>
          </div>
        </div>
      </header>

      <main className="container admin">
        <div className="page-head">
          <div>
            <h1>DocsChat admin</h1>
            <p className="muted">Manage what the chatbot knows and review who it has talked to.</p>
          </div>
          <div className="pills">
            <span className={`pill ${ai ? "ok" : "warn"}`}>{ai ? `AI mode (${prov === "groq" ? "Groq" : "Gemini"}: ${llmModel()})` : "Demo mode (no AI key)"}</span>
            <span className="pill ok">Storage: {s.kind === "turso" ? "Turso" : "SQLite"}</span>
          </div>
        </div>

        <nav className="subnav" aria-label="Sections">
          <a href="#documents">Documents</a>
          <a href="#leads">Leads</a>
          <a href="#conversations">Conversations</a>
          <a href="#embed">Embed code</a>
        </nav>

        <div className="stats">
          <div className="stat"><span>Documents</span><b>{docs.length}</b></div>
          <div className="stat"><span>Indexed chunks</span><b>{chunks}</b></div>
          <div className="stat"><span>Leads captured</span><b>{leads.length}</b></div>
          <div className="stat"><span>Visitor questions</span><b>{msgs}</b></div>
        </div>

        <section className="card" id="documents" aria-labelledby="documents-title">
          <div className="card-head">
            <h2 id="documents-title">Documents</h2>
            <p>Everything the chatbot knows comes from these files. Delete the sample documents when you go live.</p>
          </div>
          <UploadForm docs={docs} maxMb={MAX_UPLOAD_BYTES / 1024 / 1024} maxFiles={MAX_FILES_PER_UPLOAD} />
        </section>

        <section className="card" id="leads" aria-labelledby="leads-title">
          <div className="card-head">
            <h2 id="leads-title">Leads <span className="count">{leads.length}</span></h2>
            <p>People who asked for a quote, callback or demo and confirmed their details in the chat.</p>
          </div>
          {leads.length === 0 ? (
            <div className="empty-state">
              <InboxIcon size={22} />
              <p><strong>No leads yet.</strong></p>
              <p>Open the chat and type &ldquo;I&rsquo;d like a quote&rdquo; to try the lead flow. Confirmed requests appear here.</p>
              <a className="btn sm" href="/chat" target="_blank" rel="noreferrer">Open chat</a>
            </div>
          ) : (
            <div className="table-wrap"><table>
              <thead><tr><th>When (UTC)</th><th>Name</th><th>Email</th><th>Company</th><th>Message</th></tr></thead>
              <tbody>{leads.map((l) => (
                <tr key={l.id}><td className="nowrap">{l.created_at}</td><td>{l.name}</td><td><a href={`mailto:${l.email}`}>{l.email}</a></td><td>{l.company}</td><td>{l.message}</td></tr>
              ))}</tbody>
            </table></div>
          )}
        </section>

        <section className="card" id="conversations" aria-labelledby="conversations-title">
          <div className="card-head">
            <h2 id="conversations-title">Conversations</h2>
            <p>The latest 100 messages across all visitors, newest first. Session is the first 6 characters of the visitor&rsquo;s chat session.</p>
          </div>
          {convs.length === 0 ? (
            <div className="empty-state">
              <ChatIcon size={22} />
              <p><strong>No conversations yet.</strong></p>
              <p>Questions asked in the chat or the website widget are logged here so you can see what customers want to know.</p>
              <a className="btn sm" href="/chat" target="_blank" rel="noreferrer">Open chat</a>
            </div>
          ) : (
            <div className="table-wrap"><table>
              <thead><tr><th>Time (UTC)</th><th>Session</th><th>From</th><th>Message</th></tr></thead>
              <tbody>{convs.map((c, i) => (
                <tr key={i}>
                  <td className="nowrap">{c.created_at}</td>
                  <td><code>{String(c.session_id).slice(0, 6)}</code></td>
                  <td><span className={`pill ${c.role === "user" ? "info" : "neutral"}`}>{c.role === "user" ? "Visitor" : "Bot"}</span></td>
                  <td className="prewrap">{c.content}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </section>

        <section className="card" id="embed" aria-labelledby="embed-title">
          <div className="card-head">
            <h2 id="embed-title">Embed code</h2>
            <p>Paste this line just before the closing <code>&lt;/body&gt;</code> tag of your website. A chat bubble appears in the bottom-right corner.</p>
          </div>
          <CodeBlock code={`<script src="${origin}/widget.js" defer></script>`} />
        </section>
      </main>
    </>
  );
}
