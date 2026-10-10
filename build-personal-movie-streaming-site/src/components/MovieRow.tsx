import type { Movie } from "@/db/schema";
import MovieCard from "./MovieCard";

export default function MovieRow({ title, movies }: { title: string; movies: Movie[] }) {
  if (movies.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 px-4 text-lg font-semibold text-white sm:px-8 md:text-xl">{title}</h2>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto px-4 pb-4 sm:px-8">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
