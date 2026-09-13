"use client";

import { Lock, MessageCircle } from "lucide-react";

import { formatPrice } from "@/lib/format";

type Props = {
  courseTitle: string;
  price: number | null | undefined;
};

/**
 * Shown in place of the progress button when the course has not been opened
 * for this student: what it costs, and how to get it opened.
 */
const ChapterUnlockPanel = ({ courseTitle, price }: Props) => {
  const label = formatPrice(price);

  return (
    <div className="w-full rounded-lg border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:w-auto md:min-w-[360px]">
      <div className="mb-3 flex items-center gap-x-2 text-sm font-semibold">
        <Lock className="h-4 w-4 text-amber-600" />
        الجزء ده مقفول
        {label && (
          <span className="mr-auto rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {label}
          </span>
        )}
      </div>
      <p className="flex items-start gap-x-1.5 text-xs leading-6 text-muted-foreground">
        <MessageCircle className="mt-1 h-3.5 w-3.5 shrink-0" />
        تواصل مع المدرب لفتح «{courseTitle}» بالكامل على حسابك.
      </p>
    </div>
  );
};

export default ChapterUnlockPanel;
