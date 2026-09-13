"use client";

import axios from "axios";
import { Loader2, Pencil, Scissors } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { HlsVideoPlayer } from "@/components/hls-video-player";
import { YoutubeClipPlayer } from "@/components/youtube-clip-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTotalDuration, parseTimecode, toTimecode } from "@/lib/format";

interface ChapterClipFormProps {
  courseId: string;
  chapterId: string;
  startSeconds: number | null;
  endSeconds: number | null;
  /** Null when the course has no full recording to cut from. */
  sourceVideoUrl: string | null;
  sourceVideoHlsUrl: string | null;
  sourceVideoThumb: string | null;
  sourceVideoDuration: number | null;
  /** Set when the course recording is on YouTube rather than uploaded. */
  sourceYoutubeId: string | null;
  /** True when this part already carries its own upload. */
  hasOwnVideo: boolean;
}

/**
 * Marks the stretch of the course recording this part covers, as an
 * alternative to uploading a file for it.
 */
export const ChapterClipForm = ({
  courseId,
  chapterId,
  startSeconds,
  endSeconds,
  sourceVideoUrl,
  sourceVideoHlsUrl,
  sourceVideoThumb,
  sourceVideoDuration,
  sourceYoutubeId,
  hasOwnVideo,
}: ChapterClipFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [from, setFrom] = useState(toTimecode(startSeconds));
  const [to, setTo] = useState(toTimecode(endSeconds));
  const [error, setError] = useState<string | null>(null);

  const isClip = startSeconds !== null;
  const total = formatTotalDuration(sourceVideoDuration ?? 0);

  const save = async () => {
    const start = parseTimecode(from);
    const end = parseTimecode(to);

    if (start === null) return setError("اكتب وقت البداية بصيغة د:ث");
    if (end === null) return setError("اكتب وقت النهاية بصيغة د:ث");
    if (end <= start) return setError("وقت النهاية لازم يكون بعد البداية");
    if (sourceVideoDuration && end > sourceVideoDuration + 1) {
      return setError(`الفيديو مدته ${toTimecode(sourceVideoDuration)} بس`);
    }

    setError(null);
    setIsSaving(true);
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        startSeconds: start,
        endSeconds: end,
      });
      toast.success("تم تحديد وقت الجزء");
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      const message = err?.response?.data?.error ?? "حدث خطأ";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const clear = async () => {
    setIsSaving(true);
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
        startSeconds: null,
        endSeconds: null,
      });
      toast.success("تم إلغاء التقسيم");
      setFrom("");
      setTo("");
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  // Nothing to cut from yet.
  if (!sourceVideoUrl && !sourceYoutubeId) {
    return (
      <div className="mt-6 rounded-md border border-dashed p-6 text-sm dark:border-slate-800">
        <p className="flex items-center gap-x-2 font-medium">
          <Scissors className="h-4 w-4 text-brand" />
          قص من فيديو الدرس
        </p>
        <p className="mt-2 text-muted-foreground">
          لو رفعت تسجيل الدرس كله مرة واحدة، تقدر تحدّد من هنا الجزء ده بيبدأ
          فين وبيخلص فين بدل ما ترفعله فيديو لوحده.{" "}
          <Link
            href={`/teacher/courses/${courseId}`}
            className="font-semibold text-sky-700 hover:underline dark:text-sky-400"
          >
            ارفع فيديو الدرس
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-md border bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between font-medium">
        <span className="flex items-center gap-x-2">
          <Scissors className="h-4 w-4 text-brand" />
          قص من فيديو الدرس
        </span>

        <Button
          variant="ghost"
          onClick={() => {
            setError(null);
            setFrom(toTimecode(startSeconds));
            setTo(toTimecode(endSeconds));
            setIsEditing((value) => !value);
          }}
          disabled={isSaving}
        >
          {isEditing ? (
            "إلغاء"
          ) : (
            <>
              <Pencil className="ml-2 h-4 w-4" />
              {isClip ? "تعديل الوقت" : "حدّد الوقت"}
            </>
          )}
        </Button>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-4">
          {hasOwnVideo && (
            <p className="rounded-md bg-amber-100 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              الجزء ده عنده فيديو مرفوع لوحده. لو حدّدت وقت من فيديو الدرس،
              الفيديو المرفوع هيتمسح.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clip-from" className="text-xs">
                من
              </Label>
              <Input
                id="clip-from"
                dir="ltr"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                placeholder="0:00"
                className="h-10 text-left font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clip-to" className="text-xs">
                إلى
              </Label>
              <Input
                id="clip-to"
                dir="ltr"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                placeholder="12:30"
                className="h-10 text-left font-mono"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            بصيغة دقيقة:ثانية — زي 12:30، أو ساعة:دقيقة:ثانية للفيديوهات
            الطويلة.
            {total ? ` فيديو الدرس مدته ${total}.` : ""}
          </p>

          {error && (
            <p className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-x-2">
            <Button onClick={save} disabled={isSaving} size="sm">
              {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
            {isClip && (
              <Button
                variant="outline"
                size="sm"
                onClick={clear}
                disabled={isSaving}
              >
                إلغاء التقسيم
              </Button>
            )}
          </div>
        </div>
      ) : isClip ? (
        <>
          <p dir="ltr" className="mt-3 text-right font-mono text-sm font-bold">
            {toTimecode(startSeconds)} — {toTimecode(endSeconds)}
          </p>
          <div className="relative mt-3 aspect-video overflow-hidden rounded-md">
            {sourceYoutubeId ? (
              <YoutubeClipPlayer
                videoId={sourceYoutubeId}
                startSeconds={startSeconds}
                endSeconds={endSeconds}
              />
            ) : (
              <HlsVideoPlayer
                hlsUrl={sourceVideoHlsUrl}
                playbackUrl={sourceVideoUrl}
                originalUrl={sourceVideoUrl}
                poster={sourceVideoThumb}
                startSeconds={startSeconds}
                endSeconds={endSeconds}
              />
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm italic text-slate-500">
          لسه محددتش وقت الجزء ده من فيديو الدرس
        </p>
      )}
    </div>
  );
};

export default ChapterClipForm;
