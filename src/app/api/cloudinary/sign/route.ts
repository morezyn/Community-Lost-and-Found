import { NextResponse } from "next/server";

import {
  authenticateRequest,
  getCloudinaryEnv,
  readStringField,
  signCloudinaryParams,
} from "@/lib/cloudinary-server";

export const runtime = "nodejs";

/**
 * Mints a Cloudinary upload signature for the signed-in user.
 *
 * The folder is derived from the *verified* uid, not from the request body, so
 * one user cannot write into another user's folder.
 */
export async function POST(request: Request) {
  const env = getCloudinaryEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Set CLOUDINARY_* in .env.local." },
      { status: 500 },
    );
  }

  const uid = await authenticateRequest(request);
  if (!uid) {
    return NextResponse.json({ error: "You must be signed in to upload photos." }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  const reportId = readStringField(body, "reportId");
  if (!reportId || !/^[A-Za-z0-9_-]{1,64}$/.test(reportId)) {
    return NextResponse.json({ error: "A valid reportId is required." }, { status: 400 });
  }

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = `findit/${uid}/${reportId}`;
  const signature = signCloudinaryParams({ folder, timestamp }, env.apiSecret);

  return NextResponse.json({
    cloudName: env.cloudName,
    apiKey: env.apiKey,
    timestamp,
    folder,
    signature,
  });
}
