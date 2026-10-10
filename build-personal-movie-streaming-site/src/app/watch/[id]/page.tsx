import { notFound } from "next/navigation";
import { db } from "@/db";
import { movies, watchProgress } from "@/db/schema";
import { eq } from "drizzle-orm";
import Player from "./Player";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isFinite(movieId)) notFound();

  const rows = await db.select().from(movies).where(eq(movies.id, movieId));
  const movie = rows[0];
  if (!movie) notFound();

  const progressRows = await db.select().from(watchProgress).where(eq(watchProgress.movieId, movieId));
  const progress = progressRows[0];

  const resumeAt =
    progress && progress.durationSeconds > 0 && progress.positionSeconds / progress.durationSeconds < 0.95
      ? progress.positionSeconds
      : 0;

  return <Player movieId={movie.id} title={movie.title} resumeAt={resumeAt} />;
}
