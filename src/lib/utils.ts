import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import type { Timestamp } from "firebase/firestore";

/** Tailwind-aware class name joiner used by every UI primitive. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Convert a Firestore Timestamp to a JS Date at the UI boundary. */
export function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return value.toDate();
}

export function formatDate(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return format(date, "MMM d, yyyy");
}

export function formatDateTime(
  value: Timestamp | Date | null | undefined,
): string {
  const date = toDate(value);
  if (!date) return "—";
  return format(date, "MMM d, yyyy · h:mm a");
}

/** "3 hours ago" style relative time, falling back to an absolute date. */
export function timeAgo(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  if (diffMs > oneWeek) return formatDate(date);
  return formatDistanceToNow(date, { addSuffix: true });
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "have", "has", "was",
  "were", "are", "you", "your", "our", "its", "his", "her", "not", "but",
  "all", "any", "can", "into", "near", "over", "under", "about", "please",
]);

/**
 * Builds the `searchTokens` array stored on a report. Kept to whole, lowercased
 * words so the feed can later use `array-contains` (see the NOTE in
 * lib/firebase/reports.ts). For now the feed filters client-side.
 */
export function buildSearchTokens(...parts: string[]): string[] {
  const tokens = new Set<string>();
  for (const part of parts) {
    const words = part
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/);
    for (const word of words) {
      if (word.length < 3 || STOP_WORDS.has(word)) continue;
      tokens.add(word);
    }
  }
  return Array.from(tokens).slice(0, 60);
}

/** Unwrap an unknown error into a user-facing message. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}

/** Convert a JS Date to the yyyy-MM-dd string used by <input type="date">. */
export function toDateInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parse a yyyy-MM-dd input value into a local Date (midnight local time). */
export function fromDateInputValue(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}
