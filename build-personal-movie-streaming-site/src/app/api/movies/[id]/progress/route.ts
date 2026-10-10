import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchProgress } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const movieId = Number((await params).id);
  if (!Number.isFinite(movieId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const positionSeconds = Math.max(0, Math.floor(Number(body?.positionSeconds) || 0));
  const durationSeconds = Math.max(0, Math.floor(Number(body?.durationSeconds) || 0));

  await db
    .insert(watchProgress)
    .values({ movieId, positionSeconds, durationSeconds })
    .onConflictDoUpdate({
      target: watchProgress.movieId,
      set: { positionSeconds, durationSeconds, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true });
}
