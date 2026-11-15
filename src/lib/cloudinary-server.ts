import { createHash } from "node:crypto";

/**
 * Server-only Cloudinary helpers.
 *
 * Image binaries never pass through Next.js: the browser asks
 * `/api/cloudinary/sign` for a short-lived signature and then uploads straight
 * to Cloudinary. That keeps the API secret on the server and dodges the 4.5 MB
 * request-body cap on Vercel functions.
 */

export interface CloudinaryEnv {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** Returns the configured Cloudinary credentials, or null when incomplete. */
export function getCloudinaryEnv(): CloudinaryEnv | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/**
 * Cloudinary signature: sort the signed params alphabetically, join them as
 * `key=value&...`, append the API secret, and SHA-1 the whole string.
 */
export function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string,
): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(payload + apiSecret).digest("hex");
}

/**
 * Validates a Firebase ID token without the Admin SDK by asking Identity
 * Toolkit to look it up. Returns the uid, or null when the token is invalid.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { users?: Array<{ localId?: string }> };
    const uid = data.users?.[0]?.localId;
    return typeof uid === "string" && uid.length > 0 ? uid : null;
  } catch {
    return null;
  }
}

/** Reads `Authorization: Bearer <token>` and resolves it to a uid. */
export async function authenticateRequest(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  return verifyFirebaseIdToken(header.slice("Bearer ".length).trim());
}

/** Narrows an unknown JSON body to a string field. */
export function readStringField(body: unknown, field: string): string | null {
  if (typeof body !== "object" || body === null) return null;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === "string" && value.length > 0 ? value : null;
}
