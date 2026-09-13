"use client";

import axios from "axios";
import { Loader2, Lock, VideoOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";

import { HlsVideoPlayer } from "@/components/hls-video-player";
import { YoutubeClipPlayer } from "@/components/youtube-clip-player";
import { useConfettiStore } from "@/hooks/use-confetti-store";

/** Watching this much of the lesson counts as finishing it. */
const COMPLETION_THRESHOLD = 0.95;

type Props = {
  chapterId: string;
  title: string;
  courseId: string;
  nextChapterId?: string;
  /** Send the student to this chapter's exercises before the next lesson. */
  hasExercises?: boolean;
  /** Set when the part is a slice of a YouTube recording. */
  youtubeId?: string | null;
  playbackUrl: string | null | undefined;
  hlsUrl: string | null | undefined;
  originalUrl?: string | null;
  thumbnailUrl?: string | null;
  /** Set when this part is a slice of the course's single recording. */
  startSeconds?: number | null;
  endSeconds?: number | null;
  isLocked: boolean;
  completeOnEnd: boolean;
};

const VideoPlayer = ({
  chapterId,
  title,
  courseId,
  nextChapterId,
  hasExercises = false,
  youtubeId,
  playbackUrl,
  hlsUrl,
  originalUrl,
  thumbnailUrl,
  startSeconds,
  endSeconds,
  isLocked,
  completeOnEnd,
}: Props) => {
  const router = useRouter();
  const confetti = useConfettiStore();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const completedRef = useRef(false);

  /** Records the lesson as finished. Safe to call repeatedly. */
  const markComplete = useCallback(async () => {
    if (completedRef.current || !completeOnEnd) return;
    completedRef.current = true;

    try {
      await axios.put(
        `/api/courses/${courseId}/chapters/${chapterId}/progress`,
        { isCompleted: true }
      );
      toast.success("خلّصت الجزء ده");
      router.refresh();
    } catch {
      completedRef.current = false;
      toast.error("حدث خطأ");
    }
  }, [chapterId, completeOnEnd, courseId, router]);

  // Most students never let the video run to the very last frame, so finishing
  // is driven by watch progress as well as the `ended` event.
  const onProgress = useCallback(
    (playedRatio: number) => {
      if (playedRatio >= COMPLETION_THRESHOLD) void markComplete();
    },
    [markComplete]
  );

  const onEnd = async () => {
    await markComplete();

    // Practise what the lesson just taught before moving on.
    if (hasExercises) {
      router.push(
        `/courses/${courseId}/chapters/${chapterId}/exercises`
      );
      return;
    }

    if (!nextChapterId) {
      confetti.onOpen();
    }
    router.refresh();
    if (nextChapterId) {
      router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
    }
  };

  return (
    <div className="relative h-[220px] w-full bg-black sm:h-[45vh] lg:h-[70vh]">
      {!isReady && !isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-y-2 bg-slate-900 text-secondary">
          <Lock className="h-8 w-8" />
          <p className=" text-sm">مش هتقدر تشوف الجزء ده</p>
        </div>
      )}
      {hasError && !isLocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-y-2 bg-slate-900 text-secondary">
          <VideoOff className="h-8 w-8" />
          <p className="text-sm">الفيديو مش راضي يشتغل. حدّث الصفحة أو جرّب تاني بعد شوية.</p>
        </div>
      )}
      {!isLocked && youtubeId && (
        <YoutubeClipPlayer
          videoId={youtubeId}
          title={title}
          startSeconds={startSeconds}
          endSeconds={endSeconds}
          onCanPlay={() => setIsReady(true)}
          onProgress={onProgress}
          onEnded={onEnd}
          onError={() => setHasError(true)}
          autoPlay
        />
      )}
      {!isLocked && !youtubeId && (
        <HlsVideoPlayer
          title={title}
          hlsUrl={hlsUrl}
          playbackUrl={playbackUrl}
          originalUrl={originalUrl}
          poster={thumbnailUrl}
          startSeconds={startSeconds}
          endSeconds={endSeconds}
          onCanPlay={() => {
            setIsReady(true);
          }}
          onProgress={onProgress}
          onEnded={onEnd}
          onError={() => setHasError(true)}
          autoPlay
        />
      )}
    </div>
  );
};

export default VideoPlayer;
