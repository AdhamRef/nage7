"use client";

import axios from "axios";
import {
  Check,
  Loader2,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface AccessStudent {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** Courses opened for them directly — what this tab edits. */
  courseIds: string[];
  /** Courses already open through one of their access groups. */
  groupCourseIds: string[];
}

export interface AccessCourse {
  id: string;
  title: string;
  price: number | null;
  isFree: boolean;
  isPublished: boolean;
}

interface Props {
  students: AccessStudent[];
  courses: AccessCourse[];
}

/**
 * Pick a student, tick any group of courses, save once. Replaces the old
 * one-code-one-course flow — the teacher decides directly who gets what.
 */
export const AccessManager = ({ students, courses }: Props) => {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    students[0]?.userId ?? null
  );
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(students[0]?.courseIds ?? [])
  );
  const [isSaving, setIsSaving] = useState(false);

  const selected = students.find((student) => student.userId === selectedId);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;

    return students.filter((student) =>
      [student.name, student.email, student.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    );
  }, [students, query]);

  // Free courses are open to everyone already, so granting them means nothing.
  const grantable = courses.filter((course) => !course.isFree);

  const pick = (student: AccessStudent) => {
    setSelectedId(student.userId);
    setChecked(new Set(student.courseIds));
  };

  const toggle = (courseId: string) =>
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });

  const originally = new Set(selected?.courseIds ?? []);
  const isDirty =
    checked.size !== originally.size ||
    Array.from(checked).some((id) => !originally.has(id));

  const save = async () => {
    if (!selected) return;

    setIsSaving(true);
    try {
      const { data } = await axios.put(
        `/api/students/${selected.userId}/access`,
        { courseIds: Array.from(checked) }
      );

      const parts = [];
      if (data.granted) parts.push(`تم فتح ${data.granted}`);
      if (data.revoked) parts.push(`تم سحب ${data.revoked}`);
      toast.success(parts.length ? parts.join(" · ") : "لا تغييرات");

      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  if (!grantable.length) {
    return (
      <div className="rounded-xl border p-12 text-center dark:border-slate-800">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-slate-400" />
        <p className="font-medium">كل دروسك مجانية</p>
        <p className="mt-1 text-sm text-muted-foreground">
          الدروس المجانية مفتوحة لكل الطلبة، فمفيش حاجة محتاجة فتح يدوي.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Students */}
      <div className="flex flex-col overflow-hidden rounded-xl border bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b p-3 dark:border-slate-800">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالاسم أو البريد أو الموبايل"
              className="h-10 pr-9"
            />
          </div>
        </div>

        <ul className="max-h-[560px] flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">
              مفيش طالب بالاسم ده
            </li>
          )}

          {filtered.map((student) => {
            const isSelected = student.userId === selectedId;

            return (
              <li key={student.userId}>
                <button
                  type="button"
                  onClick={() => pick(student)}
                  className={cn(
                    "flex w-full items-center gap-x-3 rounded-lg p-2.5 text-right transition",
                    isSelected
                      ? "bg-brand/10 ring-1 ring-brand/30"
                      : "hover:bg-slate-100 dark:hover:bg-white/5"
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <UserRound className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {student.name}
                    </span>
                    <span
                      dir="ltr"
                      className="block truncate text-right text-xs text-muted-foreground"
                    >
                      {student.email ?? "—"}
                    </span>
                  </span>

                  {student.courseIds.length > 0 && (
                    <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand-deep dark:text-brand">
                      {student.courseIds.length}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Courses */}
      <div className="rounded-xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        {selected ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">{selected.name}</h2>
                <p dir="ltr" className="text-right text-xs text-muted-foreground">
                  {selected.email ?? "—"}
                </p>
              </div>

              <Button onClick={save} disabled={isSaving || !isDirty}>
                {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ الصلاحيات
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              اختر الدروس اللي عايز تفتحها للطالب. إلغاء التحديد بيسحب الفتح
              المباشر — الدروس اللي جايالها من مجموعة بتفضل مفتوحة.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {grantable.map((course) => {
                const isOn = checked.has(course.id);

                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => toggle(course.id)}
                    className={cn(
                      "flex items-center gap-x-3 rounded-lg border p-3 text-right transition",
                      isOn
                        ? "border-brand bg-brand/5"
                        : "hover:border-slate-400 dark:border-slate-800"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition",
                        isOn
                          ? "border-brand bg-brand text-white"
                          : "border-slate-300 dark:border-slate-600"
                      )}
                    >
                      {isOn && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {course.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {course.price ?? 0} جنية
                        {!course.isPublished && " · غير منشور"}
                      </span>
                    </span>

                    {selected.groupCourseIds.includes(course.id) && (
                      <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand-deep dark:text-brand">
                        عبر مجموعة
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Select-all shortcuts for handing over a whole batch. */}
            <div className="mt-5 flex flex-wrap gap-2 border-t pt-4 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setChecked(new Set(grantable.map((course) => course.id)))
                }
              >
                تحديد كل الدروس
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChecked(new Set())}
              >
                إلغاء التحديد
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChecked(new Set(selected.courseIds))}
                disabled={!isDirty}
              >
                تراجع
              </Button>
            </div>
          </>
        ) : (
          <div className="py-16 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <p className="font-medium">اختر طالباً من القائمة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessManager;
