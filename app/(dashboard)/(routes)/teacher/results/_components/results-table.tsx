"use client";

import {
  Check,
  ChevronDown,
  Download,
  Search,
  UserRound,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";

import type { StudentResult } from "@/actions/get-assessment-results";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const LETTERS = ["أ", "ب", "ج", "د"];

const formatDate = (date: Date | null) =>
  date ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date)) : "—";

/** Green for a pass, amber for a near miss, red for the rest. */
const scoreTone = (score: number) =>
  score >= 75
    ? "bg-brand/15 text-brand-deep dark:text-brand"
    : score >= 50
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
      : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400";

/** The mark sheet, with each student's paper one click away. */
export const ResultsTable = ({
  students,
  totalQuestions,
  title,
}: {
  students: StudentResult[];
  totalQuestions: number;
  title: string;
}) => {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;

    return students.filter((student) =>
      [student.name, student.email, student.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    );
  }, [students, query]);

  const average = students.length
    ? Math.round(
        students.reduce((sum, student) => sum + student.score, 0) /
          students.length
      )
    : 0;

  /** One row per student, so a spreadsheet can pivot the marks freely. */
  const exportCsv = () => {
    const header = ["الاسم", "البريد", "الموبايل", "الدرجة", "من", "النسبة", "آخر إجابة"];
    const lines = rows.map((student) =>
      [
        student.name,
        student.email ?? "",
        student.phone ?? "",
        student.correct,
        student.total,
        `${student.score}%`,
        formatDate(student.lastAnsweredAt),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(",")
    );

    const blob = new Blob([`﻿${[header.join(","), ...lines].join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!students.length) {
    return (
      <div className="rounded-xl border p-12 text-center dark:border-slate-800">
        <p className="font-medium">لسه محدش جاوب</p>
        <p className="mt-1 text-sm text-muted-foreground">
          أول ما طالب يبدأ يجاوب، درجته هتظهر هنا على طول.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary + tools */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span>
            <span className="font-bold">{students.length}</span> طالب جاوب
          </span>
          <span>
            متوسط الدرجات <span className="font-bold">{average}%</span>
          </span>
          <span>
            <span className="font-bold">{totalQuestions}</span> سؤال
          </span>
        </div>

        <div className="flex items-center gap-x-2">
          <div className="relative w-56">
            <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث عن طالب"
              className="h-9 pr-9"
            />
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="flex h-9 items-center gap-x-1.5 rounded-lg border px-3 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
          >
            <Download className="h-4 w-4" />
            تصدير CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-right dark:bg-slate-900">
              <tr className="border-b dark:border-slate-800">
                <th className="p-3 font-semibold">الطالب</th>
                <th className="p-3 font-semibold">الدرجة</th>
                <th className="p-3 font-semibold">النسبة</th>
                <th className="p-3 font-semibold">جاوب</th>
                <th className="p-3 font-semibold">آخر إجابة</th>
                <th className="w-10 p-3" />
              </tr>
            </thead>

            <tbody>
              {rows.map((student) => {
                const isOpen = openId === student.userId;

                return (
                  <React.Fragment key={student.userId}>
                    <tr
                      onClick={() => setOpenId(isOpen ? null : student.userId)}
                      className="cursor-pointer border-b transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
                    >
                      <td className="p-3">
                        <span className="flex items-center gap-x-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            <UserRound className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold">
                              {student.name}
                            </span>
                            <span
                              dir="ltr"
                              className="block text-right text-xs text-muted-foreground"
                            >
                              {student.email ?? "—"}
                            </span>
                          </span>
                        </span>
                      </td>

                      <td className="whitespace-nowrap p-3 font-bold">
                        {student.correct} / {student.total}
                      </td>

                      <td className="p-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-black",
                            scoreTone(student.score)
                          )}
                        >
                          {student.score}%
                        </span>
                      </td>

                      <td className="whitespace-nowrap p-3 text-muted-foreground">
                        {student.answered} من {student.total}
                      </td>

                      <td className="whitespace-nowrap p-3 text-muted-foreground">
                        {formatDate(student.lastAnsweredAt)}
                      </td>

                      <td className="p-3">
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition",
                            isOpen && "rotate-180"
                          )}
                        />
                      </td>
                    </tr>

                    {/* The student's paper */}
                    {isOpen && (
                      <tr className="border-b dark:border-slate-800">
                        <td
                          colSpan={6}
                          className="bg-slate-50 p-4 dark:bg-slate-900/50"
                        >
                          <ol className="space-y-3">
                            {student.answers.map((answer, index) => (
                              <li
                                key={answer.exerciseId}
                                className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                              >
                                <div className="flex items-start gap-x-3">
                                  <span
                                    className={cn(
                                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                                      answer.attempts === 0
                                        ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                        : answer.isCorrect
                                          ? "bg-brand text-white"
                                          : "bg-red-500 text-white"
                                    )}
                                  >
                                    {answer.attempts === 0 ? (
                                      index + 1
                                    ) : answer.isCorrect ? (
                                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                    ) : (
                                      <X className="h-3.5 w-3.5" strokeWidth={3} />
                                    )}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <p className="whitespace-pre-line text-sm font-semibold leading-7">
                                      {answer.question}
                                    </p>

                                    {answer.attempts === 0 ? (
                                      <p className="mt-2 text-xs italic text-muted-foreground">
                                        مجاوبش على السؤال ده
                                      </p>
                                    ) : answer.type === "MCQ" ? (
                                      <div className="mt-3 grid gap-1.5">
                                        {answer.choices.map((choice, i) => {
                                          const picked = answer.choiceIndex === i;
                                          const right = answer.correctIndex === i;

                                          return (
                                            <span
                                              key={i}
                                              className={cn(
                                                "flex items-center gap-x-2 rounded-md px-2.5 py-1.5 text-xs",
                                                right &&
                                                  "bg-brand/10 font-bold text-brand-deep dark:text-brand",
                                                picked &&
                                                  !right &&
                                                  "bg-red-50 font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400",
                                                !picked &&
                                                  !right &&
                                                  "text-muted-foreground"
                                              )}
                                            >
                                              <span className="font-black">
                                                {LETTERS[i]}
                                              </span>
                                              {choice}
                                              {picked && (
                                                <span className="mr-auto text-[10px] font-bold">
                                                  إجابته
                                                </span>
                                              )}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <>
                                        <p className="mt-3 text-xs font-semibold text-muted-foreground">
                                          الكود اللي كتبه
                                        </p>
                                        <pre
                                          dir="ltr"
                                          className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-3 text-left font-mono text-xs text-slate-200"
                                        >
                                          {answer.code || "—"}
                                        </pre>
                                        {answer.expectedOutput && (
                                          <>
                                            <p className="mt-2 text-xs font-semibold text-muted-foreground">
                                              الناتج المتوقع
                                            </p>
                                            <pre
                                              dir="ltr"
                                              className="mt-1 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-2 text-left font-mono text-xs dark:bg-slate-900"
                                            >
                                              {answer.expectedOutput}
                                            </pre>
                                          </>
                                        )}
                                      </>
                                    )}

                                    {answer.attempts > 0 && (
                                      <p className="mt-2 text-[11px] text-muted-foreground">
                                        {answer.attempts} محاولة ·{" "}
                                        {formatDate(answer.answeredAt)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ol>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
