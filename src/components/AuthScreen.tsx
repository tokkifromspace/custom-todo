import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../lib/auth";

type Mode = "signin" | "signup" | "magic";

export function AuthScreen() {
  const { signInWithPassword, signUpWithPassword, signInWithMagicLink } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setErrorMsg(null);
    if (mode === "magic") {
      const { error } = await signInWithMagicLink(email.trim());
      if (error) setErrorMsg(error);
      else setMagicSent(true);
    } else if (mode === "signup") {
      const { error } = await signUpWithPassword(email.trim(), password);
      if (error) setErrorMsg(error);
    } else {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) setErrorMsg(error);
    }
    setBusy(false);
  };

  const headerTitle =
    mode === "signup" ? "Create your account"
    : mode === "magic" ? "Sign in via magic link"
    : "Welcome back";
  const headerSub =
    mode === "signup" ? "Pick an email and password to start."
    : mode === "magic" ? "We'll email you a one-time link."
    : "Sign in with email and password.";
  const submitLabel =
    busy ? (mode === "magic" ? "Sending…" : "Signing in…")
    : mode === "signup" ? "Sign up"
    : mode === "magic" ? "Send magic link"
    : "Sign in";

  return (
    <div className="auth-shell mesh-cool" data-theme="light">
      <div className="auth-card glass-strong">
        <div className="auth-header">
          <div className="auth-mark" />
          <div className="auth-title">{headerTitle}</div>
          <div className="auth-sub">{headerSub}</div>
        </div>
        {mode === "magic" && magicSent ? (
          <div className="auth-success">
            <div className="auth-success-title">Check your inbox</div>
            <div className="auth-success-sub">
              We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setMagicSent(false);
                setMode("signin");
                setEmail("");
              }}
            >
              Back to sign in
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
              disabled={busy}
            />
            {mode !== "magic" && (
              <>
                <label className="auth-label" htmlFor="auth-password" style={{ marginTop: 4 }}>
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  disabled={busy}
                />
              </>
            )}
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            <button type="submit" className="btn primary auth-submit" disabled={busy}>
              {submitLabel}
            </button>
            <div className="auth-switch">
              {mode === "signin" && (
                <>
                  <button type="button" className="auth-link" onClick={() => { setMode("signup"); setErrorMsg(null); }}>
                    Create account
                  </button>
                  <span className="auth-switch-sep">·</span>
                  <button type="button" className="auth-link" onClick={() => { setMode("magic"); setErrorMsg(null); }}>
                    Use magic link
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button type="button" className="auth-link" onClick={() => { setMode("signin"); setErrorMsg(null); }}>
                  Already have an account? Sign in
                </button>
              )}
              {mode === "magic" && (
                <button type="button" className="auth-link" onClick={() => { setMode("signin"); setErrorMsg(null); }}>
                  Back to password sign in
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
