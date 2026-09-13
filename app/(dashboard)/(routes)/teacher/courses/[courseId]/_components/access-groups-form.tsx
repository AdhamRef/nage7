"use client";

import axios from "axios";
import { Check, Layers, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CourseGroupOption {
  id: string;
  name: string;
  memberCount: number;
}

interface Props {
  courseId: string;
  groups: CourseGroupOption[];
  /** Groups this course is currently attached to. */
  selectedIds: string[];
}

/**
 * Which cohorts this course opens for. Attaching a group here unlocks the
 * course for every member of it at once.
 */
export const AccessGroupsForm = ({ courseId, groups, selectedIds }: Props) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set(selectedIds));

  const toggle = (id: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    setIsSaving(true);
    try {
      await axios.put(`/api/courses/${courseId}/groups`, {
        groupIds: Array.from(picked),
      });
      toast.success("تم تحديث المجموعات");
      setIsEditing(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  const current = groups.filter((group) => selectedIds.includes(group.id));

  return (
    <div className="mt-6 rounded-md border bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between font-medium">
        <span className="flex items-center gap-x-2">
          <Layers className="h-4 w-4 text-brand" />
          يُفتح لمجموعات
        </span>

        {groups.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPicked(new Set(selectedIds));
              setIsEditing((value) => !value);
            }}
          >
            {isEditing ? (
              "إلغاء"
            ) : (
              <>
                <Pencil className="ml-2 h-4 w-4" />
                تعديل
              </>
            )}
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          لسه مفيش مجموعات.{" "}
          <Link
            href="/teacher/access"
            className="font-semibold text-sky-700 hover:underline dark:text-sky-400"
          >
            أنشئ مجموعة
          </Link>{" "}
          زي «شهر 1» وافتح لها دروس دفعة واحدة.
        </p>
      ) : isEditing ? (
        <>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {groups.map((group) => {
              const isOn = picked.has(group.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggle(group.id)}
                  className={cn(
                    "flex items-center gap-x-3 rounded-lg border bg-white p-3 text-right transition dark:bg-slate-950",
                    isOn
                      ? "border-brand"
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
                    <span className="block truncate text-sm font-medium">
                      {group.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {group.memberCount} طالب
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <Button onClick={save} disabled={isSaving} size="sm" className="mt-3">
            {isSaving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            حفظ
          </Button>
        </>
      ) : current.length === 0 ? (
        <p className="mt-2 text-sm italic text-slate-500">
          مش مربوط بأي مجموعة
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {current.map((group) => (
            <span
              key={group.id}
              className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand-deep dark:text-brand"
            >
              {group.name} · {group.memberCount} طالب
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccessGroupsForm;
