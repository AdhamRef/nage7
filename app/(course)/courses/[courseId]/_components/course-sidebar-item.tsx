"use client";

import { Check, ClipboardCheck, Dumbbell, Lock, Play } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import { isAssessment, type ChapterKind } from "@/lib/chapter-kind";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  id: string;
  courseId: string;
  /** 1-based order, shown until the part has been watched. */
  index: number;
  isCompleted: boolean;
  isLocked: boolean;
  /** Assessments show a paper icon rather than a play/step number. */
  kind: ChapterKind;
  exerciseCount: number;
  /** How many of those exercises this student has already solved. */
  exercisesSolved: number;
};

/**
 * One part of the course in the watching sidebar: the lesson itself and, when
 * the teacher added any, its exercises as a step of their own underneath.
 */
const CourseSidebarItem: React.FC<Props> = ({
  id,
  courseId,
  label,
  index,
  isCompleted,
  isLocked,
  kind,
  exerciseCount,
  exercisesSolved,
}) => {
  const pathname = usePathname();

  const chapterHref = `/courses/${courseId}/chapters/${id}`;
  const exercisesHref = `${chapterHref}/exercises`;

  const isExercisesActive = pathname === exercisesHref;
  const isActive = pathname?.startsWith(chapterHref) && !isExercisesActive;

  const exercisesDone = exerciseCount > 0 && exercisesSolved >= exerciseCount;
  const exercisePercent = exerciseCount
    ? Math.round((exercisesSolved / exerciseCount) * 100)
    : 0;

  return (
    <li className="px-2">
      <Link
        href={isLocked ? "#" : chapterHref}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isLocked}
        tabIndex={isLocked ? -1 : undefined}
        className={cn(
          "relative flex items-center gap-x-3 rounded-lg px-3 py-2.5 transition-colors",
          isLocked && "cursor-not-allowed opacity-50",
          !isLocked &&
            !isActive &&
            "hover:bg-slate-200/60 dark:hover:bg-white/[0.06]",
          // The current part reads as a raised card against the panel.
          isActive &&
            "bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
            isCompleted && "bg-brand text-white",
            !isCompleted &&
              isActive &&
              "bg-brand text-white",
            !isCompleted &&
              !isActive &&
              "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          )}
        >
          {isLocked ? (
            <Lock className="h-3 w-3" />
          ) : isCompleted ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          ) : isAssessment(kind) ? (
            <ClipboardCheck className="h-3.5 w-3.5" />
          ) : isActive ? (
            <Play className="h-2.5 w-2.5 fill-current" />
          ) : (
            index
          )}
        </span>

        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[13px] leading-6 text-slate-700 transition-colors dark:text-slate-300",
            isActive && "font-semibold text-slate-900 dark:text-white",
            isCompleted && !isActive && "text-slate-500 dark:text-slate-400"
          )}
        >
          {label}
        </span>
      </Link>

      {/* Practice is its own step, so it never hides inside the lesson page. */}
      {exerciseCount > 0 && !isLocked && (
        <Link
          href={exercisesHref}
          aria-current={isExercisesActive ? "page" : undefined}
          className={cn(
            "relative ms-[1.55rem] flex items-center gap-x-2.5 rounded-lg py-2 pe-3 ps-3 text-xs transition-colors",
            isExercisesActive
              ? "bg-white font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
              : "text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-white/[0.06]"
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
              exercisesDone
                ? "bg-brand text-white"
                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
            )}
          >
            {exercisesDone ? (
              <Check className="h-3 w-3" strokeWidth={3} />
            ) : (
              <Dumbbell className="h-3 w-3" />
            )}
          </span>

          <span className="flex-1 truncate">تمارين</span>

          {/* Partial practice is worth showing — it is what pulls them back. */}
          {!exercisesDone && exercisesSolved > 0 && (
            <span className="shrink-0 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-deep dark:text-brand">
              {exercisePercent}%
            </span>
          )}
        </Link>
      )}
    </li>
  );
};

export default CourseSidebarItem;
