import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function origin() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function Home() {
  const base = await origin();
  return (
    <>
      <div className="container">
        <nav className="nav">
          <a className="logo" href="/"><span className="logo-mark">{"\u{1F4AC}"}</span> DocsChat</a>
          <div className="nav-links">
            <a className="hide-sm" href="#embed">Embed</a>
            <a href="/chat">Demo</a>
            <a href="/admin">Admin</a>
          </div>
        </nav>

        <header className="hero">
          <span className="eyebrow">AI chatbot trained on your documents</span>
          <h1>Turn your docs into a 24/7 support agent</h1>
          <p className="lead">
            DocsChat answers customer questions straight from your own PDFs, FAQs and policies, and captures a lead
            whenever someone asks for a quote, a callback or a demo.
          </p>
          <div className="cta">
            <a className="btn primary" href="/chat">Try the demo</a>
            <a className="btn" href="/admin">Admin</a>
          </div>
        </header>

        <section className="features" aria-label="Key features">
          <div className="feature">
            <div className="icon">{"\u{1F4C4}"}</div>
            <h3>Answers only from your documents</h3>
            <p>Upload PDF, TXT or Markdown files. The bot cites what it found and says &ldquo;I don&rsquo;t know&rdquo; instead of making things up.</p>
          </div>
          <div className="feature">
            <div className="icon">{"\u{1F4E5}"}</div>
            <h3>Captures leads automatically</h3>
            <p>When a visitor asks for a quote or callback it collects name, email and details, confirms, and saves to your dashboard or Google Sheet.</p>
          </div>
          <div className="feature">
            <div className="icon">{"⚡"}</div>
            <h3>Live on your site in minutes</h3>
            <p>One script tag adds a chat bubble to any website: WordPress, Shopify, Wix, Webflow or plain HTML. No developers needed.</p>
          </div>
        </section>
      </div>

      <section className="section" id="embed">
        <div className="container">
          <h2>Embed on your site</h2>
          <p>Paste this single line just before the closing <code>&lt;/body&gt;</code> tag of your website:</p>
          <pre className="codeblock"><code>{`<script src="${base}/widget.js" defer></script>`}</code></pre>
          <p>A chat bubble appears in the bottom-right corner of every page. Or share the full-page chat at <a href="/chat">{base}/chat</a>.</p>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          Demo data: the fictional store &ldquo;Northwind Supply Co.&rdquo;. DocsChat is a portfolio project, available as a custom build for your business.
        </div>
      </footer>
    </>
  );
}
