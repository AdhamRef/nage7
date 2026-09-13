"use client";

import axios from "axios";
import { KeyRound, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";

interface AccessToggleProps {
  courseId: string;
  userId: string;
  hasAccess: boolean;
}

/** Opens or revokes a course for one student, straight from their row. */
export const AccessToggle = ({
  courseId,
  userId,
  hasAccess,
}: AccessToggleProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const onClick = async (event: React.MouseEvent) => {
    // The row itself is a toggle for the detail panel.
    event.stopPropagation();
    setIsSaving(true);

    try {
      if (hasAccess) {
        await axios.delete(`/api/courses/${courseId}/access?userId=${userId}`);
        toast.success("تم سحب الصلاحية");
      } else {
        await axios.post(`/api/courses/${courseId}/access`, { userId });
        toast.success("تم فتح الدرس للطالب");
      }
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className={cn(
        "flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition disabled:opacity-50",
        hasAccess
          ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          : "bg-brand/10 text-brand hover:bg-brand/20"
      )}
    >
      {isSaving ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : hasAccess ? (
        <Lock className="h-3 w-3" />
      ) : (
        <KeyRound className="h-3 w-3" />
      )}
      {hasAccess ? "سحب الصلاحية" : "فتح الدرس"}
    </button>
  );
};

export default AccessToggle;
