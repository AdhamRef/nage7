"use client";

import axios from "axios";
import { Loader2, MonitorSmartphone, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";

interface DeviceResetProps {
  userId: string;
  studentName: string;
  /** "Chrome · Windows", or null when the account is not pinned yet. */
  deviceLabel: string | null;
  isBound: boolean;
}

/**
 * Frees a student's account from the device it is pinned to, so they can sign
 * in from a new phone or laptop. The next sign-in re-pins it.
 */
export const DeviceReset = ({
  userId,
  studentName,
  deviceLabel,
  isBound,
}: DeviceResetProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const onClick = async (event: React.MouseEvent) => {
    event.stopPropagation();

    if (
      !window.confirm(
        `تحرير جهاز «${studentName}»؟ هيقدر يسجل دخول من أي جهاز مرة واحدة، وبعدها يترتبط بيه.`
      )
    ) {
      return;
    }

    setIsSaving(true);
    try {
      await axios.delete(`/api/students/${userId}/device`);
      toast.success("تم تحرير الجهاز — الدخول القادم هيرتبط بالجهاز الجديد");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "حدث خطأ");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isBound) {
    return (
      <span className="flex items-center gap-x-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <MonitorSmartphone className="h-3 w-3" />
        غير مرتبط بجهاز
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-x-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold dark:bg-slate-800">
        <MonitorSmartphone className="h-3 w-3 text-brand" />
        {deviceLabel ?? "جهاز مسجّل"}
      </span>

      <button
        type="button"
        onClick={onClick}
        disabled={isSaving}
        className={cn(
          "flex items-center gap-x-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition disabled:opacity-50",
          "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/25"
        )}
      >
        {isSaving ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Unlock className="h-3 w-3" />
        )}
        تغيير الجهاز
      </button>
    </span>
  );
};

export default DeviceReset;
