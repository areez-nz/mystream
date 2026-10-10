import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient, isGoogleConfigured, saveGoogleTokens } from "@/lib/google";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const errorParam = req.nextUrl.searchParams.get("error");

  const redirectTo = (status: string) => NextResponse.redirect(`${req.nextUrl.origin}/upload?google=${status}`);

  if (errorParam) return redirectTo("denied");
  if (!isGoogleConfigured() || !code) return redirectTo("error");

  try {
    const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
    const oAuth2Client = getOAuthClient(redirectUri);
    const { tokens } = await oAuth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return redirectTo("no-refresh-token");
    }

    oAuth2Client.setCredentials(tokens);

    let email: string | null = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oAuth2Client });
      const { data } = await oauth2.userinfo.get();
      email = data.email ?? null;
    } catch {
      email = null;
    }

    await saveGoogleTokens(tokens.refresh_token, email);
    return redirectTo("connected");
  } catch (err) {
    console.error("Google OAuth callback error", err);
    return redirectTo("error");
  }
}
