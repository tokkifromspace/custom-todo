import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../lib/auth";

type Mode = "signin" | "signup" | "magic" | "reset";

export function AuthScreen() {
  const {
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    resetPassword,
    completePasswordRecovery,
    passwordRecovery,
    signOut,
  } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Clear any leftover password input when entering the recovery flow so a
  // value typed in another mode doesn't appear pre-filled in the new-password
  // field.
  useEffect(() => {
    if (passwordRecovery) {
      setPassword("");
      setErrorMsg(null);
    }
  }, [passwordRecovery]);

  // ── Password recovery (after user clicks reset email link) ──────────────
  if (passwordRecovery) {
    const onRecoverSubmit = async (e: FormEvent) => {
      e.preventDefault();
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        return;
      }
      setBusy(true);
      setErrorMsg(null);
      const { error } = await completePasswordRecovery(password);
      if (error) setErrorMsg(error);
      setBusy(false);
    };
    return (
      <div className="auth-shell mesh-cool" data-theme="light">
        <div className="auth-card glass-strong">
          <div className="auth-header">
            <div className="auth-mark" />
            <div className="auth-title">Set a new password</div>
            <div className="auth-sub">Pick a password to finish signing back in.</div>
          </div>
          <form className="auth-form" onSubmit={onRecoverSubmit}>
            <label className="auth-label" htmlFor="auth-new-password">
              New password
            </label>
            <input
              id="auth-new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              disabled={busy}
              autoFocus
            />
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
            <button type="submit" className="btn primary auth-submit" disabled={busy}>
              {busy ? "Saving…" : "Save password"}
            </button>
            <div className="auth-switch">
              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  void signOut();
                }}
                disabled={busy}
              >
                Cancel and sign out
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── Standard sign-in / sign-up / magic / reset flows ────────────────────
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
    } else if (mode === "reset") {
      const { error } = await resetPassword(email.trim());
      if (error) setErrorMsg(error);
      else setResetSent(true);
    } else {
      const { error } = await signInWithPassword(email.trim(), password);
      if (error) setErrorMsg(error);
    }
    setBusy(false);
  };

  const headerTitle =
    mode === "signup" ? "Create your account"
    : mode === "magic" ? "Sign in via magic link"
    : mode === "reset" ? "Reset your password"
    : "Welcome back";
  const headerSub =
    mode === "signup" ? "Pick an email and password to start."
    : mode === "magic" ? "We'll email you a one-time link. Returning users only."
    : mode === "reset" ? "We'll email you a link to set a new password."
    : "Sign in with email and password.";
  const submitLabel =
    busy ? (mode === "magic" || mode === "reset" ? "Sending…" : "Signing in…")
    : mode === "signup" ? "Sign up"
    : mode === "magic" ? "Send magic link"
    : mode === "reset" ? "Send reset link"
    : "Sign in";

  const switchTo = (m: Mode) => {
    setMode(m);
    setErrorMsg(null);
    setPassword("");
    setMagicSent(false);
    setResetSent(false);
  };

  return (
    <div className="auth-shell mesh-cool" data-theme="light">
      <div className="auth-card glass-strong">
        <div className="auth-header">
          <div className="auth-mark" />
          <div className="auth-title">{headerTitle}</div>
          <div className="auth-sub">{headerSub}</div>
        </div>
        {(mode === "magic" && magicSent) || (mode === "reset" && resetSent) ? (
          <div className="auth-success">
            <div className="auth-success-title">Check your inbox</div>
            <div className="auth-success-sub">
              {mode === "magic"
                ? <>We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.</>
                : <>We sent a password reset link to <b>{email}</b>. Open it on this device to set a new password.</>}
            </div>
            <button
              type="button"
              className="btn"
              onClick={() => switchTo("signin")}
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
            {(mode === "signin" || mode === "signup") && (
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
                  <button type="button" className="auth-link" onClick={() => switchTo("signup")}>
                    Create account
                  </button>
                  <span className="auth-switch-sep">·</span>
                  <button type="button" className="auth-link" onClick={() => switchTo("reset")}>
                    Forgot password?
                  </button>
                  <span className="auth-switch-sep">·</span>
                  <button type="button" className="auth-link" onClick={() => switchTo("magic")}>
                    Use magic link
                  </button>
                </>
              )}
              {mode === "signup" && (
                <button type="button" className="auth-link" onClick={() => switchTo("signin")}>
                  Already have an account? Sign in
                </button>
              )}
              {mode === "magic" && (
                <button type="button" className="auth-link" onClick={() => switchTo("signin")}>
                  Back to password sign in
                </button>
              )}
              {mode === "reset" && (
                <button type="button" className="auth-link" onClick={() => switchTo("signin")}>
                  Back to sign in
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
