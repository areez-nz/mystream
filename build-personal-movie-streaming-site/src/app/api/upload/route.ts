import fs from "fs";
import { Readable } from "stream";
import Busboy from "busboy";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { ensureStorageDirs, posterFilePath, safeFileName, uploadFilePath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SavedFile = { fileName: string; mimeType: string; size: number };

export async function POST(req: NextRequest) {
  ensureStorageDirs();

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }
  if (!req.body) {
    return NextResponse.json({ error: "Missing request body" }, { status: 400 });
  }

  const fields: Record<string, string> = {};
  let savedVideo: SavedFile | null = null;
  let savedPoster: SavedFile | null = null;
  const pendingWrites: Promise<void>[] = [];

  const busboy = Busboy({
    headers: { "content-type": contentType },
    limits: { fileSize: 32 * 1024 * 1024 * 1024 },
  });

  const parseFinished = new Promise<void>((resolve, reject) => {
    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, fileStream, info) => {
      if (name !== "file" && name !== "poster") {
        fileStream.resume();
        return;
      }

      const { filename, mimeType } = info;
      const isVideo = name === "file";
      const savedName = safeFileName(filename || (isVideo ? "movie.mp4" : "poster.jpg"));
      const destPath = isVideo ? uploadFilePath(savedName) : posterFilePath(savedName);
      const dest = fs.createWriteStream(destPath);
      let size = 0;

      fileStream.on("data", (chunk: Buffer) => {
        size += chunk.length;
      });

      const writePromise = new Promise<void>((res, rej) => {
        dest.on("finish", () => {
          const result: SavedFile = { fileName: savedName, mimeType: mimeType || "application/octet-stream", size };
          if (isVideo) savedVideo = result;
          else savedPoster = result;
          res();
        });
        dest.on("error", rej);
        fileStream.on("error", rej);
      });
      pendingWrites.push(writePromise);
      fileStream.pipe(dest);
    });

    busboy.on("error", reject);
    busboy.on("finish", resolve);
  });

  Readable.fromWeb(req.body as unknown as Parameters<typeof Readable.fromWeb>[0]).pipe(busboy);

  await parseFinished;
  await Promise.all(pendingWrites);

  if (!savedVideo) {
    return NextResponse.json({ error: "No video file was uploaded" }, { status: 400 });
  }

  const video: SavedFile = savedVideo;

  const title = fields.title?.trim() || video.fileName;
  const durationSeconds = fields.duration ? Math.round(Number(fields.duration)) : null;
  const year = fields.year ? Number(fields.year) : null;

  const [row] = await db
    .insert(movies)
    .values({
      title,
      description: fields.description || "",
      genre: fields.genre || "",
      year: Number.isFinite(year) && year ? year : null,
      source: "local",
      filePath: video.fileName,
      mimeType: video.mimeType.startsWith("video/") ? video.mimeType : "video/mp4",
      sizeBytes: video.size,
      durationSeconds: Number.isFinite(durationSeconds) && durationSeconds ? durationSeconds : null,
      posterUrl: savedPoster ? `/api/poster/${(savedPoster as SavedFile).fileName}` : null,
    })
    .returning();

  return NextResponse.json({ movie: row }, { status: 201 });
}
