import { google } from "googleapis";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_ID = 1;

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getOAuthClient(redirectUri: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  );
}

export async function getSettings() {
  const rows = await db.select().from(appSettings).where(eq(appSettings.id, SETTINGS_ID));
  return rows[0] ?? null;
}

export async function saveGoogleTokens(refreshToken: string, email: string | null) {
  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, googleRefreshToken: refreshToken, googleEmail: email })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { googleRefreshToken: refreshToken, googleEmail: email, updatedAt: new Date() },
    });
}

export async function clearGoogleTokens() {
  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, googleRefreshToken: null, googleEmail: null })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { googleRefreshToken: null, googleEmail: null, updatedAt: new Date() },
    });
}

export async function getAuthorizedDriveClient(redirectUri: string) {
  const settings = await getSettings();
  if (!settings?.googleRefreshToken) return null;
  const oAuth2Client = getOAuthClient(redirectUri);
  oAuth2Client.setCredentials({ refresh_token: settings.googleRefreshToken });
  return google.drive({ version: "v3", auth: oAuth2Client });
}
