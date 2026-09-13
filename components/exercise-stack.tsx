"use client";

import axios from "axios";
import { CheckCircle2, Code2, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import CodePlayground from "@/components/code-playground";
import McqExercise from "@/components/mcq-exercise";
import {
  editorTabId,
  type ExerciseLanguage,
  type QuizEditorTab,
  type QuizMatchMode,
} from "@/lib/quiz";
import { cn } from "@/lib/utils";

export interface StackExercise {
  id: string;
  type: "CODE" | "MCQ";
  question: string;
  hint: string | null;
  // code
  language: ExerciseLanguage;
  starterPython: string;
  starterHtml: string;
  starterCss: string;
  starterJs: string;
  expectedOutput: string;
  matchMode: QuizMatchMode;
  caseSensitive: boolean;
  defaultTab: QuizEditorTab;
  // mcq
  choices: string[];
  correctIndex: number | null;
  explanation: string | null;
}

/**
 * Every exercise of a chapter, one under the other, with a sticky counter so
 * the student always knows how far through they are.
 */
export const ExerciseStack = ({
  exercises,
  courseId,
  chapterId,
  solvedIds = [],
}: {
  exercises: StackExercise[];
  courseId: string;
  chapterId: string;
  /** Exercises this student already solved, so progress survives a reload. */
  solvedIds?: string[];
}) => {
  const router = useRouter();
  const [solved, setSolved] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(solvedIds.map((id) => [id, true]))
  );
  const solvedCount = Object.values(solved).filter(Boolean).length;
  const allDone = solvedCount === exercises.length && exercises.length > 0;

  /**
   * Every submission is saved, right or wrong — the teacher reviews the wrong
   * ones too. The refresh only fires on a first correct answer, since that is
   * the only case that changes the sidebar percentage.
   */
  const record = (
    id: string,
    answer: { choiceIndex?: number; code?: string; isCorrect: boolean }
  ) => {
    let isNew = false;
    if (answer.isCorrect) {
      setSolved((current) => {
        if (current[id]) return current;
        isNew = true;
        return { ...current, [id]: true };
      });
    }

    axios
      .put(
        `/api/courses/${courseId}/chapters/${chapterId}/exercises/${id}/progress`,
        { ...answer, isCompleted: answer.isCorrect }
      )
      .then(() => {
        if (isNew) router.refresh();
      })
      .catch(() => {
        // A failed save only costs the student the badge, not their answer.
      });
  };

  return (
    <div className="space-y-6">
      {/* Sticky progress */}
      <div className="sticky top-[84px] z-20 -mx-4 border-y bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between gap-x-4">
          <span className="text-sm font-semibold">
            {allDone ? "خلصت كل التمارين 🎉" : `حللت ${solvedCount} من ${exercises.length}`}
          </span>

          <div className="flex items-center gap-x-1.5">
            {exercises.map((exercise, index) => (
              <a
                key={exercise.id}
                href={`#ex-${exercise.id}`}
                aria-label={`تمرين ${index + 1}`}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                  solved[exercise.id]
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                {solved[exercise.id] ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  index + 1
                )}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-l from-brand to-brand-teal transition-all duration-500"
            style={{
              width: `${exercises.length ? (solvedCount / exercises.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {exercises.map((exercise, index) => (
        <section
          key={exercise.id}
          id={`ex-${exercise.id}`}
          className="scroll-mt-[160px]"
        >
          <div className="mb-3 flex items-center gap-x-2">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition",
                solved[exercise.id]
                  ? "bg-brand text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {index + 1}
            </span>
            <span className="flex items-center gap-x-1.5 text-sm font-semibold text-muted-foreground">
              {exercise.type === "MCQ" ? (
                <HelpCircle className="h-4 w-4" />
              ) : (
                <Code2 className="h-4 w-4" />
              )}
              {exercise.type === "MCQ"
                ? "اختيار من متعدد"
                : exercise.language === "PYTHON"
                  ? "تمرين بايثون"
                  : "تمرين برمجي"}
            </span>
            {solved[exercise.id] && (
              <span className="mr-auto flex items-center gap-x-1 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                <CheckCircle2 className="h-3 w-3" />
                تم الحل
              </span>
            )}
          </div>

          {exercise.type === "MCQ" ? (
            <McqExercise
              question={exercise.question}
              hint={exercise.hint}
              choices={exercise.choices}
              correctIndex={exercise.correctIndex ?? 0}
              explanation={exercise.explanation}
              onAnswer={(answer) => record(exercise.id, answer)}
            />
          ) : (
            <CodePlayground
              question={exercise.question}
              hint={exercise.hint}
              language={exercise.language}
              starterPython={exercise.starterPython}
              starterHtml={exercise.starterHtml}
              starterCss={exercise.starterCss}
              starterJs={exercise.starterJs}
              expectedOutput={exercise.expectedOutput}
              matchMode={exercise.matchMode}
              caseSensitive={exercise.caseSensitive}
              storageKey={exercise.id}
              defaultTab={editorTabId(exercise.defaultTab)}
              onAnswer={(answer) => record(exercise.id, answer)}
            />
          )}
        </section>
      ))}
    </div>
  );
};

export default ExerciseStack;
