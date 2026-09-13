import { ChevronLeft, ChevronRight, Dumbbell, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import getChapterExercises from "@/actions/get-chapter-exercises";
import ExerciseStack from "@/components/exercise-stack";
import { requireCompleteProfile } from "@/lib/require-profile";

/**
 * A chapter's exercises as their own page — the sidebar treats it as a step of
 * its own, so watching and practising stay separate.
 */
const ExercisesPage = async ({
  params,
}: {
  params: { courseId: string; chapterId: string };
}) => {
  const { userId } = await requireCompleteProfile();

  const { chapter, exercises, locked, nextChapter, solvedIds } =
    await getChapterExercises({
      userId,
      courseId: params.courseId,
      chapterId: params.chapterId,
    });

  if (!chapter) return redirect(`/courses/${params.courseId}`);

  if (locked) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <Lock className="mb-4 h-10 w-10 text-amber-500" />
        <h1 className="text-xl font-bold">التمارين مغلقة</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          افتح الدرس الأول عشان توصل للتمارين.
        </p>
        <Link
          href={`/courses/${params.courseId}`}
          className="mt-6 rounded-lg px-6 py-2.5 text-sm bg-brand font-bold text-white shadow-lg shadow-brand/25 ring-1 ring-inset ring-white/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-brand/40 active:brightness-95"
        >
          الرجوع للدرس
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/courses/${params.courseId}/chapters/${params.chapterId}`}
        className="inline-flex items-center gap-x-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
        {chapter.title}
      </Link>

      <h1 className="mt-3 flex items-center gap-x-2 text-2xl font-bold">
        <Dumbbell className="h-6 w-6 text-brand" />
        تمارين الجزء
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {exercises.length} تمرين — طبّق اللي اتعلمته في الفيديو.
      </p>

      <div className="mt-6">
        {exercises.length === 0 ? (
          <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground dark:border-slate-800">
            مفيش تمارين في الجزء ده.
          </p>
        ) : (
          <ExerciseStack
            exercises={exercises}
            courseId={params.courseId}
            chapterId={params.chapterId}
            solvedIds={solvedIds}
          />
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t pt-6 dark:border-slate-800">
        <Link
          href={`/courses/${params.courseId}/chapters/${params.chapterId}`}
          className="rounded-lg border px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
        >
          الرجوع للفيديو
        </Link>

        {nextChapter && (
          <Link
            href={`/courses/${params.courseId}/chapters/${nextChapter.id}`}
            className="inline-flex items-center gap-x-1.5 rounded-lg px-5 py-2.5 text-sm bg-brand font-bold text-white shadow-lg shadow-brand/25 ring-1 ring-inset ring-white/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-brand/40 active:brightness-95"
          >
            الجزء التالي: {nextChapter.title}
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ExercisesPage;
