import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { AuthScreen } from "./AuthScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="auth-shell mesh-cool" data-theme="light" />;
  }
  if (!session) {
    return <AuthScreen />;
  }
  return <>{children}</>;
}
