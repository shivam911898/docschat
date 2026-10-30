import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "../../../lib/auth";
import Logo from "../../components/Logo";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (adminConfigured() && (await isAdmin())) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className="auth-page">
      <div className="card auth-card">
        <a className="brand" href="/"><Logo size={32} /><span>DocsChat</span></a>
        <h1>Admin login</h1>
        {!adminConfigured() ? (
          <div className="alert danger" role="alert">
            Admin is locked. Set the <code>ADMIN_PASSWORD</code> environment variable and restart the app.
          </div>
        ) : (
          <>
            <p className="muted">Enter the admin password for this deployment to manage documents and leads.</p>
            <LoginForm error={error} />
          </>
        )}
        <p className="hint"><a href="/">&larr; Back to home</a></p>
      </div>
    </main>
  );
}
