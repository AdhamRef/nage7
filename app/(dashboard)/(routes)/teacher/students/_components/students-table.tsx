"use client";

import {
  AlertTriangle,
  ChevronDown,
  Download,
  Search,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import type { TeacherStudent } from "@/actions/get-teacher-students";
import { GOVERNORATE_NAMES, genderLabels } from "@/lib/onboarding-options";
import { Input } from "@/components/ui/input";

import AccessToggle from "./access-toggle";
import DeviceReset from "./device-reset";
import { cn } from "@/lib/utils";

interface StudentsTableProps {
  students: TeacherStudent[];
  courses: { id: string; title: string }[];
}

/** One labelled value inside the expanded student card. */
const Detail = ({
  label,
  value,
  ltr,
  href,
}: {
  label: string;
  value?: string | null;
  ltr?: boolean;
  href?: string;
}) => {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          dir={ltr ? "ltr" : undefined}
          className={cn(
            "block truncate text-sm font-medium text-sky-700 hover:underline dark:text-sky-400",
            ltr && "text-right"
          )}
        >
          {value}
        </a>
      ) : (
        <p
          dir={ltr ? "ltr" : undefined}
          className={cn("truncate text-sm font-medium", ltr && "text-right")}
        >
          {value}
        </p>
      )}
    </div>
  );
};

type SortKey = "recent" | "name" | "progress" | "paid";

const sortLabels: Record<SortKey, string> = {
  recent: "الأحدث",
  name: "الاسم",
  progress: "التقدم",
  paid: "الأكثر دفعاً",
};

