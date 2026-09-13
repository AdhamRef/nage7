"use client";

import axios from "axios";
import {
  Check,
  Layers,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { AccessCourse, AccessStudent } from "./access-manager";

export interface AccessGroup {
  id: string;
  name: string;
  note: string | null;
  /** Shown to students on the purchase popup. */
  price: number | null;
  courseIds: string[];
  memberIds: string[];
}

interface Props {
  groups: AccessGroup[];
  students: AccessStudent[];
  courses: AccessCourse[];
}

/**
 * Named cohorts — "شهر 1" and friends. A group carries a set of courses and a
 * set of students; attaching a new course to the group opens it for everyone
 * in it at once.
 */
export const GroupsManager = ({ groups, students, courses }: Props) => {
  const router = useRouter();

  const [selectedId, setSelectedId] = useState<string | null>(
    groups[0]?.id ?? null
  );
  const selected = groups.find((group) => group.id === selectedId) ?? null;

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState(selected?.name ?? "");
  const [price, setPrice] = useState(
    selected?.price === null || selected?.price === undefined
      ? ""
      : String(selected.price)
  );
  const [courseIds, setCourseIds] = useState<Set<string>>(
    () => new Set(selected?.courseIds ?? [])
  );
  const [memberIds, setMemberIds] = useState<Set<string>>(
    () => new Set(selected?.memberIds ?? [])
  );
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pick = (group: AccessGroup) => {
    setSelectedId(group.id);
    setName(group.name);
    setPrice(group.price === null ? "" : String(group.price));
    setCourseIds(new Set(group.courseIds));
    setMemberIds(new Set(group.memberIds));
    setQuery("");
  };

  const grantable = courses.filter((course) => !course.isFree);

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return students;

    return students.filter((student) =>
      [student.name, student.email, student.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    );
  }, [students, query]);

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string
  ) =>
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sameSet = (a: Set<string>, b: string[]) =>
    a.size === b.length && b.every((id) => a.has(id));

  const priceValue = price.trim() === "" ? null : Number(price);
  const isDirty =
    !!selected &&
    (name.trim() !== selected.name ||
      priceValue !== selected.price ||
      !sameSet(courseIds, selected.courseIds) ||
      !sameSet(memberIds, selected.memberIds));

  const create = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsCreating(true);
    try {
      const { data } = await axios.post("/api/access-groups", {
        name: trimmed,
        price: newPrice.trim() === "" ? null : Number(newPrice),
      });
      toast.success(`تم إنشاء «${data.name}»`);
      setNewName("");
      setNewPrice("");
      setSelectedId(data.id);
      setName(data.name);
      setPrice(data.price === null ? "" : String(data.price));
      setCourseIds(new Set());
      setMemberIds(new Set());
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsCreating(false);
    }
  };

  const save = async () => {
    if (!selected) return;

    setIsSaving(true);
    try {
      await axios.patch(`/api/access-groups/${selected.id}`, {
        name: name.trim(),
        price: priceValue,
        courseIds: Array.from(courseIds),
        memberIds: Array.from(memberIds),
      });
      toast.success("تم حفظ المجموعة");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    if (!window.confirm(`حذف «${selected.name}»؟ الطلاب هيفقدوا الدروس اللي كانت بتفتحها.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`/api/access-groups/${selected.id}`);
      toast.success("تم حذف المجموعة");
      setSelectedId(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Groups */}
      <div className="flex flex-col overflow-hidden rounded-xl border bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="space-y-2 border-b p-3 dark:border-slate-800">
          <Label className="text-xs">مجموعة جديدة</Label>
          <div className="flex gap-x-2">
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void create();
                }
              }}
              placeholder="مثال: شهر 1"
              className="h-10"
            />
            <Input
              value={newPrice}
              onChange={(event) => setNewPrice(event.target.value)}
              type="number"
              min={0}
              placeholder="السعر"
              className="h-10 w-24 shrink-0"
            />
            <Button
              onClick={create}
              disabled={isCreating || !newName.trim()}
              className="h-10 shrink-0 px-3"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <ul className="max-h-[520px] flex-1 overflow-y-auto p-2">
          {groups.length === 0 && (
            <li className="p-6 text-center text-sm text-muted-foreground">
              لسه مفيش مجموعات
            </li>
          )}

          {groups.map((group) => (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => pick(group)}
                className={cn(
                  "flex w-full items-center gap-x-3 rounded-lg p-2.5 text-right transition",
                  group.id === selectedId
                    ? "bg-brand/10 ring-1 ring-brand/30"
                    : "hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Layers className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {group.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {group.memberIds.length} طالب · {group.courseIds.length} درس
                    {group.price !== null && ` · ${group.price} جنية`}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Detail */}
      <div className="rounded-xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        {!selected ? (
          <div className="py-16 text-center">
            <Layers className="mx-auto mb-4 h-10 w-10 text-slate-400" />
            <p className="font-medium">اختر مجموعة أو أنشئ واحدة</p>
            <p className="mt-1 text-sm text-muted-foreground">
              المجموعة بتجمع طلاب ودروس — أي درس تضيفه للمجموعة بيتفتح لكل
              أعضائها فوراً.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-[200px] flex-1 space-y-1.5">
                <Label htmlFor="group-name" className="text-xs">
                  اسم المجموعة
                </Label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-10"
                />
              </div>

              <div className="w-32 space-y-1.5">
                <Label htmlFor="group-price" className="text-xs">
                  السعر (جنية)
                </Label>
                <Input
                  id="group-price"
                  type="number"
                  min={0}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="—"
                  className="h-10"
                />
              </div>

              <div className="flex gap-x-2">
                <Button onClick={save} disabled={isSaving || !isDirty || !name.trim()}>
                  {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  حفظ
                </Button>
                <Button
                  variant="outline"
                  onClick={remove}
                  disabled={isDeleting}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Courses the group unlocks */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold">
                الدروس اللي المجموعة بتفتحها
              </h3>

              {grantable.length === 0 ? (
                <p className="mt-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground dark:border-slate-800">
                  كل دروسك مجانية، فمفيش حاجة تحتاج فتح.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {grantable.map((course) => {
                    const isOn = courseIds.has(course.id);

                    return (
                      <button
                        key={course.id}
                        type="button"
                        onClick={() => toggle(setCourseIds, course.id)}
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
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {course.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Members */}
            <div className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">
                  أعضاء المجموعة ({memberIds.size})
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث عن طالب"
                    className="h-9 pr-9"
                  />
                </div>
              </div>

              <ul className="mt-3 max-h-[320px] overflow-y-auto rounded-lg border p-1.5 dark:border-slate-800">
                {filteredStudents.length === 0 && (
                  <li className="p-6 text-center text-sm text-muted-foreground">
                    مفيش طالب بالاسم ده
                  </li>
                )}

                {filteredStudents.map((student) => {
                  const isOn = memberIds.has(student.userId);

                  return (
                    <li key={student.userId}>
                      <button
                        type="button"
                        onClick={() => toggle(setMemberIds, student.userId)}
                        className={cn(
                          "flex w-full items-center gap-x-3 rounded-lg p-2 text-right transition",
                          isOn
                            ? "bg-brand/10"
                            : "hover:bg-slate-100 dark:hover:bg-white/5"
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

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                          <UserRound className="h-3.5 w-3.5" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {student.name}
                          </span>
                          <span
                            dir="ltr"
                            className="block truncate text-right text-xs text-muted-foreground"
                          >
                            {student.email ?? "—"}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupsManager;
