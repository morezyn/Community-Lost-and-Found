"use client";

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateAuthProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import type { AppUser } from "@/types";

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid);
}

/** Read a user profile; returns null when the document does not exist yet. */
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(userDocRef(uid));
  if (!snapshot.exists()) return null;
  return { uid, ...(snapshot.data() as Omit<AppUser, "uid">) };
}

/**
 * Creates users/{uid} the first time an account signs in. Role defaults to
 * "user"; the security rules only allow the owner to create their own profile
 * with role "user" and disabled false.
 */
export async function ensureUserProfile(user: User): Promise<AppUser | null> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const profile = {
    email: user.email ?? "",
    displayName: user.displayName?.trim() || user.email?.split("@")[0] || "Member",
    photoURL: user.photoURL,
    role: "user" as const,
    disabled: false,
    createdAt: serverTimestamp(),
  };

  // merge: true keeps this idempotent if two tabs sign in at the same time.
  await setDoc(userDocRef(user.uid), profile, { merge: true });
  return getUserProfile(user.uid);
}

export async function registerWithEmail(
  displayName: string,
  email: string,
  password: string,
): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateAuthProfile(credential.user, { displayName });
  await ensureUserProfile(credential.user);
  // Non-blocking: the user can browse immediately, but posting waits for
  // verification (enforced by Firestore rules).
  try {
    await sendEmailVerification(credential.user);
  } catch {
    // Verification email throttling should not fail registration.
  }
  return credential.user;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(getFirebaseAuth(), provider);
  await ensureUserProfile(credential.user);
  return credential.user;
}

export async function resendVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function changePassword(
  user: User,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (!user.email) throw new Error("This account has no email address");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  const { updatePassword } = await import("firebase/auth");
  await updatePassword(user, newPassword);
}

export async function logoutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/** Updates the Auth profile and the mirrored users/{uid} document. */
export async function updateUserProfile(
  user: User,
  values: { displayName: string; photoURL: string | null },
): Promise<void> {
  await updateAuthProfile(user, {
    displayName: values.displayName,
    photoURL: values.photoURL,
  });
  await updateDoc(userDocRef(user.uid), {
    displayName: values.displayName,
    photoURL: values.photoURL,
  });
}
