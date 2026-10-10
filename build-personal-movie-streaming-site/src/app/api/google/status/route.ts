import { NextResponse } from "next/server";
import { getSettings, isGoogleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isGoogleConfigured();
  const settings = configured ? await getSettings() : null;
  return NextResponse.json({
    configured,
    connected: Boolean(settings?.googleRefreshToken),
    email: settings?.googleEmail ?? null,
  });
}
