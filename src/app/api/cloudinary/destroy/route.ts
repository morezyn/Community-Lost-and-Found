import { NextResponse } from "next/server";

import {
  authenticateRequest,
  getCloudinaryEnv,
  signCloudinaryParams,
} from "@/lib/cloudinary-server";

export const runtime = "nodejs";

interface DestroyBody {
  publicIds?: unknown;
}

/**
 * Deletes images from Cloudinary when a report is edited or removed.
 *
 * Only public ids inside the caller's own `findit/{uid}/` folder are accepted,
 * mirroring the owner-only Storage rule the app used to rely on.
 */
export async function POST(request: Request) {
  const env = getCloudinaryEnv();
  if (!env) return NextResponse.json({ ok: false, error: "Cloudinary is not configured." }, { status: 500 });

  const uid = await authenticateRequest(request);
  if (!uid) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as DestroyBody | null;
  const raw = body?.publicIds;
  const publicIds = Array.isArray(raw)
    ? raw.filter((value): value is string => typeof value === "string")
    : [];

  const allowedPrefix = `findit/${uid}/`;
  const targets = publicIds.filter((id) => id.startsWith(allowedPrefix)).slice(0, 4);
  if (targets.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const results = await Promise.allSettled(
    targets.map(async (publicId) => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      // Every non-excluded parameter must be part of the signature.
      const signature = signCloudinaryParams(
        { public_id: publicId, timestamp, invalidate: "true" },
        env.apiSecret,
      );

      const form = new URLSearchParams({
        public_id: publicId,
        timestamp,
        api_key: env.apiKey,
        signature,
        invalidate: "true",
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${env.cloudName}/image/destroy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        },
      );
      return response.ok;
    }),
  );

  // Deletion is best effort: a missing asset is not an error for the caller.
  return NextResponse.json({ ok: true, deleted: results.filter((r) => r.status === "fulfilled").length });
}
