"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scrolled] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/?${params.toString()}`);
  }

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between gap-4 bg-gradient-to-b from-black/90 to-black/0 px-4 py-4 backdrop-blur-sm sm:px-8 ${scrolled ? "bg-black" : ""}`}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-black tracking-tight text-red-600">
          MyStream
        </Link>
        <nav className="hidden gap-5 text-sm font-medium text-white/80 sm:flex">
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
          <Link href="/upload" className="transition hover:text-white">
            Add Movies
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="hidden sm:block">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your library..."
            className="w-48 rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:w-64 focus:border-white/50 focus:outline-none"
          />
        </form>
        <Link
          href="/upload"
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          + Add
        </Link>
        <button
          onClick={handleLogout}
          className="rounded-md border border-white/20 px-3 py-1.5 text-sm font-medium text-white/80 transition hover:border-white/40 hover:text-white"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
