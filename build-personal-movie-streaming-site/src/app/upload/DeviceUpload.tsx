"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "reading" | "uploading" | "done" | "error";

export default function DeviceUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [posterBlob, setPosterBlob] = useState<Blob | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [year, setYear] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  function pickFile(selected: File) {
    setFile(selected);
    setError("");
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ""));
    }
    captureThumbnail(selected);
  }

  function captureThumbnail(selected: File) {
    setStatus("reading");
    const url = URL.createObjectURL(selected);
    const video = document.createElement("video");
    videoElRef.current = video;
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const cleanup = () => URL.revokeObjectURL(url);

    video.addEventListener("loadedmetadata", () => {
      setDuration(video.duration);
      const seekTo = Math.min(Math.max(video.duration * 0.1, 1), video.duration - 0.5 || 0);
      try {
        video.currentTime = Number.isFinite(seekTo) ? seekTo : 0;
      } catch {
        setStatus("idle");
      }
    });

    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 720;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setPosterBlob(blob);
                setPosterPreview(URL.createObjectURL(blob));
              }
              setStatus("idle");
              cleanup();
            },
            "image/jpeg",
            0.85,
          );
        } else {
          setStatus("idle");
          cleanup();
        }
      } catch {
        setStatus("idle");
        cleanup();
      }
    });

    video.addEventListener("error", () => {
      setStatus("idle");
      cleanup();
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  }

  function handleUpload() {
    if (!file) return;
    setError("");
    setStatus("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (posterBlob) formData.append("poster", posterBlob, "poster.jpg");
    formData.append("title", title || file.name);
    formData.append("description", description);
    formData.append("genre", genre);
    if (year) formData.append("year", year);
    if (duration) formData.append("duration", String(Math.round(duration)));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStatus("done");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 600);
      } else {
        setStatus("error");
        try {
          const data = JSON.parse(xhr.responseText);
          setError(data.error || "Upload failed");
        } catch {
          setError("Upload failed");
        }
      }
    };
    xhr.onerror = () => {
      setStatus("error");
      setError("Upload failed. Check your connection and try again.");
    };
    xhr.send(formData);
  }

  const isUploading = status === "uploading";

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex aspect-[2/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition ${
            dragOver ? "border-red-500 bg-red-500/10" : "border-white/20 bg-white/5 hover:border-white/40"
          }`}
        >
          {posterPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterPreview} alt="Preview" className="h-full w-full rounded object-cover" />
          ) : (
            <>
              <span className="text-4xl">🎞️</span>
              <p className="text-sm text-white/70">
                Drag &amp; drop a video from your hard drive, or click to browse
              </p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) pickFile(selected);
          }}
        />
        {file && (
          <p className="mt-2 truncate text-xs text-white/50">
            {file.name} • {(file.size / (1024 * 1024)).toFixed(1)} MB
            {status === "reading" ? " • generating thumbnail..." : ""}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-red-600 focus:outline-none"
            placeholder="Movie title"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
              Genres (comma separated)
            </label>
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-red-600 focus:outline-none"
              placeholder="Action, Drama"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">Year</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-red-600 focus:outline-none"
              placeholder="2024"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-white/50">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white focus:border-red-600 focus:outline-none"
            placeholder="What's this movie about?"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {isUploading && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-red-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || isUploading || status === "reading"}
          className="rounded-md bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? `Uploading ${progress}%` : status === "done" ? "Added!" : "Add to Library"}
        </button>
      </div>
    </div>
  );
}
