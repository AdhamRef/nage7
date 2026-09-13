import { ArrowLeft, Clock, PlayCircle, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

import { courseImageSizes, courseImageUrl } from "@/lib/course-image";
import { formatTotalDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  title: string;
  imageUrl: string;
  chaptersLength: number;
  durationSeconds: number;
  price: number;
  isFree: boolean;
  /** True when the student can already open it — free, granted, or in a group. */
  hasAccess: boolean;
  progress: number | null;
};

/**
 * Catalogue tile: artwork on top, then the title, what you get, and a footer
 * that pairs the price with the action — watch it if it is already open,
 * otherwise buy it.
 */
const CourseCard = ({
  id,
  title,
  imageUrl,
  chaptersLength,
  durationSeconds,
  price,
  isFree,
  hasAccess,
  progress,
}: Props) => {
  const duration = formatTotalDuration(durationSeconds);
  const isOpen = hasAccess || isFree || price === 0;
  const hasProgress = isOpen && progress !== null && progress > 0;

  return (
    <Link href={`/courses/${id}`} className="group block h-full">
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border bg-white",
          "border-slate-200/80 shadow-sm dark:border-white/10 dark:bg-white/[0.03]",
          "transition-all duration-300",
          "hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        )}
      >
        {/* Artwork */}
        <div className="relative aspect-video w-full overflow-hidden bg-brand-ink">
          {imageUrl ? (
            <Image
              fill
              sizes={courseImageSizes.card}
              alt={title}
              src={courseImageUrl(imageUrl, "card")}
              className="object-cover transition-transform [transition-duration:600ms] ease-out group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-deep/40 via-brand-ink to-brand-ink" />
          )}

          {/* Play affordance, centred like a video thumbnail */}
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                "bg-gradient-to-l from-brand to-brand-teal text-white shadow-lg shadow-black/30",
                "transition-transform duration-300 group-hover:scale-110"
              )}
            >
              <PlayCircle className="h-7 w-7" strokeWidth={2.2} />
            </span>
          </span>

          {/* Progress rides the artwork, so a started card is no taller
              than an untouched one. */}
          {hasProgress && (
            <>
              <span className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-2.5 right-3 text-[11px] font-bold text-white drop-shadow">
                {progress === 100 ? "خلصت الحصة 🎉" : `أنجزت ${progress}%`}
              </span>
              <span className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
                <span
                  className={cn(
                    "block h-full transition-all",
                    progress === 100
                      ? "bg-brand"
                      : "bg-gradient-to-l from-brand to-brand-teal"
                  )}
                  style={{ width: `${Math.min(progress!, 100)}%` }}
                />
              </span>
            </>
          )}

          {/* State, top corner */}
          {hasAccess && !isFree && (
            <span className="absolute right-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white shadow">
              مشترك
            </span>
          )}
          {isFree && (
            <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-brand-deep shadow">
              مجاني
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-lg font-extrabold leading-8 text-brand-deep transition-colors dark:text-brand">
            {title}
          </h3>

          {/* What you get */}
          <div className="mb-5 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-x-1.5">
              <Video className="h-3.5 w-3.5 text-brand" />
              {chaptersLength} محاضرة
            </span>
            {duration && (
              <span className="flex items-center gap-x-1.5">
                <Clock className="h-3.5 w-3.5 text-brand" />
                {duration}
              </span>
            )}
          </div>

          {/* Price + action */}
          <div className="mt-auto flex items-center justify-between gap-x-3 border-t pt-4 dark:border-white/10">
            <span className="min-w-0">
              {isFree || price === 0 ? (
                <span className="text-lg font-black text-brand-deep dark:text-brand">
                  مجاناً
                </span>
              ) : hasAccess ? (
                <span className="text-sm font-bold text-muted-foreground">
                  مدفوع بالكامل
                </span>
              ) : (
                <span className="flex items-baseline gap-x-1">
                  <span className="text-2xl font-black leading-none text-brand-deep dark:text-brand">
                    {price}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    جنية
                  </span>
                </span>
              )}
            </span>

            {/* Both states wear the same chip — only the wording changes. */}
            <span className="flex shrink-0 items-center gap-x-1.5 rounded-lg bg-brand/10 px-4 py-2.5 text-sm font-bold text-brand-deep ring-1 ring-inset ring-brand/25 transition-all duration-300 group-hover:bg-brand group-hover:text-white group-hover:ring-brand dark:text-brand dark:group-hover:text-white">
              {isOpen ? "شاهد الحصة" : "أحصل على الحصة"}
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default CourseCard;
