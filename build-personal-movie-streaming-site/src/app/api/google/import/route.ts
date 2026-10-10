import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { getAuthorizedDriveClient } from "@/lib/google";

export async function POST(req: NextRequest) {
  const redirectUri = `${req.nextUrl.origin}/api/google/callback`;
  const drive = await getAuthorizedDriveClient(redirectUri);
  if (!drive) {
    return NextResponse.json({ error: "Google Drive is not connected" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const fileId = body?.fileId;
  if (!fileId || typeof fileId !== "string") {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    const { data } = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, thumbnailLink, videoMediaMetadata",
    });

    const durationMs = data.videoMediaMetadata?.durationMillis
      ? Number(data.videoMediaMetadata.durationMillis)
      : null;

    const [row] = await db
      .insert(movies)
      .values({
        title: (body.title as string) || data.name || "Untitled",
        description: (body.description as string) || "",
        genre: (body.genre as string) || "",
        year: Number.isFinite(body.year) ? body.year : null,
        source: "gdrive",
        driveFileId: data.id!,
        mimeType: data.mimeType || "video/mp4",
        sizeBytes: data.size ? Number(data.size) : null,
        durationSeconds: durationMs ? Math.round(durationMs / 1000) : null,
        posterUrl: data.thumbnailLink || null,
      })
      .returning();

    return NextResponse.json({ movie: row }, { status: 201 });
  } catch (err) {
    console.error("Google Drive import error", err);
    return NextResponse.json({ error: "Failed to import file from Google Drive" }, { status: 500 });
  }
}
