"use client";

import * as React from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

import { getFirebaseAuth, getFirebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { ensureUserProfile, logoutUser } from "@/lib/firebase/auth";
import type { AppUser } from "@/types";

/** How often an unverified session re-checks Firebase Auth, in ms. */
const VERIFICATION_POLL_MS = 5000;

interface AuthContextValue {
  /** Raw Firebase Auth user (null when signed out). */
  firebaseUser: User | null;
  /** Firestore profile with role + disabled flag. */
  profile: AppUser | null;
  /** True while the initial auth state is being resolved. */
  loading: boolean;
  isSignedIn: boolean;
  /**
   * Verified email state, kept in React state because `user.reload()` mutates
   * the User object in place (same reference, no re-render).
   */
  emailVerified: boolean;
  isModerator: boolean;
  isAdmin: boolean;
  /** Whether the account may create reports/comments (verified email). */
  canPost: boolean;
  refreshProfile: () => Promise<void>;
  /** Re-reads `emailVerified` from Firebase Auth (and refreshes token claims). */
  refreshVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [emailVerified, setEmailVerified] = React.useState(false);

  /**
   * Pulls the freshest verification state from Firebase Auth.
   *
   * `user.reload()` refreshes the user record, and `getIdToken(true)` forces a
   * new ID token. That second call matters: Firestore rules read
   * `request.auth.token.email_verified`, which is baked into the token and would
   * otherwise still be false after verification, making writes fail.
   */
  const refreshVerification = React.useCallback(async (): Promise<boolean> => {
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      setEmailVerified(false);
      return false;
    }

    try {
      await user.reload();
      if (user.emailVerified) {
        // Refresh token claims so security rules see email_verified == true.
        await user.getIdToken(true);
      }
      setEmailVerified(user.emailVerified);
      return user.emailVerified;
    } catch {
      // Offline or transient failure - keep the last known value.
      return false;
    }
  }, []);

  // Track Firebase Auth sessions.
  React.useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let profileUnsub: (() => void) | undefined;
    let cancelled = false;

    const authUnsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      profileUnsub?.();
      profileUnsub = undefined;
      if (cancelled) return;

      setFirebaseUser(user);
      setEmailVerified(user?.emailVerified ?? false);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Backfill the profile doc for accounts created before this app existed,
      // then subscribe so role changes propagate live.
      void ensureUserProfile(user)
        .then(() => {
          if (cancelled) return;
          profileUnsub = onSnapshot(
            doc(getFirebaseDb(), "users", user.uid),
            (snapshot) => {
              if (!snapshot.exists()) {
                setProfile(null);
                return;
              }
              setProfile({
                uid: user.uid,
                ...(snapshot.data() as Omit<AppUser, "uid">),
              });
            },
            () => {
              // Rules may deny reads for disabled/nonexistent docs; keep going.
              setProfile(null);
            },
          );
        })
        .catch(() => {
          // Offline or rules rejection - browsing still works as a guest.
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
      profileUnsub?.();
      authUnsub();
    };
  }, []);

  // Detect email verification without a manual reload: Firebase has no push
  // channel for it, so re-check when the tab regains focus and poll while the
  // session is unverified and visible.
  React.useEffect(() => {
    if (!isFirebaseConfigured || !firebaseUser || emailVerified) return;

    let cancelled = false;

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const verified = await refreshVerification();
      if (!cancelled && verified) {
        toast.success("Email verified — you can post now.");
      }
    };

    const interval = window.setInterval(() => {
      void check();
    }, VERIFICATION_POLL_MS);

    const onFocus = () => {
      void check();
    };

    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [firebaseUser, emailVerified, refreshVerification]);

  // A disabled account is signed out immediately.
  React.useEffect(() => {
    if (profile?.disabled) {
      toast.error("This account has been disabled. Contact an administrator.");
      void logoutUser();
    }
  }, [profile?.disabled]);

  const refreshProfile = React.useCallback(async () => {
    if (!firebaseUser) return;
    const snapshot = await ensureUserProfile(firebaseUser);
    if (snapshot) setProfile(snapshot);
    await refreshVerification();
    setFirebaseUser(getFirebaseAuth().currentUser);
  }, [firebaseUser, refreshVerification]);

  const logout = React.useCallback(async () => {
    await logoutUser();
    setProfile(null);
    setFirebaseUser(null);
    setEmailVerified(false);
  }, []);

  const value = React.useMemo<AuthContextValue>(() => {
    const role = profile?.role ?? "user";
    return {
      firebaseUser,
      profile,
      loading,
      isSignedIn: Boolean(firebaseUser),
      emailVerified,
      isModerator: role === "moderator" || role === "admin",
      isAdmin: role === "admin",
      canPost: emailVerified && !profile?.disabled,
      refreshProfile,
      refreshVerification,
      logout,
    };
  }, [firebaseUser, profile, loading, emailVerified, refreshProfile, refreshVerification, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
