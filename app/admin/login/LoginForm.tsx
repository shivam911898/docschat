"use client";
import { useState } from "react";
import { AlertIcon, EyeIcon, EyeOffIcon } from "../../components/Icons";

export default function LoginForm({ error }: { error?: string }) {
  const [show, setShow] = useState(false);
  const message = error === "rate" ? "Too many attempts. Wait a minute, then try again." : error ? "That password is not correct. Check it and try again." : "";
  return (
    <form action="/api/admin/login" method="post" className="auth-form">
      <label htmlFor="password" className="label">Password</label>
      <div className="field">
        <input
          id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password"
          autoFocus required aria-invalid={message ? true : undefined} aria-describedby={message ? "login-error" : undefined}
        />
        <button type="button" className="field-btn" onClick={() => setShow((v) => !v)} aria-pressed={show} aria-label={show ? "Hide password" : "Show password"}>
          {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>
      {message && <p id="login-error" className="msg-err" role="alert"><AlertIcon size={16} />{message}</p>}
      <button className="btn primary lg block">Log in</button>
    </form>
  );
}
