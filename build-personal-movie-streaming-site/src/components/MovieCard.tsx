import Link from "next/link";
import PosterImage from "./PosterImage";
import type { Movie } from "@/db/schema";

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      href={`/movie/${movie.id}`}
      className="group relative block w-[160px] shrink-0 overflow-hidden rounded-lg bg-white/5 shadow-lg transition-transform duration-200 ease-out hover:z-10 hover:scale-105 hover:shadow-2xl sm:w-[190px]"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <PosterImage src={movie.posterUrl} title={movie.title} className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
          {movie.source === "gdrive" ? "Drive" : "Hard Drive"}
        </span>
      </div>
      <div className="px-1 py-2">
        <p className="truncate text-sm font-medium text-white/90">{movie.title}</p>
      </div>
    </Link>
  );
}
