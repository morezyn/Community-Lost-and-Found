"use client";

import { FirebaseError } from "firebase/app";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address looks invalid.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account was found with that email.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups and retry.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/requires-recent-login": "Please sign out and back in to continue.",
  "permission-denied": "You do not have permission to do that.",
  "unavailable": "The service is temporarily unavailable. Try again shortly.",
};

export function describeFirebaseError(error: unknown, fallback: string): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? error.message ?? fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
