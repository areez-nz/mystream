import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(movies).orderBy(desc(movies.createdAt));
  return NextResponse.json({ movies: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (body.source !== "gdrive" || !body.driveFileId) {
    return NextResponse.json({ error: "Only gdrive imports are supported here" }, { status: 400 });
  }

  const [row] = await db
    .insert(movies)
    .values({
      title: body.title.trim(),
      description: typeof body.description === "string" ? body.description : "",
      genre: typeof body.genre === "string" ? body.genre : "",
      year: Number.isFinite(body.year) ? body.year : null,
      source: "gdrive",
      driveFileId: body.driveFileId,
      mimeType: typeof body.mimeType === "string" ? body.mimeType : "video/mp4",
      sizeBytes: Number.isFinite(body.sizeBytes) ? body.sizeBytes : null,
      posterUrl: typeof body.posterUrl === "string" ? body.posterUrl : null,
    })
    .returning();

  return NextResponse.json({ movie: row }, { status: 201 });
}
