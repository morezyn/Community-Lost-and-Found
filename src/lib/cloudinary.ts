"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { validateImageFile } from "@/lib/validators";

export interface UploadedImage {
  /** Cloudinary `secure_url`, stored in `report.images`. */
  url: string;
  /** Cloudinary `public_id`, stored in `report.imagePaths` so it can be deleted. */
  path: string;
}

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: string;
  folder: string;
  signature: string;
}

interface UploadResponse {
  secure_url?: string;
  public_id?: string;
}

/** Client-side guard before we spend bandwidth on an upload. */
export function assertValidImage(file: File): void {
  const error = validateImageFile(file);
  if (error) throw new Error(error);
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  if (!token) throw new Error("Sign in again to manage photos.");
  return { Authorization: `Bearer ${token}` };
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (typeof data.error === "string") return data.error;
  } catch {
    // Non-JSON error body - fall through to the fallback message.
  }
  return fallback;
}

/**
 * Uploads one report photo to Cloudinary as `findit/{uid}/{reportId}/...`.
 *
 * The browser uploads directly to Cloudinary using a short-lived signature, so
 * the API secret stays on the server and large files never hit our own API.
 */
export async function uploadReportImage(file: File, reportId: string): Promise<UploadedImage> {
  assertValidImage(file);

  const headers = await authHeaders();
  const signResponse = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ reportId }),
  });

  if (!signResponse.ok) {
    throw new Error(await errorMessage(signResponse, "Could not prepare the image upload."));
  }

  const sign = (await signResponse.json()) as SignResponse;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", sign.timestamp);
  form.append("folder", sign.folder);
  form.append("signature", sign.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: "POST", body: form },
  );

  if (!uploadResponse.ok) {
    throw new Error(await errorMessage(uploadResponse, "Image upload failed. Please try again."));
  }

  const uploaded = (await uploadResponse.json()) as UploadResponse;
  if (!uploaded.secure_url || !uploaded.public_id) {
    throw new Error("Cloudinary returned an unexpected response.");
  }

  return { url: uploaded.secure_url, path: uploaded.public_id };
}

/** Deletes images from Cloudinary. Missing assets are treated as success. */
export async function deleteReportImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;

  try {
    const headers = await authHeaders();
    await fetch("/api/cloudinary/destroy", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ publicIds }),
    });
  } catch {
    // Best effort - a stale image must never block the Firestore write.
  }
}
