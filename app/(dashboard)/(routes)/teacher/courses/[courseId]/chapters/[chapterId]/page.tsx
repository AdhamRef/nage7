import { IconBadge } from "@/components/icon-badge";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  LayoutDashboard,
  Terminal,
  Video,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";
import ChapterTitleForm from "./_components/chapter-title-form";
import ChapterDescriptionForm from "./_components/chapter-description-form";
import ChapteAccessForm from "./_components/chapter-access-form";
import { isAssessment } from "@/lib/chapter-kind";
import { cn } from "@/lib/utils";

import ChapterClipForm from "./_components/chapter-clip-form";
import ChapterVideoForm from "./_components/chapter-video-form";
import { Banner } from "@/components/banner";
import ChapterActions from "./_components/chapter-actions";
import ChapterExercisesForm from "./_components/chapter-exercises-form";

const page = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const chapter = await db.chapter.findUnique({
    where: {
      id: params.chapterId,
      courseId: params.courseId,
    },
    include: {
      videoData: true,
      exercises: { orderBy: { position: "asc" } },
    },
  });
  // The course recording, so this part can be cut from it instead.
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    select: {
      sourceVideoUrl: true,
      sourceVideoHlsUrl: true,
      sourceVideoThumb: true,
      sourceVideoDuration: true,
      sourceYoutubeId: true,
    },
  });

  if (!chapter) {
    return redirect("/sign-in");
  }

  /**
   * A lesson is ready when it has video from either route; an assessment is
   * ready when it has at least one question, since that is its whole content.
   */
  const assessment = isAssessment(chapter.kind);
  const requiredFields = assessment
    ? [chapter.title, chapter.exercises.length > 0]
    : [
        chapter.title,
        chapter.description,
        chapter.videoUrl || chapter.youtubeId || chapter.startSeconds !== null,
      ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;

  const completionText = `(${completedFields}/${totalFields})`;

  const isComplete = requiredFields.every(Boolean);

  

  return (
    <>
      {!chapter.isPublished && (
        <Banner
          variant="warning"
          label="الجزء ده مش منشور، ومش هيبان في الدرس"
        />
      )}
      <div className="p-6">
        <div className=" flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/teacher/courses/${params.courseId}`}
              className=" flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowRight className=" h-4 w-4 ml-2" />
              الرجوع لإعداد الدرس
            </Link>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-y-2">
                <h1 className="text-2xl font-bold">إنشاء جزء</h1>
                <span className="text-sm text-slate-700">
                  كمّل كل الخانات {completionText}
                </span>
              </div>
              <ChapterActions
                disabled={!isComplete}
                courseId={params.courseId}
                chapterId={params.chapterId}
                isPublished={chapter.isPublished}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div className=" space-y-4">
            <div>
              <div className=" flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">تخصيص الجزء ({chapter.title})</h2>
              </div>
              <ChapterTitleForm
                initialData={chapter}
                courseId={params.courseId}
                chapterId={params.chapterId}
              />
              <ChapterDescriptionForm
                initialData={chapter}
                courseId={params.courseId}
                chapterId={params.chapterId}
              />
              <div>
                <div className=" flex items-center gap-x-2 mt-4">
                  <IconBadge icon={Eye} />
                  <h2 className=" text-xl">إعدادات الوصول</h2>
                </div>
                <ChapteAccessForm
                  initialData={chapter}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                />
              </div>
            </div>
          </div>
          <div>
            {/* An assessment has no recording — the questions are the part. */}
            {!assessment && (
              <>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={Video} />
                  <h2 className=" text-xl">أضف فيديو</h2>
                </div>
                <ChapterVideoForm
                  initialData={chapter}
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                />

                <ChapterClipForm
                  courseId={params.courseId}
                  chapterId={params.chapterId}
                  startSeconds={chapter.startSeconds}
                  endSeconds={chapter.endSeconds}
                  sourceVideoUrl={course?.sourceVideoUrl ?? null}
                  sourceVideoHlsUrl={course?.sourceVideoHlsUrl ?? null}
                  sourceVideoThumb={course?.sourceVideoThumb ?? null}
                  sourceVideoDuration={course?.sourceVideoDuration ?? null}
                  sourceYoutubeId={course?.sourceYoutubeId ?? null}
                  hasOwnVideo={Boolean(chapter.videoUrl || chapter.youtubeId)}
                />
              </>
            )}
            <div
              className={cn(
                "flex items-center gap-x-2",
                !assessment && "mt-8"
              )}
            >
              <IconBadge icon={Terminal} />
              <h2 className="text-xl">
                {assessment ? "أسئلة الامتحان" : "تمارين الجزء"}
              </h2>
            </div>
            <ChapterExercisesForm
              initialData={chapter.exercises}
              courseId={params.courseId}
              chapterId={params.chapterId}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
