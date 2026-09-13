"use client";

import { useState } from "react";

interface ChapterThumbProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
}

/**
 * Cloudinary builds poster frames lazily, so a chapter thumbnail can 423 for a
 * while after upload. Fall back to the course cover instead of a broken image.
 */
const ChapterThumb = ({ src, fallbackSrc, alt }: ChapterThumbProps) => {
  const [current, setCurrent] = useState(src || fallbackSrc || "");
  const [failed, setFailed] = useState(!src && !fallbackSrc);

  if (failed || !current) {
    return <div className="h-full w-full bg-slate-800" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover"
      onError={() => {
        if (fallbackSrc && current !== fallbackSrc) {
          setCurrent(fallbackSrc);
          return;
        }
        setFailed(true);
      }}
    />
  );
};

export default ChapterThumb;
