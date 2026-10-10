import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadFilePath } from "@/lib/storage";
import { getAuthorizedDriveClient } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRedirectUri(req: NextRequest) {
  return `${req.nextUrl.origin}/api/google/callback`;
}

async function streamLocalFile(req: NextRequest, filePath: string, mimeType: string) {
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  const range = req.headers.get("range");
  const fileSize = stat.size;

  if (!range) {
    const stream = fs.createReadStream(filePath);
    return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(fileSize),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
      },
    });
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range);
  let start = match && match[1] ? parseInt(match[1], 10) : 0;
  let end = match && match[2] ? parseInt(match[2], 10) : fileSize - 1;
  if (Number.isNaN(start)) start = 0;
  if (Number.isNaN(end) || end >= fileSize) end = fileSize - 1;
  if (start > end) start = 0;

  const chunkSize = end - start + 1;
  const stream = fs.createReadStream(filePath, { start, end });

  return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
    status: 206,
    headers: {
      "Content-Type": mimeType,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": String(chunkSize),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    },
  });
}

async function streamGoogleDriveFile(req: NextRequest, driveFileId: string, mimeType: string) {
  const drive = await getAuthorizedDriveClient(getRedirectUri(req));
  if (!drive) {
    return NextResponse.json({ error: "Google Drive is not connected" }, { status: 400 });
  }

  const range = req.headers.get("range") || undefined;

  const driveRes = await drive.files.get(
    { fileId: driveFileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream", headers: range ? { Range: range } : undefined },
  );

  const headers = driveRes.headers as Record<string, string>;
  const status = range ? (headers["content-range"] ? 206 : 200) : 200;
  const nodeStream = driveRes.data as unknown as Readable;

  const outHeaders: Record<string, string> = {
    "Content-Type": headers["content-type"] || mimeType || "video/mp4",
    "Accept-Ranges": headers["accept-ranges"] || "bytes",
    "Cache-Control": "no-store",
  };
  if (headers["content-length"]) outHeaders["Content-Length"] = headers["content-length"];
  if (headers["content-range"]) outHeaders["Content-Range"] = headers["content-range"];

  return new NextResponse(Readable.toWeb(nodeStream) as unknown as ReadableStream, {
    status,
    headers: outHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const rows = await db.select().from(movies).where(eq(movies.id, id));
  const movie = rows[0];
  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    if (movie.source === "local" && movie.filePath) {
      return await streamLocalFile(req, uploadFilePath(movie.filePath), movie.mimeType || "video/mp4");
    }
    if (movie.source === "gdrive" && movie.driveFileId) {
      return await streamGoogleDriveFile(req, movie.driveFileId, movie.mimeType || "video/mp4");
    }
    return NextResponse.json({ error: "Movie has no playable source" }, { status: 400 });
  } catch (err) {
    console.error("Stream error", err);
    return NextResponse.json({ error: "Failed to stream video" }, { status: 500 });
  }
}