const sourceLabels: Record<string, { label: string; className: string }> = {
  free: {
    label: "درس مجاني",
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  },
  group: {
    label: "عبر مجموعة",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  manual: {
    label: "مفتوح له",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  },
  watching: {
    label: "يشاهد المجاني فقط",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
};

const dateFormat = new Intl.DateTimeFormat("ar-EG", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const formatDate = (value: Date | string | null) => {
  if (!value) return "—";
  return dateFormat.format(new Date(value));
};

/** "منذ 3 أيام" — a quick read on how recently they watched anything. */
const relative = (value: Date | string | null) => {
  if (!value) return "لم يبدأ بعد";
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  return months === 1 ? "منذ شهر" : `منذ ${months} أشهر`;
};

const ProgressBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-x-2">
    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className={cn(
          "h-full rounded-full",
          value >= 100 ? "bg-emerald-500" : "bg-sky-500"
        )}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
    <span className="text-xs tabular-nums text-muted-foreground">{value}%</span>
  </div>
);

export const StudentsTable = ({ students, courses }: StudentsTableProps) => {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [govFilter, setGovFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();

    let result = students.filter((student) => {
      if (
        courseFilter !== "all" &&
        !student.enrollments.some((e) => e.courseId === courseFilter)
      ) {
        return false;
      }
      if (govFilter !== "all" && student.details?.governorate !== govFilter) {
        return false;
      }
      if (!needle) return true;

      const d = student.details;
      return (
        student.name.toLowerCase().includes(needle) ||
        (student.email ?? "").toLowerCase().includes(needle) ||
        (d?.phone ?? "").includes(needle) ||
        (d?.whatsapp ?? "").includes(needle) ||
        (d?.guardianPhone ?? "").includes(needle) ||
        student.enrollments.some((e) =>
          e.courseTitle.toLowerCase().includes(needle)
        )
      );
    });

    result = [...result].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ar");
      if (sort === "progress") return b.averageProgress - a.averageProgress;
      if (sort === "paid") return b.totalPaid - a.totalPaid;
      return (
        new Date(b.firstSeenAt).getTime() -
        new Date(a.firstSeenAt).getTime()
      );
    });

    return result;
  }, [students, query, courseFilter, govFilter, sort]);

  /** One row per enrollment, so a spreadsheet can pivot it freely. */
  const exportCsv = () => {
    const header = [
      "الاسم",
      "البريد",
      "النوع",
      "الموبايل",
      "الواتساب",
      "موبايل ولي الأمر",
      "المحافظة",
      "المدينة",
      "الدرس",
      "تاريخ الفتح",
      "المدفوع",
      "أجزاء مكتملة",
      "إجمالي الأجزاء",
      "نسبة التقدم",
      "آخر نشاط",
    ];

    const lines = rows.flatMap((student) =>
      student.enrollments.map((e) =>
        [
          student.name,
          student.email ?? "",
          student.details ? genderLabels[student.details.gender] : "",
          student.details?.phone ?? "",
          student.details?.whatsapp ?? "",
          student.details?.guardianPhone ?? "",
          student.details?.governorate ?? "",
          student.details?.city ?? "",
          e.courseTitle,
          formatDate(e.startedAt),
          e.paidPrice,
          e.completedChapters,
          e.totalChapters,
          `${e.progress}%`,
          formatDate(student.lastActivityAt),
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
    );

    // BOM so Excel opens the Arabic correctly.
    const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم أو البريد أو الموبايل…"
            className="pr-9"
          />
        </div>

        <select
          value={courseFilter}
          onChange={(event) => setCourseFilter(event.target.value)}
          className="h-10 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="all">كل الدروس</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>

        <select
          value={govFilter}
          onChange={(event) => setGovFilter(event.target.value)}
          className="h-10 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="all">كل المحافظات</option>
          {GOVERNORATE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortKey)}
          className="h-10 rounded-md border bg-transparent px-3 text-sm"
        >
          {Object.entries(sortLabels).map(([key, label]) => (
            <option key={key} value={key}>
              ترتيب: {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={exportCsv}
          disabled={!rows.length}
          className="flex h-10 items-center gap-x-2 rounded-md border px-3 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50 dark:hover:bg-slate-900"
        >
          <Download className="h-4 w-4" />
          تصدير CSV
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        {rows.length} من {students.length} طالب
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-right dark:bg-slate-900">
              <tr className="border-b dark:border-slate-800">
                <th className="p-3 font-semibold">الطالب</th>
                <th className="p-3 font-semibold">التواصل</th>
                <th className="p-3 font-semibold">ولي الأمر</th>
                <th className="p-3 font-semibold">المحافظة</th>
                <th className="p-3 font-semibold">الدروس</th>
                <th className="p-3 font-semibold">التقدم</th>
                <th className="p-3 font-semibold">المدفوع</th>
                <th className="p-3 font-semibold">آخر نشاط</th>
                <th className="p-3 font-semibold">انضم</th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-muted-foreground">
                    مفيش طلبة مطابقين
                  </td>
                </tr>
              )}

              {rows.map((student) => {
                const isOpen = expanded === student.userId;

                return (
                  <Fragment key={student.userId}>
                    <tr
                      onClick={() =>
                        setExpanded(isOpen ? null : student.userId)
                      }
                      className="cursor-pointer border-b transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-x-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-600 text-xs font-bold text-white">
                            {student.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={student.image}
                                alt={student.name}
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              student.name.charAt(0).toUpperCase()
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-x-1.5 truncate font-medium">
                              {student.name}
                              {student.isOrphan && (
                                <AlertTriangle
                                  className="h-3.5 w-3.5 text-amber-500"
                                  aria-label="مفيش حساب مطابق"
                                />
                              )}
                            </p>
                            <p dir="ltr" className="truncate text-right text-xs text-muted-foreground">
                              {student.email ?? student.userId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {student.details ? (
                          <div className="min-w-0">
                            <p dir="ltr" className="text-right text-xs tabular-nums">
                              {student.details.phone}
                            </p>
                            <p
                              dir="ltr"
                              className="text-right text-xs tabular-nums text-muted-foreground"
                            >
                              {student.details.whatsapp} (واتساب)
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        {student.details ? (
                          <p dir="ltr" className="text-right text-xs tabular-nums">
                            {student.details.guardianPhone}
                          </p>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                        {student.details?.governorate ?? "—"}
                        {student.details?.city ? ` · ${student.details.city}` : ""}
                      </td>

                      <td className="p-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-slate-800">
                          {student.enrollments.length}
                        </span>
                      </td>

                      <td className="p-3">
                        <ProgressBar value={student.averageProgress} />
                      </td>

                      <td className="p-3 whitespace-nowrap tabular-nums">
                        {student.totalPaid} جنية
                      </td>

                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {relative(student.lastActivityAt)}
                      </td>

                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {formatDate(student.joinedAt)}
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

                    {isOpen && (
                      <tr className="border-b dark:border-slate-800">
                        <td colSpan={10} className="bg-slate-50 p-4 dark:bg-slate-900/50">
                          {/* One account, one device — released from here. */}
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                            <span className="text-xs font-semibold text-muted-foreground">
                              الجهاز المسجّل
                              {student.deviceBoundAt
                                ? ` · منذ ${formatDate(student.deviceBoundAt)}`
                                : ""}
                            </span>
                            <DeviceReset
                              userId={student.userId}
                              studentName={student.name}
                              deviceLabel={student.deviceLabel}
                              isBound={student.deviceBound}
                            />
                          </div>

                          {student.details ? (
                            <div className="mb-4 grid gap-4 rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-3 lg:grid-cols-4">
                              <Detail label="النوع" value={genderLabels[student.details.gender]} />
                              <Detail label="الموبايل" value={student.details.phone} ltr />
                              <Detail
                                label="الواتساب"
                                value={student.details.whatsapp}
                                href={`https://wa.me/${student.details.whatsapp.replace(/\D/g, "")}`}
                                ltr
                              />
                              <Detail
                                label="موبايل ولي الأمر"
                                value={student.details.guardianPhone}
                                ltr
                              />
                              <Detail label="المحافظة" value={student.details.governorate} />
                              <Detail label="المدينة" value={student.details.city} />
                            </div>
                          ) : (
                            <p className="mb-4 rounded-lg border border-dashed p-3 text-xs text-muted-foreground dark:border-slate-800">
                              الطالب ده سجّل قبل ما نضيف فورم البيانات، فمفيش بيانات زيادة.
                            </p>
                          )}
                          {student.enrollments.length === 0 && (
                            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground dark:border-slate-800">
                              الحساب مسجل لكنه لم يفتح أو يشاهد أي درس بعد.
                            </p>
                          )}

                          <div className="space-y-2">
                            {student.enrollments.map((enrollment) => (
                              <div
                                key={enrollment.courseId}
                                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-white p-3 dark:border-slate-800 dark:bg-slate-950"
                              >
                                <span className="font-medium">
                                  {enrollment.courseTitle}
                                </span>

                                <span className="text-xs text-muted-foreground">
                                  {enrollment.completedChapters} /{" "}
                                  {enrollment.totalChapters} جزء
                                </span>

                                <ProgressBar value={enrollment.progress} />

                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-0.5 text-xs font-bold",
                                    sourceLabels[enrollment.source].className
                                  )}
                                >
                                  {sourceLabels[enrollment.source].label}
                                </span>

                                {enrollment.groups.map((group) => (
                                  <span
                                    key={group}
                                    className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand-deep dark:text-brand"
                                  >
                                    {group}
                                  </span>
                                ))}

                                <AccessToggle
                                  courseId={enrollment.courseId}
                                  userId={student.userId}
                                  hasAccess={enrollment.hasDirectAccess}
                                />

                                <span className="mr-auto whitespace-nowrap text-xs text-muted-foreground">
                                  فُتح في {formatDate(enrollment.startedAt)} ·{" "}
                                  {enrollment.paidPrice} جنية
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentsTable;
