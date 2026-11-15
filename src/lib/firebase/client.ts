"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * True when the required env vars are present. The UI shows a setup notice
 * instead of a cryptic Firebase error while the project is unconfigured.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

/**
 * Firebase is initialized lazily so that importing this module during SSR /
 * prerender does not touch browser-only SDK internals. All lib helpers below
 * call these getters at invocation time (inside effects or event handlers).
 */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Copy .env.local.example to .env.local and fill in your project keys.",
    );
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(getFirebaseApp());
  return dbInstance;
}
