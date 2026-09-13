import { ClipboardCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { chapterKindLabels, type ChapterKind } from "@/lib/chapter-kind";
import { db } from "@/lib/db";

/** Every quiz and exam the teacher has, with how many students sat each one. */
const ResultsPage = async () => {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const assessments = await db.chapter.findMany({
    where: {
      kind: { in: ["QUIZ", "EXAM"] },
      course: { userId },
    },
    select: {
      id: true,
      title: true,
      kind: true,
      isPublished: true,
      course: { select: { id: true, title: true } },
      exercises: {
        where: { isPublished: true },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // How many distinct students have submitted anything, per assessment.
  const exerciseIds = assessments.flatMap((row) =>
    row.exercises.map((exercise) => exercise.id)
  );
  const progress = exerciseIds.length
    ? await db.exerciseProgress.findMany({
        where: { exerciseId: { in: exerciseIds } },
        select: { userId: true, exerciseId: true },
      })
    : [];

  const chapterOf = new Map<string, string>();
  for (const row of assessments) {
    for (const exercise of row.exercises) chapterOf.set(exercise.id, row.id);
  }

  const sitters = new Map<string, Set<string>>();
  for (const row of progress) {
    const chapterId = chapterOf.get(row.exerciseId);
    if (!chapterId) continue;
    const set = sitters.get(chapterId) ?? new Set<string>();
    set.add(row.userId);
    sitters.set(chapterId, set);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-x-2 text-2xl font-bold">
          <ClipboardCheck className="h-6 w-6" />
          الدرجات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          كل الكويزات والامتحانات، وكل طالب دخلها وإجاباته.
        </p>
      </div>

      {assessments.length === 0 ? (
        <div className="rounded-xl border p-12 text-center dark:border-slate-800">
          <ClipboardCheck className="mx-auto mb-4 h-10 w-10 text-slate-400" />
          <p className="font-medium">لسه مفيش كويزات ولا امتحانات</p>
          <p className="mt-1 text-sm text-muted-foreground">
            وإنت بتضيف جزء جديد في أي درس، اختار نوعه «كويز» أو «امتحان» —
            الجزء ده مش بيحتاج فيديو، أسئلته هي محتواه.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assessments.map((row) => (
            <Link
              key={row.id}
              href={`/teacher/results/${row.id}`}
              className="group rounded-xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center gap-x-2">
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-black text-brand-deep dark:text-brand">
                  {chapterKindLabels[row.kind as ChapterKind]}
                </span>
                {!row.isPublished && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    مش منشور
                  </span>
                )}
              </div>

              <h2 className="mt-3 line-clamp-2 font-bold leading-7 transition-colors group-hover:text-brand">
                {row.title}
              </h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {row.course.title}
              </p>

              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs dark:border-slate-800">
                <span className="flex items-center gap-x-1.5 font-semibold">
                  <Users className="h-3.5 w-3.5 text-brand" />
                  {sitters.get(row.id)?.size ?? 0} طالب
                </span>
                <span className="text-muted-foreground">
                  {row.exercises.length} سؤال
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
