import { headers } from "next/headers";
import CodeBlock from "./components/CodeBlock";
import Logo from "./components/Logo";
import { CodeIcon, FileIcon, HelpIcon, InboxIcon, LayoutIcon, ShieldIcon } from "./components/Icons";

export const dynamic = "force-dynamic";

const GITHUB = "https://github.com/shivam911898";

async function origin() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const STEPS = [
  { title: "Upload your documents", body: "Add PDF, TXT or Markdown files in the admin. They are split into searchable passages in seconds." },
  { title: "Visitors ask in plain language", body: "The bot finds the matching passages and answers from them, naming the file it used." },
  { title: "Leads reach you", body: "When someone asks for a quote or callback, the bot collects their details and saves them to your dashboard or Google Sheet." },
];

const FEATURES = [
  { icon: <FileIcon size={20} />, title: "Answers only from your documents", body: "Every answer shows the source file, so you and your customers can check it." },
  { icon: <HelpIcon size={20} />, title: "Says “I don’t know”", body: "If it is not in your documents, the bot says so and offers a human follow-up instead of inventing prices or policies." },
  { icon: <InboxIcon size={20} />, title: "Captures leads", body: "Quote, callback and demo requests collect name, email, company and message, then ask for confirmation before saving." },
  { icon: <CodeIcon size={20} />, title: "One-line website embed", body: "A single script tag adds a chat bubble to WordPress, Shopify, Wix, Webflow or plain HTML." },
  { icon: <LayoutIcon size={20} />, title: "Simple admin dashboard", body: "Upload or delete documents, read leads and the conversation log, and copy the embed code." },
  { icon: <ShieldIcon size={20} />, title: "Safe to leave public", body: "Rate-limited chat, a 5 MB upload cap, PDF/TXT/MD only, and the admin sits behind a password." },
];

export default async function Home() {
  const base = await origin();
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="site-header">
        <div className="container site-nav">
          <a className="brand" href="/"><Logo size={32} /><span>DocsChat</span></a>
          <nav className="nav-links" aria-label="Main">
            <a className="hide-sm" href="#how">How it works</a>
            <a className="hide-sm" href="#features">Features</a>
            <a className="hide-sm" href="#embed">Embed</a>
            <a href="/admin">Admin</a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="container hero">
          <div className="hero-copy">
            <span className="eyebrow">AI chatbot trained on your documents</span>
            <h1>Turn your docs into a 24/7 support agent</h1>
            <p className="lead">
              DocsChat answers customer questions straight from your own PDFs, FAQs and policies, and says &ldquo;I don&rsquo;t know&rdquo; instead of guessing.
            </p>
            <p className="audience">
              Made for shops, agencies and service businesses that answer the same pricing, shipping and returns questions every day.
            </p>
            <div className="cta">
              <a className="btn primary lg" href="/chat">Try the demo chat</a>
              <a className="btn lg" href="/admin">See the admin</a>
            </div>
            <p className="hint">The demo runs on a fictional store, Northwind Supply Co. The admin is password-protected.</p>
          </div>

          <div className="mock" aria-hidden="true">
            <div className="mock-head">
              <Logo size={32} />
              <div>
                <div className="mock-title">Northwind Supply Co.</div>
                <div className="mock-sub">Answers from your documents</div>
              </div>
            </div>
            <div className="mock-body">
              <div className="row user"><div className="stack"><div className="bubble">How much is the Business plan?</div></div></div>
              <div className="row bot">
                <span className="bot-avatar"><Logo size={28} /></span>
                <div className="stack">
                  <div className="bubble">The Business plan is $99 per month for up to 25 seats. It includes a 15% discount on orders, net-30 invoicing and a dedicated account manager.</div>
                  <div className="sources"><span>Source</span><span className="src-chip"><FileIcon size={12} />pricing.md</span></div>
                </div>
              </div>
              <div className="row user"><div className="stack"><div className="bubble">Do you sell kayaks?</div></div></div>
              <div className="row bot">
                <span className="bot-avatar"><Logo size={28} /></span>
                <div className="stack">
                  <div className="bubble panel">
                    <div className="panel-label">Not in the documents</div>
                    I couldn&rsquo;t find that in the documents, so I won&rsquo;t guess. Say &ldquo;I&rsquo;d like a callback&rdquo; and I&rsquo;ll pass your details to the team.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container section" id="how" aria-labelledby="how-title">
          <div className="section-head">
            <h2 id="how-title">How it works</h2>
            <p>Three steps from a folder of documents to a chatbot on your site.</p>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num" aria-hidden="true">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="container section" id="features" aria-labelledby="features-title">
          <div className="section-head">
            <h2 id="features-title">Built to be trusted</h2>
            <p>A support bot is only useful if customers can rely on what it says.</p>
          </div>
          <div className="features">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container section" id="embed" aria-labelledby="embed-title">
          <div className="section-head">
            <h2 id="embed-title">Embed on your site</h2>
            <p>Paste this single line just before the closing <code>&lt;/body&gt;</code> tag of your website.</p>
          </div>
          <CodeBlock code={`<script src="${base}/widget.js" defer></script>`} />
          <p className="hint">
            A chat bubble appears in the bottom-right corner of every page. You can also share the full-page chat at <a href="/chat">{base}/chat</a>.
          </p>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <p>
            Built by Shivam Kumar Yadav &middot;{" "}
            <a href={GITHUB} target="_blank" rel="noopener noreferrer">GitHub</a>
          </p>
          <p>Demo data: the fictional store &ldquo;Northwind Supply Co.&rdquo;. DocsChat is a portfolio project, available as a custom build for your business.</p>
        </div>
      </footer>
    </>
  );
}
