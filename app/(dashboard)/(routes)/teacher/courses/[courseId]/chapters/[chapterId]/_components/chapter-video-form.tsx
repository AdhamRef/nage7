"use client";

import { Chapter, VideoData } from "@prisma/client";
import axios from "axios";
import {
  Link2,
  Loader2,
  Pencil,
  PlusCircle,
  Upload,
  Video,
  Youtube,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { FileUpload } from "@/components/file-upload";
import { HlsVideoPlayer } from "@/components/hls-video-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { YoutubeClipPlayer } from "@/components/youtube-clip-player";
import { parseTimecode, toTimecode } from "@/lib/format";
import { cn } from "@/lib/utils";
import { parseYoutubeId } from "@/lib/youtube";

interface ChapterVideoFormProps {
  initialData: Chapter & { videoData?: VideoData | null };
  courseId: string;
  chapterId: string;
}

type Mode = "youtube" | "upload";

/**
 * A part's own video: a YouTube link (with optional from/to marks, so one
 * long video can serve several parts) or an uploaded file.
 */
const ChapterVideoForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterVideoFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<Mode>(
    initialData.videoUrl && !initialData.youtubeId ? "upload" : "youtube"
  );

  const [youtubeUrl, setYoutubeUrl] = useState(
    initialData.youtubeId ? `https://youtu.be/${initialData.youtubeId}` : ""
  );
  const [from, setFrom] = useState(
    initialData.youtubeId ? toTimecode(initialData.startSeconds) : ""
  );
  const [to, setTo] = useState(
    initialData.youtubeId ? toTimecode(initialData.endSeconds) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const previewId = parseYoutubeId(youtubeUrl);
  const hasVideo = Boolean(initialData.videoUrl || initialData.youtubeId);

  const patch = async (body: Record<string, unknown>, message: string) => {
    setIsSaving(true);
    try {
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, body);
      toast.success(message);
      setIsEditing(false);
      setError(null);
      router.refresh();
    } catch (err: any) {
      const text = err?.response?.data?.error ?? "حدث خطأ";
      setError(text);
      toast.error(text);
    } finally {
      setIsSaving(false);
    }
  };

  const saveYoutube = async () => {
    if (!previewId) return setError("لينك يوتيوب مش صحيح");

    // Marks are optional; when given, both must parse and be in order.
    const hasMarks = from.trim() !== "" || to.trim() !== "";
    let start: number | null = null;
    let end: number | null = null;

    if (hasMarks) {
      start = parseTimecode(from);
      end = parseTimecode(to);
      if (start === null) return setError("اكتب وقت البداية بصيغة د:ث");
      if (end === null) return setError("اكتب وقت النهاية بصيغة د:ث");
      if (end <= start) return setError("وقت النهاية لازم يكون بعد البداية");
    }

    await patch(
      { youtubeUrl: youtubeUrl.trim(), startSeconds: start, endSeconds: end },
      "تم ربط فيديو يوتيوب"
    );
  };

  const saveUpload = async (file: {
    url: string;
    publicId: string;
    duration?: number;
  }) =>
    patch(
      {
        videoUrl: file.url,
        videoPublicId: file.publicId,
        videoDuration: file.duration,
      },
      "تم رفع الفيديو"
    );

  const modeButton = (value: Mode, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={cn(
        "flex flex-1 items-center justify-center gap-x-2 rounded-lg border px-3 py-2.5 text-sm font-bold transition",
        mode === value
          ? "border-brand bg-brand/5 text-brand-deep dark:text-brand"
          : "hover:border-slate-400 dark:border-slate-800"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="mt-6 rounded-md border bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between font-medium">
        فيديو الجزء
        <Button
          variant="ghost"
          onClick={() => {
            setError(null);
            setIsEditing((value) => !value);
          }}
          disabled={isSaving}
        >
          {isEditing ? (
            <>إلغاء</>
          ) : hasVideo ? (
            <>
              <Pencil className="ml-2 h-4 w-4" />
              تعديل الفيديو
            </>
          ) : (
            <>
              <PlusCircle className="ml-2 h-4 w-4" />
              أضف فيديو
            </>
          )}
        </Button>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-4">
          <div className="flex gap-x-2">
            {modeButton("youtube", <Youtube className="h-4 w-4 text-red-600" />, "لينك يوتيوب")}
            {modeButton("upload", <Upload className="h-4 w-4" />, "رفع ملف")}
          </div>

          {mode === "youtube" ? (
            <div className="space-y-4">
              <Input
                dir="ltr"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-10 text-left font-mono text-sm"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="yt-from" className="text-xs">
                    من (اختياري)
                  </Label>
                  <Input
                    id="yt-from"
                    dir="ltr"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    placeholder="0:00"
                    className="h-10 text-left font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="yt-to" className="text-xs">
                    إلى (اختياري)
                  </Label>
                  <Input
                    id="yt-to"
                    dir="ltr"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    placeholder="12:30"
                    className="h-10 text-left font-mono"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                سيب الوقت فاضي لو الفيديو كله للجزء ده. أو حدّد من دقيقة كام
                لدقيقة كام لو فيديو واحد طويل بيغطي كذا جزء.
              </p>

              {previewId && (
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <YoutubeClipPlayer
                    videoId={previewId}
                    startSeconds={parseTimecode(from)}
                    endSeconds={parseTimecode(to)}
                  />
                </div>
              )}

              {error && (
                <p className="rounded-md bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                onClick={saveYoutube}
                disabled={isSaving || !previewId}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="ml-2 h-4 w-4" />
                )}
                حفظ
              </Button>
            </div>
          ) : isSaving ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : (
            <div>
              <FileUpload
                endpoint="courseVideo"
                onChange={async (file) => {
                  if (!file) {
                    toast.error("حصل خطأ وإنت بترفع الفيديو");
                    return;
                  }
                  await saveUpload(file);
                }}
              />
              <p className="mt-4 text-xs text-muted-foreground">
                ارفع فيديو الجزء ده
              </p>
            </div>
          )}
        </div>
      ) : initialData.youtubeId ? (
        <>
          <div className="relative mt-2 aspect-video overflow-hidden rounded-md">
            <YoutubeClipPlayer
              videoId={initialData.youtubeId}
              startSeconds={initialData.startSeconds}
              endSeconds={initialData.endSeconds}
            />
          </div>
          <p className="mt-2 flex items-center gap-x-1.5 text-xs text-muted-foreground">
            <Youtube className="h-3.5 w-3.5 text-red-600" />
            من يوتيوب
            {initialData.startSeconds !== null && (
              <span dir="ltr" className="font-mono">
                · {toTimecode(initialData.startSeconds)} —{" "}
                {toTimecode(initialData.endSeconds)}
              </span>
            )}
          </p>
        </>
      ) : initialData.videoUrl ? (
        <>
          <div className="relative mt-2 aspect-video overflow-hidden rounded-md">
            <HlsVideoPlayer
              hlsUrl={initialData.videoData?.hlsUrl}
              playbackUrl={initialData.videoData?.playbackUrl}
              originalUrl={initialData.videoUrl}
              poster={initialData.videoData?.thumbnailUrl}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            قد تستغرق نسخة البث التلقائي بضع دقائق. حدّث الصفحة لو الفيديو
            مظهرش.
          </p>
        </>
      ) : (
        <div className="mt-2 flex h-60 items-center justify-center rounded-md bg-slate-200 dark:bg-slate-800">
          <Video className="h-10 w-10 text-slate-500" />
        </div>
      )}
    </div>
  );
};

export default ChapterVideoForm;
