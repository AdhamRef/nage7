import { auth } from "@/lib/auth";
import Link from "next/link";
import { ClipboardCheck, File, Terminal } from "lucide-react";
import { redirect } from "next/navigation";
import React from "react";

import getChapter from "@/actions/get-chapter";
import { Banner } from "@/components/banner";
import { chapterKindLabels, isAssessment } from "@/lib/chapter-kind";
import { Preview } from "@/components/preview";
import { Separator } from "@/components/ui/separator";

import ChapterUnlockPanel from "./_components/course-enroll-button";
import CourseProgressButton from "./_components/course-progress-button";
import MarkSeen from "./_components/mark-seen";
import VideoPlayer from "./_components/video-player";

const ChapterIdPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
    return null; // Added to ensure a return statement is present
  }

  const {
    chapter,
    course,
    playback,
    exercises,
    attachments,
    nextChapter,
    userProgress,
    hasAccess,
  } = await getChapter({
    userId: userId,
    chapterId: params.chapterId,
    courseId: params.courseId,
  });

  if (!chapter || !course) {
    redirect("/sign-in");
    return null; // Added to ensure a return statement is present
  }

  const isLocked = !chapter.isFree && !hasAccess;
  // An assessment has no recording: the questions are the whole part, so the
  // page opens straight onto them.
  const assessment = isAssessment(chapter.kind);
  // Completion follows access, not payment: this app has no checkout, so
  // gating on payment meant nothing could ever be marked as watched.
  const completeOnEnd = !isLocked && !userProgress?.isCompleted;

  return (
    <div className="bg-white dark:bg-background">
      {!isLocked && (
        <MarkSeen courseId={params.courseId} chapterId={params.chapterId} />
      )}
      {userProgress?.isCompleted && (
        <Banner variant="success" label="خلّصت الجزء ده" />
      )}
      {isLocked && (
        <Banner
          variant="warning"
          label="الجزء ده مقفول — كلّم المدرّس عشان يفتحه"
        />
      )}
      <div className="flex flex-col pb-20">
        {assessment ? (
          <div className="w-full border-b bg-gradient-to-l from-brand-deep to-brand-teal py-12 text-white dark:border-slate-800">
            <div className="mx-auto w-full max-w-5xl px-4">
              <span className="inline-flex items-center gap-x-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
                <ClipboardCheck className="h-3.5 w-3.5" />
                {chapterKindLabels[chapter.kind]}
              </span>
              <h1 className="mt-3 text-2xl font-black leading-9 md:text-3xl">
                {chapter.title}
              </h1>
              <p className="mt-2 text-sm text-white/85">
                {exercises.length} سؤال · جاوب كلهم وشوف نتيجتك على طول
              </p>
            </div>
          </div>
        ) : (
        <>
        {/* The player spans the full width of the reading area */}
        <div className="w-full bg-black">
          <div className="mx-auto w-full max-w-[1200px]">
            <VideoPlayer
              chapterId={params.chapterId}
              title={chapter.title}
              courseId={params.courseId}
              nextChapterId={nextChapter?.id}
              hasExercises={exercises.length > 0 && !isLocked}
              youtubeId={playback?.youtubeId}
              playbackUrl={playback?.playbackUrl}
              hlsUrl={playback?.hlsUrl}
              originalUrl={playback?.originalUrl}
              thumbnailUrl={playback?.thumbnailUrl}
              startSeconds={playback?.startSeconds}
              endSeconds={playback?.endSeconds}
              isLocked={isLocked}
              completeOnEnd={completeOnEnd}
            />
          </div>
        </div>
        </>
        )}

        <div className="mx-auto w-full max-w-5xl px-4">
          <div className="flex flex-col items-center justify-between py-4 md:flex-row">
            <h2 className="mb-3 text-xl font-semibold">{chapter.title}</h2>
            {!isLocked ? (
              <CourseProgressButton
                chapterId={params.chapterId}
                courseId={params.courseId}
                nextChapterId={nextChapter?.id}
                hasExercises={exercises.length > 0}
                isCompleted={!!userProgress?.isCompleted}
              />
            ) : (
              <ChapterUnlockPanel
                courseTitle={course.title}
                price={course.price}
              />
            )}
          </div>
          <Separator />
          <div>
            <Preview value={chapter.description!} />
          </div>

          {!!attachments.length && (
            <>
              <Separator />
              <div className="py-4">
                {attachments.map((attachment) => (
                  <a
                    className=" flex items-center p-3 w-full  bg-sky-200 border text-sky-700 rounded-md hover:underline"
                    href={attachment.url}
                    target="_blank"
                    key={attachment.id}
                  >
                    <File />
                    <p className=" line-clamp-1">{attachment.name}</p>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Exercises live on their own pages, so the lesson stays about
              watching. This is just the hand-off. */}
          {exercises.length > 0 && !isLocked && (
            <>
              <Separator />
              <div className="py-8">
                <div className="mb-4 flex items-center gap-x-2">
                  <Terminal className="h-5 w-5 text-brand" />
                  <h2 className="text-xl font-semibold">
                    تمارين الجزء ده ({exercises.length})
                  </h2>
                </div>

                <Link
                  href={`/courses/${params.courseId}/chapters/${params.chapterId}/exercises`}
                  className="flex items-center gap-x-3 rounded-lg border p-4 transition hover:border-brand/50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Terminal className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">ابدأ التمارين</span>
                    <span className="block text-sm text-muted-foreground">
                      {exercises.length} تمرين على الجزء ده
                    </span>
                  </span>
                  <span className="shrink-0 text-brand">←</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterIdPage;
