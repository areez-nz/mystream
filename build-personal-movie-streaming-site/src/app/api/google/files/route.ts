import { NextRequest, NextResponse } from "next/server";
import { getAuthorizedDriveClient } from "@/lib/google";

export async function GET(req: NextRequest) {
  const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
  const drive = await getAuthorizedDriveClient(redirectUri);
  if (!drive) {
    return NextResponse.json({ error: "Google Drive is not connected" }, { status: 400 });
  }

  const search = req.nextUrl.searchParams.get("q")?.trim();
  const pageToken = req.nextUrl.searchParams.get("pageToken") || undefined;

  let q = "mimeType contains 'video/' and trashed = false";
  if (search) {
    const escaped = search.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }

  try {
    const res = await drive.files.list({
      q,
      pageSize: 24,
      pageToken,
      fields: "nextPageToken, files(id, name, mimeType, size, thumbnailLink, videoMediaMetadata, modifiedTime)",
      orderBy: "modifiedTime desc",
      spaces: "drive",
    });

    return NextResponse.json({
      files: res.data.files ?? [],
      nextPageToken: res.data.nextPageToken ?? null,
    });
  } catch (err) {
    console.error("Google Drive list error", err);
    return NextResponse.json({ error: "Failed to list Google Drive files" }, { status: 500 });
  }
}
