"use client";

import type PlyrType from "plyr";
import { useEffect, useRef } from "react";

import "plyr/dist/plyr.css";

import { cn } from "@/lib/utils";

interface HlsVideoPlayerProps {
  /** Adaptive bitrate stream. Cloudinary builds it lazily on first request. */
  hlsUrl?: string | null;
  /** Preferred progressive source. */
  playbackUrl?: string | null;
  /**
   * The raw URL Cloudinary returned at upload. Never a derived asset, so it is
   * the one source guaranteed to exist the moment a video is uploaded — the
   * last link in the fallback chain.
   */
  originalUrl?: string | null;
  poster?: string | null;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  /** Fires as soon as the player has something to show. */
  onCanPlay?: () => void;
  onEnded?: () => void;
  /** Fraction of the video watched so far, 0–1. Throttled to ~1/s. */
  onProgress?: (playedRatio: number) => void;
  /** No usable source, or every source failed. */
  onError?: () => void;
  /**
   * Play only a slice of the file. Set when a chapter is a range inside the
   * course's single long recording rather than its own upload.
   */
  startSeconds?: number | null;
  endSeconds?: number | null;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** Cloudinary answers 423 while it builds the HLS rendition — don't wait long. */
const HLS_MANIFEST_TIMEOUT = 7000;
/** Absolute cap: never leave the student staring at a spinner. */
const READY_WATCHDOG = 12000;

/** Arabic UI strings for the player chrome. */
const i18n = {
  restart: "إعادة التشغيل",
  rewind: "رجوع {seektime} ثانية",
  play: "تشغيل",
  pause: "إيقاف مؤقت",
  fastForward: "تقدم {seektime} ثانية",
  seek: "تقديم",
  seekLabel: "{currentTime} من {duration}",
  played: "تم تشغيله",
  buffered: "تم تحميله",
  currentTime: "الوقت الحالي",
  duration: "المدة",
  volume: "الصوت",
  mute: "كتم الصوت",
  unmute: "إلغاء الكتم",
  enableCaptions: "تفعيل الترجمة",
  disableCaptions: "إيقاف الترجمة",
  download: "تحميل",
  enterFullscreen: "ملء الشاشة",
  exitFullscreen: "إنهاء ملء الشاشة",
  frameTitle: "مشغل {title}",
  captions: "الترجمة",
  settings: "الإعدادات",
  pip: "صورة داخل صورة",
  menuBack: "رجوع",
  speed: "السرعة",
  normal: "عادية",
  quality: "الجودة",
  loop: "تكرار",
  start: "البداية",
  end: "النهاية",
  all: "الكل",
  reset: "إعادة تعيين",
  disabled: "معطل",
  enabled: "مفعل",
  qualityBadge: {
    2160: "4K",
    1440: "2K",
    1080: "HD",
    720: "HD",
    576: "SD",
    480: "SD",
  },
  qualityLabel: {
    0: "تلقائي",
  },
};

/**
 * Course player: Plyr chrome (playback speed, quality, keyboard shortcuts,
 * picture-in-picture, remembered volume/speed) over an hls.js stream, walking
 * down a chain of progressive sources whenever a source fails to load.
 */
export const HlsVideoPlayer = ({
  hlsUrl,
  playbackUrl,
  originalUrl,
  poster,
  title,
  className,
  autoPlay,
  onCanPlay,
  onEnded,
  onProgress,
  onError,
  startSeconds,
  endSeconds,
}: HlsVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCanPlayRef = useRef(onCanPlay);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  onCanPlayRef.current = onCanPlay;
  onEndedRef.current = onEnded;
  onErrorRef.current = onError;
  onProgressRef.current = onProgress;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;
    let hls: import("hls.js").default | undefined;
    let player: PlyrType | undefined;
    let usingHls = false;
    let ready = false;
    let manifestTimer: number | undefined;

    /**
     * `canplay` alone is not enough: with preload="metadata" the browser often
     * loads the header and stops, so it never fires until playback starts.
     * `loadedmetadata` is the reliable "we have a video" signal.
     */
    const markReady = () => {
      if (ready || destroyed) return;
      ready = true;
      window.clearTimeout(watchdog);
      onCanPlayRef.current?.();
    };

    const watchdog = window.setTimeout(markReady, READY_WATCHDOG);

    const clipStart = typeof startSeconds === "number" ? startSeconds : null;
    const clipEnd = typeof endSeconds === "number" ? endSeconds : null;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      onEndedRef.current?.();
    };

    const handleEnded = () => finish();

    /** Jump to the clip's first frame as soon as we're allowed to seek. */
    const seekToStart = () => {
      if (clipStart === null) return;
      if (video.currentTime < clipStart - 0.5 || video.currentTime > clipStart + 0.5) {
        try {
          video.currentTime = clipStart;
        } catch {
          // Not seekable yet; the next metadata event tries again.
        }
      }
    };

    // timeupdate fires ~4x a second; once a second is plenty for progress.
    let lastReport = 0;
    const handleTimeUpdate = () => {
      // The clip's end is this part's end, even though the file runs on.
      if (clipEnd !== null && video.currentTime >= clipEnd) {
        video.pause();
        finish();
        return;
      }

      const now = Date.now();
      if (now - lastReport < 1000) return;
      lastReport = now;
      if (!video.duration || !Number.isFinite(video.duration)) return;

      // Progress is measured across the clip, not the whole recording.
      if (clipStart !== null || clipEnd !== null) {
        const from = clipStart ?? 0;
        const to = clipEnd ?? video.duration;
        const span = to - from;
        if (span > 0) {
          onProgressRef.current?.(
            Math.min(Math.max((video.currentTime - from) / span, 0), 1)
          );
        }
        return;
      }

      onProgressRef.current?.(video.currentTime / video.duration);
    };

