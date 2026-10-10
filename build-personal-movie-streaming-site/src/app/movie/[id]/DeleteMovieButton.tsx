"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteMovieButton({ movieId }: { movieId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/movies/${movieId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-2 rounded-md border border-white/20 px-6 py-2.5 font-semibold text-white/80 transition hover:border-red-600 hover:text-red-500"
      >
        Remove
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-white/60">Remove from library?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Removing..." : "Yes, remove"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded-md border border-white/20 px-4 py-2 text-sm text-white/70 hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
}
