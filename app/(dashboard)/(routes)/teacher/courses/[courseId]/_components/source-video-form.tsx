"use client";

import axios from "axios";
import {
  Film,
  Link2,
  Loader2,
  PlusCircle,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { FileUpload } from "@/components/file-upload";
import { HlsVideoPlayer } from "@/components/hls-video-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YoutubeClipPlayer } from "@/components/youtube-clip-player";
import { formatTotalDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { parseYoutubeId } from "@/lib/youtube";

interface SourceVideoFormProps {
  courseId: string;
  sourceVideoUrl: string | null;
  sourceVideoHlsUrl: string | null;
  sourceVideoThumb: string | null;
  sourceVideoDuration: number | null;
  /** Set instead of the upload fields when the recording is on YouTube. */
  sourceYoutubeId: string | null;
  /** How many parts are already cut out of this recording. */
  clipCount: number;
}

type Mode = "youtube" | "upload";

/**
 * The whole session in one place — a YouTube link or an upload — so each
 * part can then mark the range it covers instead of needing its own file.
 */
export const SourceVideoForm = ({
  courseId,
  sourceVideoUrl,
  sourceVideoHlsUrl,
  sourceVideoThumb,
  sourceVideoDuration,
  sourceYoutubeId,
  clipCount,
}: SourceVideoFormProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("youtube");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const hasSource = Boolean(sourceYoutubeId || sourceVideoUrl);
  const duration = formatTotalDuration(sourceVideoDuration ?? 0);
  const previewId = parseYoutubeId(youtubeUrl);

  const finish = (message: string) => {
    toast.success(message);
    setIsEditing(false);
    setYoutubeUrl("");
    router.refresh();
  };

  const saveYoutube = async () => {
    if (!previewId) {
      toast.error("لينك يوتيوب مش صحيح");
      return;
    }
    setIsSaving(true);
    try {
      await axios.post(`/api/courses/${courseId}/source-video`, {
        youtubeUrl: youtubeUrl.trim(),
      });
      finish("تم ربط فيديو يوتيوب");
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  const saveUpload = async (file: {
    url: string;
    publicId: string;
    duration?: number;
  }) => {
    setIsSaving(true);
    try {
      await axios.post(`/api/courses/${courseId}/source-video`, {
        videoUrl: file.url,
        videoPublicId: file.publicId,
        videoDuration: file.duration,
      });
      finish("تم رفع فيديو الدرس");
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    const warning = clipCount
      ? `في ${clipCount} جزء متقسّمين من الفيديو ده. لو مسحته هيفضلوا من غير فيديو. تكمّل؟`
      : "تمسح فيديو الدرس؟";
    if (!window.confirm(warning)) return;

    setIsSaving(true);
    try {
      await axios.delete(`/api/courses/${courseId}/source-video`);
      toast.success("تم مسح فيديو الدرس");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

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
        <span className="flex items-center gap-x-2">
          <Film className="h-4 w-4 text-brand" />
          فيديو الدرس الكامل (اختياري)
        </span>

        <div className="flex items-center gap-x-1">
          {hasSource && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={remove}
              disabled={isSaving}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsEditing((value) => !value)}
            disabled={isSaving}
          >
            {isEditing ? (
              "إلغاء"
            ) : (
              <>
                <PlusCircle className="ml-2 h-4 w-4" />
                {hasSource ? "تغيير الفيديو" : "أضف الفيديو"}
              </>
            )}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-4">
          <div className="flex gap-x-2">
            {modeButton("youtube", <Youtube className="h-4 w-4 text-red-600" />, "لينك يوتيوب")}
            {modeButton("upload", <Upload className="h-4 w-4" />, "رفع ملف")}
          </div>

          {mode === "youtube" ? (
            <div className="space-y-3">
              <div className="flex gap-x-2">
                <Input
                  dir="ltr"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="h-10 text-left font-mono text-sm"
                />
                <Button
                  onClick={saveYoutube}
                  disabled={isSaving || !previewId}
                  className="h-10 shrink-0"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="ml-2 h-4 w-4" />
                  )}
                  ربط
                </Button>
              </div>

              {previewId && (
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <YoutubeClipPlayer videoId={previewId} />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                حط لينك الفيديو من يوتيوب — عادي أو غير مدرج (Unlisted) — وبعدين
                من كل جزء حدّد بيبدأ من دقيقة كام لدقيقة كام.
              </p>
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
                ارفع تسجيل الدرس كله مرة واحدة، وبعدين من كل جزء حدّد بيبدأ من
                دقيقة كام لدقيقة كام.
              </p>
            </div>
          )}
        </div>
      ) : sourceYoutubeId ? (
        <>
          <div className="relative mt-3 aspect-video overflow-hidden rounded-md">
            <YoutubeClipPlayer videoId={sourceYoutubeId} />
          </div>
          <p className="mt-3 flex items-center gap-x-1.5 text-xs text-muted-foreground">
            <Youtube className="h-3.5 w-3.5 text-red-600" />
            من يوتيوب ·{" "}
            {clipCount > 0
              ? `${clipCount} جزء متقسّمين منه`
              : "لسه مفيش أجزاء متقسّمة منه — افتح أي جزء وحدّد وقته."}
          </p>
        </>
      ) : sourceVideoUrl ? (
        <>
          <div className="relative mt-3 aspect-video overflow-hidden rounded-md">
            <HlsVideoPlayer
              hlsUrl={sourceVideoHlsUrl}
              playbackUrl={sourceVideoUrl}
              originalUrl={sourceVideoUrl}
              poster={sourceVideoThumb}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {duration ? `المدة ${duration} · ` : ""}
            {clipCount > 0
              ? `${clipCount} جزء متقسّمين منه`
              : "لسه مفيش أجزاء متقسّمة منه — افتح أي جزء وحدّد وقته."}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          لو الدرس كله متسجّل في فيديو واحد — على يوتيوب أو عندك كملف — حطه هنا
          مرة واحدة وقسّمه على الأجزاء بالتوقيت. أو سيب المكان ده فاضي وارفع
          فيديو لكل جزء لوحده.
        </p>
      )}
    </div>
  );
};

export default SourceVideoForm;
