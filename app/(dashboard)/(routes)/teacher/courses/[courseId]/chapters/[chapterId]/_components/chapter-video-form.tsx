"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Pencil, PlusCircle, Video } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Chapter, VideoData } from "@prisma/client";
import { FileUpload } from "@/components/file-upload";
import { HlsVideoPlayer } from "@/components/hls-video-player";

interface ChapteVideoFormProps {
  initialData: Chapter & { videoData?: VideoData | null };
  courseId: string;
  chapterId: string;
}

const ChapteVideoForm: React.FC<ChapteVideoFormProps> = ({
  initialData,
  courseId,
  chapterId,
}) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing((current) => !current);
  };

  const formSchema = z.object({
    videoUrl: z.string().min(1, {
      message: "لازم ترفع فيديو واحد على الأقل",
    }),
    videoPublicId: z.string().min(1),
    videoDuration: z.number().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { videoUrl: initialData?.videoUrl || "" },
  });

  const { isSubmitting, isValid } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await axios.patch(
        `/api/courses/${courseId}/chapters/${chapterId}`,
        values
      );
      toast.success("تم رفع الفيديو");
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Failed to update the chapter", error);
      toast.error("حدث خطأ");
    }
  }

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-6">
      <div className="font-medium flex items-center justify-between">
        فيديو الجزء
        <Button variant="ghost" onClick={toggleEdit}>
          {isEditing ? (
            <>إلغاء</>
          ) : initialData.videoUrl ? (
            <>
              <Pencil className="h-4 w-4 ml-2" />
              تعديل الفيديو
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 ml-2" />
              أضف فيديو
            </>
          )}
        </Button>
      </div>
      {isEditing ? (
        <div>
          <FileUpload
            endpoint="courseVideo"
            onChange={async (file) => {
              if (!file) {
                toast.error("حدث خطأ أثناء رفع الفيديو");
                return;
              }
              await onSubmit({
                videoUrl: file.url,
                videoPublicId: file.publicId,
                videoDuration: file.duration,
              });
            }}
          />
          <div className="text-xs text-muted-foreground mt-4">
            ارفع فيديو الجزء ده
          </div>
        </div>
      ) : initialData.videoUrl ? (
        <div className="relative aspect-video mt-2 overflow-hidden rounded-md">
          <HlsVideoPlayer
            hlsUrl={initialData.videoData?.hlsUrl}
            playbackUrl={initialData.videoData?.playbackUrl}
            originalUrl={initialData.videoUrl}
            poster={initialData.videoData?.thumbnailUrl}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
          <Video className="h-10 w-10 text-slate-500" />
        </div>
      )}
      {initialData.videoUrl && !isEditing && (
        <div className=" text-xs text-muted-foreground mt-2">
          قد تستغرق نسخة البث التلقائي بضع دقائق. حدث الصفحة إذا لم يظهر الفيديو
        </div>
      )}
    </div>
  );
};

export default ChapteVideoForm;
