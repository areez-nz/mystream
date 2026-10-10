"use client";

import { useState } from "react";
import { gradientForTitle, initialsFromTitle } from "@/lib/format";

export default function PosterImage({
  src,
  title,
  className = "",
}: {
  src?: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br ${gradientForTitle(title)} ${className}`}
      >
        <span className="text-3xl font-bold tracking-wide text-white/90 drop-shadow">
          {initialsFromTitle(title)}
        </span>
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={title}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
