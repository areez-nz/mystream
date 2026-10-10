import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import PosterImage from "@/components/PosterImage";
import DeleteMovieButton from "./DeleteMovieButton";
import { formatBytes, formatDuration, parseGenres } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isFinite(movieId)) notFound();

  const rows = await db.select().from(movies).where(eq(movies.id, movieId));
  const movie = rows[0];
  if (!movie) notFound();

  const genres = parseGenres(movie.genre);

  return (
    <div className="min-h-screen bg-[#0b0b0f]">
      <Navbar />

      <div className="relative h-[45vh] min-h-[300px] w-full overflow-hidden">
        <PosterImage src={movie.posterUrl} title={movie.title} className="h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] to-transparent" />
      </div>

      <div className="mx-auto -mt-24 flex max-w-5xl flex-col gap-8 px-4 pb-16 sm:flex-row sm:px-8">
        <div className="w-40 shrink-0 overflow-hidden rounded-lg shadow-2xl sm:w-56">
          <PosterImage src={movie.posterUrl} title={movie.title} className="aspect-[2/3] w-full object-cover" />
        </div>

        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-black text-white sm:text-4xl">{movie.title}</h1>
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-white/60">
            {movie.year && <span>{movie.year}</span>}
            {movie.durationSeconds ? <span>• {formatDuration(movie.durationSeconds)}</span> : null}
            <span>• {movie.source === "gdrive" ? "Google Drive" : "Your Hard Drive"}</span>
            {movie.sizeBytes ? <span>• {formatBytes(movie.sizeBytes)}</span> : null}
          </div>

          {genres.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {genres.map((g) => (
                <span key={g} className="rounded border border-white/20 px-2 py-0.5 text-xs text-white/70">
                  {g}
                </span>
              ))}
            </div>
          )}

          <p className="mb-6 max-w-2xl text-white/80">
            {movie.description || "No description provided."}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/watch/${movie.id}`}
              className="flex items-center gap-2 rounded-md bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-700"
            >
              ▶ Play
            </Link>
            <DeleteMovieButton movieId={movie.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
