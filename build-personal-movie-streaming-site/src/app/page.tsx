import Link from "next/link";
import { db } from "@/db";
import { movies, watchProgress } from "@/db/schema";
import { desc, ilike } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import MovieRow from "@/components/MovieRow";
import PosterImage from "@/components/PosterImage";
import { formatDuration, parseGenres } from "@/lib/format";
import type { Movie } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = q?.trim();

  const allMovies = search
    ? await db.select().from(movies).where(ilike(movies.title, `%${search}%`)).orderBy(desc(movies.createdAt))
    : await db.select().from(movies).orderBy(desc(movies.createdAt));

  if (allMovies.length === 0) {
    return (
      <div className="min-h-screen bg-[#0b0b0f]">
        <Navbar />
        <EmptyState search={search} />
      </div>
    );
  }

  const progressRows = await db.select().from(watchProgress);
  const progressByMovie = new Map(progressRows.map((p) => [p.movieId, p]));

  const continueWatching = allMovies.filter((m) => {
    const p = progressByMovie.get(m.id);
    if (!p || !p.durationSeconds) return false;
    const ratio = p.positionSeconds / p.durationSeconds;
    return ratio > 0.02 && ratio < 0.95;
  });

  const localMovies = allMovies.filter((m) => m.source === "local");
  const driveMovies = allMovies.filter((m) => m.source === "gdrive");

  const genreMap = new Map<string, Movie[]>();
  for (const movie of allMovies) {
    for (const genre of parseGenres(movie.genre)) {
      const list = genreMap.get(genre) ?? [];
      list.push(movie);
      genreMap.set(genre, list);
    }
  }

  const hero = allMovies[0];

  return (
    <div className="min-h-screen bg-[#0b0b0f] pb-16">
      <Navbar />

      {!search && hero && <Hero movie={hero} />}

      {search && (
        <p className="px-4 pt-6 text-white/70 sm:px-8">
          {allMovies.length} result{allMovies.length === 1 ? "" : "s"} for &ldquo;{search}&rdquo;
        </p>
      )}

      <div className={search ? "pt-6" : "-mt-16 relative z-10"}>
        <MovieRow title="Continue Watching" movies={continueWatching} />
        <MovieRow title="Recently Added" movies={allMovies.slice(0, 20)} />
        <MovieRow title="From Your Hard Drive" movies={localMovies} />
        <MovieRow title="From Google Drive" movies={driveMovies} />
        {Array.from(genreMap.entries()).map(([genre, list]) => (
          <MovieRow key={genre} title={genre} movies={list} />
        ))}
      </div>
    </div>
  );
}

function Hero({ movie }: { movie: Movie }) {
  const genres = parseGenres(movie.genre);
  return (
    <div className="relative h-[60vh] min-h-[380px] w-full overflow-hidden sm:h-[72vh]">
      <PosterImage src={movie.posterUrl} title={movie.title} className="h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0f] via-[#0b0b0f]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0f]/80 via-transparent to-transparent" />
      <div className="absolute bottom-10 left-4 max-w-xl sm:left-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Freshly Added</p>
        <h1 className="mb-3 text-3xl font-black leading-tight text-white drop-shadow-lg sm:text-5xl">
          {movie.title}
        </h1>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-white/70">
          {movie.year && <span>{movie.year}</span>}
          {movie.durationSeconds ? <span>• {formatDuration(movie.durationSeconds)}</span> : null}
          {genres.slice(0, 3).map((g) => (
            <span key={g} className="rounded border border-white/30 px-2 py-0.5 text-xs">
              {g}
            </span>
          ))}
        </div>
        {movie.description && (
          <p className="mb-5 line-clamp-3 text-sm text-white/80 sm:text-base">{movie.description}</p>
        )}
        <div className="flex gap-3">
          <Link
            href={`/watch/${movie.id}`}
            className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 font-semibold text-black transition hover:bg-white/85"
          >
            ▶ Play
          </Link>
          <Link
            href={`/movie/${movie.id}`}
            className="flex items-center gap-2 rounded-md bg-white/20 px-5 py-2.5 font-semibold text-white backdrop-blur transition hover:bg-white/30"
          >
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ search }: { search?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-6xl">🎬</div>
      <h1 className="mb-2 text-2xl font-bold text-white">
        {search ? `No results for "${search}"` : "Your library is empty"}
      </h1>
      <p className="mb-6 max-w-md text-white/60">
        {search
          ? "Try a different search term."
          : "Add movies from your computer's hard drive or import them straight from Google Drive to get started."}
      </p>
      {!search && (
        <Link
          href="/upload"
          className="rounded-md bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
        >
          Add Your First Movie
        </Link>
      )}
    </div>
  );
}