    video.addEventListener("loadedmetadata", seekToStart);
    video.addEventListener("loadeddata", seekToStart);
    video.addEventListener("loadedmetadata", markReady);
    video.addEventListener("canplay", markReady);
    video.addEventListener("playing", markReady);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("timeupdate", handleTimeUpdate);

    const cleanupListeners = () => {
      video.removeEventListener("loadedmetadata", seekToStart);
      video.removeEventListener("loadeddata", seekToStart);
      video.removeEventListener("loadedmetadata", markReady);
      video.removeEventListener("canplay", markReady);
      video.removeEventListener("playing", markReady);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };

    const baseOptions: PlyrType.Options = {
      controls: [
        "play-large",
        "restart",
        "rewind",
        "play",
        "fast-forward",
        "progress",
        "current-time",
        "duration",
        "mute",
        "volume",
        "settings",
        "pip",
        "fullscreen",
      ],
      settings: ["quality", "speed"],
      speed: { selected: 1, options: SPEED_OPTIONS },
      seekTime: 10,
      tooltips: { controls: true, seek: true },
      keyboard: { focused: true, global: false },
      storage: { enabled: true, key: "nage7-player" },
      i18n,
    };

    // Nothing to play at all — don't spin forever.
    if (!hlsUrl && !playbackUrl && !originalUrl) {
      markReady();
      onErrorRef.current?.();
      return () => {
        window.clearTimeout(watchdog);
        cleanupListeners();
      };
    }

    let handleMediaError: (() => void) | undefined;

    const setup = async () => {
      const { default: Plyr } = await import("plyr");
      if (destroyed) return;

      const nativeHls = video.canPlayType("application/vnd.apple.mpegurl") !== "";

      // Safari plays the manifest itself, so it joins the head of the chain.
      const chain = Array.from(
        new Set(
          [
            ...(hlsUrl && nativeHls ? [hlsUrl] : []),
            playbackUrl,
            originalUrl,
          ].filter(Boolean) as string[]
        )
      );

      let sourceIndex = -1;

      const ensurePlayer = () => {
        // Never destroy and rebuild: Plyr.destroy() restores the original
        // markup and detaches the element this component holds a ref to.
        if (!player) player = new Plyr(video, baseOptions);
      };

      /** Walks to the next progressive source, or gives up. */
      const playNextSource = () => {
        if (destroyed) return;
        usingHls = false;
        sourceIndex += 1;

        if (sourceIndex >= chain.length) {
          markReady();
          onErrorRef.current?.();
          return;
        }

        video.src = chain[sourceIndex];
        video.load();
        ensurePlayer();
      };

      // A failing <video> source advances the chain; hls.js reports its own.
      handleMediaError = () => {
        if (destroyed || usingHls) return;
        playNextSource();
      };
      video.addEventListener("error", handleMediaError);

      if (hlsUrl && !nativeHls) {
        const { default: Hls } = await import("hls.js");
        if (destroyed) return;

        if (!Hls.isSupported()) {
          playNextSource();
          return;
        }

        const instance = new Hls({ enableWorker: true });
        hls = instance;
        usingHls = true;

        const abandonHls = () => {
          if (destroyed || !usingHls) return;
          window.clearTimeout(manifestTimer);
          usingHls = false;
          instance.destroy();
          hls = undefined;
          playNextSource();
        };

        // If the adaptive rendition is still being generated, stop waiting.
        manifestTimer = window.setTimeout(abandonHls, HLS_MANIFEST_TIMEOUT);

        // Build the quality menu out of the renditions Cloudinary produced.
        instance.on(Hls.Events.MANIFEST_PARSED, () => {
          if (destroyed || player || !usingHls) return;
          window.clearTimeout(manifestTimer);

          const heights = Array.from(
            new Set(
              instance.levels
                .map((level) => level.height)
                .filter((height): height is number => Boolean(height))
            )
          ).sort((a, b) => b - a);

          player = new Plyr(video, {
            ...baseOptions,
            quality: heights.length
              ? {
                  default: 0, // 0 renders as "تلقائي"
                  options: [0, ...heights],
                  forced: true,
                  onChange: (quality: number) => {
                    if (!hls) return;
                    if (quality === 0) {
                      hls.currentLevel = -1;
                      return;
                    }
                    const index = hls.levels.findIndex(
                      (level) => level.height === quality
                    );
                    if (index !== -1) hls.currentLevel = index;
                  },
                }
              : undefined,
          });
        });

        instance.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) abandonHls();
        });

        instance.loadSource(hlsUrl);
        instance.attachMedia(video);
        return;
      }

      playNextSource();
    };

    setup();

    return () => {
      destroyed = true;
      window.clearTimeout(watchdog);
      window.clearTimeout(manifestTimer);
      cleanupListeners();
      if (handleMediaError) video.removeEventListener("error", handleMediaError);
      player?.destroy();
      hls?.destroy();
    };
    // Re-running on a clip change is what makes navigating between two parts
    // of the same recording actually re-seek.
  }, [hlsUrl, playbackUrl, originalUrl, startSeconds, endSeconds]);

  return (
    // Media controls read left-to-right even on this RTL site.
    <div
      dir="ltr"
      className={cn("plyr-shell h-full w-full", className)}
      style={
        {
          "--plyr-color-main": "#10b981",
          "--plyr-video-background": "#000000",
        } as React.CSSProperties
      }
    >
      <video
        ref={videoRef}
        title={title}
        poster={poster ?? undefined}
        className="h-full w-full"
        controls
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
      />
    </div>
  );
};

export default HlsVideoPlayer;
