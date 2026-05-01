import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../lib/auth";

export function AuthScreen() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg(null);
    const { error } = await signInWithMagicLink(email.trim());
    if (error) {
      setStatus("error");
      setErrorMsg(error);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="auth-shell mesh-cool" data-theme="light">
      <div className="auth-card glass-strong">
        <div className="auth-header">
          <div className="auth-mark" />
          <div className="auth-title">Welcome back</div>
          <div className="auth-sub">Sign in with a magic link — no password needed.</div>
        </div>
        {status === "sent" ? (
          <div className="auth-success">
            <div className="auth-success-title">Check your inbox</div>
            <div className="auth-success-sub">
              We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setStatus("idle");
                setEmail("");
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit}>
            <label className="auth-label" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              disabled={status === "sending"}
            />
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            <button type="submit" className="btn primary auth-submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
