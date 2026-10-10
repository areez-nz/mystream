import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, isGoogleConfigured } from "@/lib/google";

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google Drive is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 400 },
    );
  }

  const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
  const oAuth2Client = getOAuthClient(redirectUri);

  const url = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });

  return NextResponse.redirect(url);
}
