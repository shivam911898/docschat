import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login - DocsChat" };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (adminConfigured() && (await isAdmin())) redirect("/admin");
  const { error } = await searchParams;
  return (
    <div className="container">
      <div className="card login">
        <h2>Admin login</h2>
        {!adminConfigured() ? (
          <p className="msg-err">Admin is locked: set the <code>ADMIN_PASSWORD</code> environment variable and restart.</p>
        ) : (
          <form action="/api/admin/login" method="post">
            <label htmlFor="password" className="hint">Password</label>
            <input id="password" type="password" name="password" autoComplete="current-password" autoFocus required />
            {error && <p className="msg-err">{error === "rate" ? "Too many attempts - wait a minute." : "Wrong password."}</p>}
            <button className="btn primary">Log in</button>
          </form>
        )}
        <p className="hint"><a href="/">&larr; Back to home</a></p>
      </div>
    </div>
  );
}
