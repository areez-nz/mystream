import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies, watchProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadFilePath, posterFilePath } from "@/lib/storage";

async function loadMovie(id: number) {
  const rows = await db.select().from(movies).where(eq(movies.id, id));
  return rows[0] ?? null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const movie = await loadMovie(id);
  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progressRows = await db.select().from(watchProgress).where(eq(watchProgress.movieId, id));
  return NextResponse.json({ movie, progress: progressRows[0] ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updates: Partial<typeof movies.$inferInsert> = {};
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.description === "string") updates.description = body.description;
  if (typeof body.genre === "string") updates.genre = body.genre;
  if (Number.isFinite(body.year)) updates.year = body.year;
  if (typeof body.posterUrl === "string") updates.posterUrl = body.posterUrl;

  const [row] = await db.update(movies).set(updates).where(eq(movies.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ movie: row });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const movie = await loadMovie(id);
  if (!movie) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(watchProgress).where(eq(watchProgress.movieId, id));
  await db.delete(movies).where(eq(movies.id, id));

  if (movie.source === "local" && movie.filePath) {
    await fs.unlink(uploadFilePath(movie.filePath)).catch(() => {});
  }
  if (movie.posterUrl?.startsWith("/api/poster/")) {
    const fileName = movie.posterUrl.split("/").pop();
    if (fileName) await fs.unlink(posterFilePath(fileName)).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
