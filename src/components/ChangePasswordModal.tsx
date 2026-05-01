import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<{ error: string | null }>;
}

export function ChangePasswordModal({ open, onClose, onSubmit }: Props) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const pwRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPw("");
    setConfirm("");
    setBusy(false);
    setError(null);
    setDone(false);
    setTimeout(() => pwRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error: e2 } = await onSubmit(pw);
    setBusy(false);
    if (e2) setError(e2);
    else setDone(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-strong modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">Change password</div>
          {!done && (
            <div className="modal-sub">
              Pick a new password — at least 6 characters.
            </div>
          )}
        </div>
        {done ? (
          <div className="modal-body">
            <div className="modal-success">Password updated.</div>
            <div className="modal-actions">
              <button type="button" className="btn primary modal-btn" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className="modal-body" onSubmit={handleSubmit}>
            <label className="auth-label" htmlFor="cp-new">New password</label>
            <input
              ref={pwRef}
              id="cp-new"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="auth-input"
              disabled={busy}
            />
            <label className="auth-label" htmlFor="cp-confirm" style={{ marginTop: 6 }}>
              Confirm
            </label>
            <input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input"
              disabled={busy}
            />
            {error && <div className="auth-error" style={{ marginTop: 4 }}>{error}</div>}
            <div className="modal-actions">
              <button type="button" className="btn modal-btn" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn primary modal-btn" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
