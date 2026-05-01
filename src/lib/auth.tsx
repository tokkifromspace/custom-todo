import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  passwordRecovery: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  // Magic link is for *returning* users only; new users must sign up with a password.
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  // Sends a recovery email so a user who forgot their password can set a new one.
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  // Called from the password-recovery screen after the user clicks the email link.
  completePasswordRecovery: (newPassword: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// We persist the recovery flag in sessionStorage so a refresh during the
// reset flow doesn't drop the user back into the app with a recovery-scoped
// session and no password set.
const RECOVERY_KEY = "auth.passwordRecovery";

function readPersistedRecovery(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(RECOVERY_KEY) === "1";
  } catch {
    return false;
  }
}

function writePersistedRecovery(value: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(RECOVERY_KEY, "1");
    else window.sessionStorage.removeItem(RECOVERY_KEY);
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

// Detect the recovery hash up-front in case the auth-state listener registers
// after Supabase has already fired the PASSWORD_RECOVERY event.
function hashIndicatesRecovery(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  return hash.includes("type=recovery");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecoveryState] = useState(
    () => readPersistedRecovery() || hashIndicatesRecovery(),
  );

  const setPasswordRecovery = (value: boolean) => {
    setPasswordRecoveryState(value);
    writePersistedRecovery(value);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
        // Block magic-link signup — funnels new users to the password sign-up
        // form so they always have a password set.
        shouldCreateUser: false,
      },
    });
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message ?? null };
  };

  const completePasswordRecovery = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    setPasswordRecovery(false);
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPasswordRecovery(false);
    // Drop SW caches so the next user on this device can't read the previous
    // user's task data from a stale REST cache.
    if ("caches" in window) {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      } catch {
        // Cache deletion is best-effort; log-out itself already succeeded.
      }
    }
  };

  const value: AuthContextValue = {
    session,
    loading,
    passwordRecovery,
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
    resetPassword,
    completePasswordRecovery,
    updatePassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
