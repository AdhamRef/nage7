import { Chapter, Course, UserProgress } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/lib/auth";

import CourseSidebarItem from "./course-sidebar-item";

type CourseWithDetails = Course & {
  chapters: (Chapter & {
    userProgress: UserProgress[] | null;
    exercises: {
      id: string;
      userProgress: { isCompleted: boolean }[];
    }[];
  })[];
};

type CourseSidebarProps = {
  course: CourseWithDetails | undefined;
  progressCount: number | null;
  hasAccess: boolean;
};

const CourseSidebar: React.FC<CourseSidebarProps> = async ({
  course,
  progressCount,
  hasAccess,
}) => {
  if (!course) {
    return <div>معلومات الدرس مش متاحة</div>;
  }
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  const completed = course.chapters.filter(
    (chapter) => chapter.userProgress?.[0]?.isCompleted
  ).length;
  const progress = Math.round(progressCount ?? 0);

  return (
    <div className="flex h-full flex-col overflow-hidden border-l bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
      {/* Header — where am I, and how far along */}
      <div className="shrink-0 border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <Link
          href={`/courses/${course.id}`}
          className="inline-flex items-center gap-x-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          صفحة الدرس
        </Link>

        <h1 className="mt-2 line-clamp-2 text-[15px] font-bold leading-6 text-slate-900 dark:text-white">
          {course.title}
        </h1>

        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {completed} من {course.chapters.length} جزء
          </span>
          <span className="text-sm font-bold text-brand-deep dark:text-brand">
            {progress}%
          </span>
        </div>

        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-l from-brand to-brand-teal transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Parts */}
      <nav
        aria-label="أجزاء الدرس"
        className="flex-1 overflow-y-auto overscroll-contain py-2"
      >
        <ul className="flex flex-col gap-y-0.5">
          {course.chapters.map((chapter, index) => (
            <CourseSidebarItem
              key={chapter.id}
              id={chapter.id}
              index={index + 1}
              label={chapter.title}
              isCompleted={!!chapter.userProgress?.[0]?.isCompleted}
              courseId={course.id}
              isLocked={!hasAccess && !chapter.isFree}
              kind={chapter.kind}
              exerciseCount={chapter.exercises.length}
              exercisesSolved={
                chapter.exercises.filter(
                  (exercise) => exercise.userProgress[0]?.isCompleted
                ).length
              }
            />
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default CourseSidebar;
