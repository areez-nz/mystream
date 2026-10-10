"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Player({
  movieId,
  title,
  resumeAt,
}: {
  movieId: number;
  title: string;
  resumeAt: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function saveProgress() {
      if (!video) return;
      const position = Math.floor(video.currentTime);
      const duration = Math.floor(video.duration || 0);
      if (!duration) return;
      navigator.sendBeacon?.(
        `/api/movies/${movieId}/progress`,
        new Blob([JSON.stringify({ positionSeconds: position, durationSeconds: duration })], {
          type: "application/json",
        }),
      );
      fetch(`/api/movies/${movieId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positionSeconds: position, durationSeconds: duration }),
        keepalive: true,
      }).catch(() => {});
    }

    function handleLoadedMetadata() {
      if (video && resumeAt > 0 && resumeAt < video.duration - 5) {
        video.currentTime = resumeAt;
      }
    }

    function handleTimeUpdate() {
      if (!video) return;
      const now = Date.now();
      if (now - lastSavedRef.current > 8000) {
        lastSavedRef.current = now;
        saveProgress();
      }
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", saveProgress);
    window.addEventListener("beforeunload", saveProgress);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", saveProgress);
      window.removeEventListener("beforeunload", saveProgress);
      saveProgress();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, resumeAt]);

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex items-center gap-4 bg-black px-4 py-3">
        <Link href={`/movie/${movieId}`} className="text-white/80 transition hover:text-white">
          ← Back
        </Link>
        <h1 className="truncate text-sm font-medium text-white/90">{title}</h1>
      </div>
      <div className="flex flex-1 items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={`/api/stream/${movieId}`}
          controls
          autoPlay
          playsInline
          className="max-h-[90vh] w-full"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
