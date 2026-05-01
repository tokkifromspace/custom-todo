import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { AuthScreen } from "./AuthScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading, passwordRecovery } = useAuth();

  if (loading) {
    return <div className="auth-shell mesh-cool" data-theme="light" />;
  }
  // While the user is in the password-recovery flow we keep them on the auth
  // screen even though Supabase has issued a (recovery-scoped) session. The
  // app stays gated until they pick a new password.
  if (!session || passwordRecovery) {
    return <AuthScreen />;
  }
  return <>{children}</>;
}
