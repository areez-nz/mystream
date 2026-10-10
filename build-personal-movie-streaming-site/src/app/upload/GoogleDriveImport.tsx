"use client";

import { useEffect, useState } from "react";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  videoMediaMetadata?: { durationMillis?: string };
};

type Status = {
  configured: boolean;
  connected: boolean;
  email: string | null;
};

export default function GoogleDriveImport({ googleParam }: { googleParam: string | null }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  async function loadStatus() {
    const res = await fetch("/api/google/status");
    const data = await res.json();
    setStatus(data);
    if (data.connected) loadFiles("");
  }

  async function loadFiles(q: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/google/files?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load Google Drive files");
        setFiles([]);
      } else {
        setFiles(data.files || []);
      }
    } catch {
      setError("Failed to load Google Drive files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleImport(file: DriveFile) {
    setImportingId(file.id);
    try {
      const res = await fetch("/api/google/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, title: file.name.replace(/\.[^/.]+$/, "") }),
      });
      if (res.ok) {
        setImportedIds((prev) => new Set(prev).add(file.id));
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to import file");
      }
    } finally {
      setImportingId(null);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/google/disconnect", { method: "POST" });
    setFiles([]);
    loadStatus();
  }

  if (!status) {
    return <p className="text-white/50">Checking Google Drive connection...</p>;
  }

  if (!status.configured) {
    return (
      <div className="max-w-xl rounded-lg border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">Google Drive isn&apos;t set up yet</h3>
        <p className="mb-3 text-sm text-white/60">
          To import movies from Google Drive, create an OAuth client at the{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="text-red-500 underline"
          >
            Google Cloud Console
          </a>
          , enable the Google Drive API, and add these environment variables to your project:
        </p>
        <pre className="overflow-x-auto rounded bg-black/50 p-3 text-xs text-white/70">
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
          </pre>
        <p className="mt-3 text-sm text-white/60">
          Add an authorized redirect URI pointing to{" "}
          <code className="rounded bg-white/10 px-1">/api/google/callback</code> on your app&apos;s domain.
        </p>
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="max-w-xl rounded-lg border border-white/10 bg-white/5 p-6">
        {googleParam === "denied" && (
          <p className="mb-3 text-sm text-amber-400">You cancelled the Google sign-in. Try again when ready.</p>
        )}
        {googleParam === "error" && (
          <p className="mb-3 text-sm text-red-500">Something went wrong connecting to Google Drive.</p>
        )}
        {googleParam === "no-refresh-token" && (
          <p className="mb-3 text-sm text-amber-400">
            Google didn&apos;t return a long-lived token. Revoke this app&apos;s access in your Google account and try
            connecting again.
          </p>
        )}
        <h3 className="mb-2 text-lg font-semibold text-white">Connect your Google Drive</h3>
        <p className="mb-4 text-sm text-white/60">
          Securely link your Google account so you can browse and stream videos stored in your Drive.
        </p>
        <a
          href="/api/google/connect"
          className="inline-block rounded-md bg-white px-5 py-2.5 font-semibold text-black transition hover:bg-white/85"
        >
          Connect Google Drive
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/60">
          Connected as <span className="text-white">{status.email || "your Google account"}</span>
        </p>
        <button onClick={handleDisconnect} className="text-sm text-white/50 underline hover:text-white/80">
          Disconnect
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadFiles(search);
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your Drive for videos..."
          className="w-full max-w-sm rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-red-600 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/40"
        >
          Search
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
      {loading && <p className="text-white/50">Loading your Drive videos...</p>}

      {!loading && files.length === 0 && !error && (
        <p className="text-white/50">No video files found in your Google Drive.</p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {files.map((file) => {
          const imported = importedIds.has(file.id);
          return (
            <div key={file.id} className="overflow-hidden rounded-lg bg-white/5">
              <div className="relative aspect-video bg-black/40">
                {file.thumbnailLink ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.thumbnailLink} alt={file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">🎬</div>
                )}
              </div>
              <div className="p-3">
                <p className="mb-2 truncate text-sm text-white/90" title={file.name}>
                  {file.name}
                </p>
                <button
                  onClick={() => handleImport(file)}
                  disabled={imported || importingId === file.id}
                  className="w-full rounded-md bg-red-600 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {imported ? "Added to library" : importingId === file.id ? "Importing..." : "Add to library"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
