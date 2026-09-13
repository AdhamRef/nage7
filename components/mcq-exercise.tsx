"use client";

import { CheckCircle2, Lightbulb, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useConfettiStore } from "@/hooks/use-confetti-store";
import { cn } from "@/lib/utils";

export interface McqExerciseProps {
  question: string;
  hint?: string | null;
  choices: string[];
  correctIndex: number;
  explanation?: string | null;
  celebrateOnSuccess?: boolean;
  /** Fires the first time the answer is right. */
  onSolved?: () => void;
  /** Every submission, so wrong answers are reviewable too. */
  onAnswer?: (answer: { choiceIndex: number; isCorrect: boolean }) => void;
}

const LETTERS = ["أ", "ب", "ج", "د"];

/** A four-option question, graded the moment the student confirms. */
export const McqExercise = ({
  question,
  hint,
  choices,
  correctIndex,
  explanation,
  celebrateOnSuccess = true,
  onSolved,
  onAnswer,
}: McqExerciseProps) => {
  const confetti = useConfettiStore();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const isCorrect = checked && selected === correctIndex;

  const check = () => {
    if (selected === null) return;
    setChecked(true);

    const correct = selected === correctIndex;
    onAnswer?.({ choiceIndex: selected, isCorrect: correct });

    if (!correct) return;
    onSolved?.();
    if (celebrateOnSuccess) confetti.onOpen();
  };

  const reset = () => {
    setSelected(null);
    setChecked(false);
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="whitespace-pre-line text-lg font-medium leading-8">
          {question}
        </p>
        {hint && (
          <details className="group mt-4">
            <summary className="inline-flex cursor-pointer items-center gap-x-2 text-sm font-semibold text-sky-700 marker:content-[''] dark:text-sky-400">
              <Lightbulb className="h-4 w-4" />
              تلميح
            </summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {hint}
            </p>
          </details>
        )}
      </div>

      <div className="space-y-3 p-6">
        {choices.map((choice, index) => {
          const isPicked = selected === index;
          const revealCorrect = checked && index === correctIndex;
          const revealWrong = checked && isPicked && index !== correctIndex;

          return (
            <button
              key={index}
              type="button"
              disabled={checked}
              onClick={() => setSelected(index)}
              className={cn(
                "flex w-full items-center gap-x-3 rounded-lg border p-4 text-right transition",
                !checked && "hover:border-brand/60 hover:bg-brand/5",
                isPicked && !checked && "border-brand bg-brand/10",
                revealCorrect &&
                  "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
                revealWrong && "border-red-500 bg-red-50 dark:bg-red-500/10",
                checked && !revealCorrect && !revealWrong && "opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                  isPicked || revealCorrect
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                  revealWrong && "bg-red-500 text-white"
                )}
              >
                {LETTERS[index] ?? index + 1}
              </span>

              <span className="flex-1 leading-7">{choice}</span>

              {revealCorrect && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              )}
              {revealWrong && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <Button onClick={check} disabled={selected === null || checked} size="sm">
          <CheckCircle2 className="ml-2 h-4 w-4" />
          تحقق من الإجابة
        </Button>
        {checked && (
          <Button onClick={reset} variant="ghost" size="sm">
            <RotateCcw className="ml-2 h-4 w-4" />
            جرّب تاني
          </Button>
        )}
      </div>

      {checked && (
        <div
          className={cn(
            "flex items-start gap-x-3 border-t p-5",
            isCorrect
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300"
          )}
        >
          {isCorrect ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {isCorrect
                ? "إجابة صحيحة! أحسنت 🎉"
                : "إجابة غير صحيحة. راجع السؤال وجرّب تاني."}
            </p>
            {explanation && (
              <p className="mt-2 whitespace-pre-line text-sm leading-7 opacity-90">
                {explanation}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default McqExercise;
