"use client";

import { useState } from "react";

/* A round avatar that shows a photo when available and gracefully falls back to
   initials on a brand-green tile if the image is missing or fails to load. */

export function PhotoAvatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (failed) {
    return (
      <span
        aria-label={name}
        role="img"
        className={`grid shrink-0 place-items-center rounded-full bg-brand font-medium text-white ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
