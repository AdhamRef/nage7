"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface YoutubeClipPlayerProps {
  videoId: string;
  /** Play only this stretch of the video, in seconds. */
  startSeconds?: number | null;
  endSeconds?: number | null;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  onCanPlay?: () => void;
  onEnded?: () => void;
  /** Fraction of the clip watched so far, 0–1. Throttled to ~1/s. */
  onProgress?: (playedRatio: number) => void;
  onError?: () => void;
}

/* The IFrame API attaches itself to window; keep the types local. */
declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  getDuration: () => number;
  pauseVideo: () => void;
  destroy: () => void;
}

/** Loads the IFrame API once, however many players are on the page. */
let apiPromise: Promise<void> | null = null;
const loadApi = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });

  return apiPromise;
};

/**
 * A YouTube embed that behaves like the Cloudinary player: it can play a slice
 * of a longer video and reports progress across that slice, so a chapter that
 * is minutes 12–24 of a two-hour recording still completes at 95%.
 */
export const YoutubeClipPlayer = ({
  videoId,
  startSeconds,
  endSeconds,
  title,
  className,
  autoPlay,
  onCanPlay,
  onEnded,
  onProgress,
  onError,
}: YoutubeClipPlayerProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onCanPlayRef = useRef(onCanPlay);
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  const onErrorRef = useRef(onError);
  onCanPlayRef.current = onCanPlay;
  onEndedRef.current = onEnded;
  onProgressRef.current = onProgress;
  onErrorRef.current = onError;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let player: YTPlayer | undefined;
    let poll: number | undefined;
    let destroyed = false;
    let finished = false;

    const start = typeof startSeconds === "number" ? startSeconds : 0;
    const end = typeof endSeconds === "number" ? endSeconds : null;

    const finish = () => {
      if (finished) return;
      finished = true;
      onEndedRef.current?.();
    };

    loadApi().then(() => {
      if (destroyed || !window.YT) return;

      // The API replaces the target node, so give it a child to consume.
      const target = document.createElement("div");
      host.replaceChildren(target);

      player = new window.YT.Player(target, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          start: Math.floor(start),
          ...(end !== null ? { end: Math.ceil(end) } : {}),
          autoplay: autoPlay ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          hl: "ar",
        },
        events: {
          onReady: () => onCanPlayRef.current?.(),
          onError: () => onErrorRef.current?.(),
          onStateChange: (event: { data: number }) => {
            if (!window.YT) return;

            if (event.data === window.YT.PlayerState.ENDED) {
              finish();
              return;
            }

            // Progress is only worth polling while playing.
            window.clearInterval(poll);
            if (event.data === window.YT.PlayerState.PLAYING) {
              poll = window.setInterval(() => {
                if (!player) return;
                const now = player.getCurrentTime();
                const to = end ?? player.getDuration();
                const span = to - start;
                if (span > 0) {
                  onProgressRef.current?.(
                    Math.min(Math.max((now - start) / span, 0), 1)
                  );
                }
                // `end` is honoured by YouTube, but belt and braces.
                if (end !== null && now >= end) {
                  player.pauseVideo();
                  finish();
                }
              }, 1000);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      window.clearInterval(poll);
      try {
        player?.destroy();
      } catch {
        // Already torn down.
      }
    };
  }, [videoId, startSeconds, endSeconds, autoPlay]);

  return (
    <div
      className={cn("relative h-full w-full bg-black", className)}
      title={title}
    >
      {/* The API swaps this node for the iframe. */}
      <div ref={hostRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
    </div>
  );
};

export default YoutubeClipPlayer;
