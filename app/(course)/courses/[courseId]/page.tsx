import {
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  Lock,
  Play,
  ScrollText,
  Terminal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import React, { Fragment } from "react";

import getCourseOverview, { isChapterOpen } from "@/actions/get-course-overview";
import BrandGlow from "@/components/brand-glow";
import PurchaseCta from "@/components/purchase-cta";
import { courseImageSizes, courseImageUrl } from "@/lib/course-image";
import {
  formatDuration,
  formatPrice,
  formatTotalDuration,
  stripHtml,
} from "@/lib/format";
import { getPaymentInfo, whatsappLink } from "@/lib/payment";
import { requireCompleteProfile } from "@/lib/require-profile";
import { cn } from "@/lib/utils";

import ChapterThumb from "./_components/chapter-thumb";
import CourseHeader from "./_components/course-header";

/**
 * The course page: a contained poster capped by the content width, the details
 * beside it, then the lesson list. Works in both themes because the artwork is
 * a self-contained card rather than a band bleeding into the page background.
 */
const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {
  const { userId } = await requireCompleteProfile();

  const {
    course,
    progress,
    completedCount,
    totalChapters,
    totalDurationSeconds,
    freeChaptersCount,
    hasAccess,
    resumeChapter,
    hasStarted,
    bundles,
  } = await getCourseOverview(params.courseId, userId);

  if (!course) {
    return redirect("/dashboard");
  }

  const duration = formatTotalDuration(totalDurationSeconds);
  const price = formatPrice(course.price);
  const payment = getPaymentInfo();
  const resumeHref = resumeChapter
    ? `/courses/${course.id}/chapters/${resumeChapter.id}`
    : null;

  const metaChip = "flex items-center gap-x-1.5 text-white/85";
  // The side column only exists when it has something to say.
  const hasAside = hasStarted || !hasAccess;

  return (
    <div className="relative min-h-full bg-white text-slate-900 dark:bg-brand-ink dark:text-white">
      <BrandGlow />

      <CourseHeader
        courseTitle={course.title}
        progress={progress}
        hasStarted={hasStarted}
        resumeHref={resumeHref}
      />

      <main className="relative mx-auto max-w-6xl px-6 pb-20 pt-24">
        {/* Poster — height is capped by the content width, so it never swallows
            the viewport and never needs cropping. */}
        <section className="relative aspect-video min-h-[300px] w-full overflow-hidden rounded-2xl border border-black/5 bg-brand-ink shadow-xl dark:border-white/10">
          {course.imageUrl ? (
            <Image
              src={courseImageUrl(course.imageUrl, "backdrop")}
              alt={course.title}
              fill
              priority
              sizes={courseImageSizes.backdrop}
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-deep/40 via-brand-ink to-brand-ink">
              <Code2 className="h-16 w-16 text-white/20" />
            </div>
          )}

          {/* Scrim confined to the lower band, so the artwork stays visible */}
          <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black via-black/60 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10">
            <span className="mb-4 inline-flex w-fit items-center gap-x-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-brand-teal ring-1 ring-white/20 backdrop-blur">
              درس البرمجة
            </span>

            <h1 className="max-w-3xl text-3xl font-black leading-tight text-white drop-shadow-lg md:text-5xl md:leading-[1.15]">
              {course.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className={metaChip}>
                <ScrollText className="h-4 w-4" />
                {totalChapters} جزءاً
              </span>
              {duration && (
                <span className={metaChip}>
                  <Clock className="h-4 w-4" />
                  {duration}
                </span>
              )}
              {freeChaptersCount > 0 && (
                <span className={metaChip}>
                  <Play className="h-4 w-4" />
                  {freeChaptersCount} مجاني
                </span>
              )}
              {hasAccess ? (
                <span className="flex items-center gap-x-1.5 font-bold text-brand">
                  <CheckCircle2 className="h-4 w-4" />
                  مفتوح لك
                </span>
              ) : (
                price && (
                  <span className="rounded-full bg-gradient-to-l from-brand to-brand-teal px-3 py-1 text-xs font-bold text-white">
                    {price}
                  </span>
                )
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {resumeHref && (
                <Link
                  href={resumeHref}
                  className="flex items-center gap-x-2 rounded-lg px-7 py-3 text-base bg-brand font-bold text-white shadow-lg shadow-brand/25 ring-1 ring-inset ring-white/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-brand/40 active:brightness-95"
                >
                  <Play className="h-5 w-5 fill-slate-950" />
                  {hasStarted ? "كمّل المشاهدة" : "ابدأ الدرس"}
                </Link>
              )}
              <Link
                href="#chapters"
                className="flex items-center gap-x-2 rounded-lg bg-white/15 px-7 py-3 text-base font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/25"
              >
                <BookOpen className="h-5 w-5" />
                كل الأجزاء
              </Link>
            </div>
          </div>
        </section>

        {/* Lessons, with the progress / unlock panel beside them */}
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {hasAside && (
          <aside className="space-y-4 lg:sticky lg:top-24 lg:order-2 lg:self-start">
            {hasStarted && (
              <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">تقدمك</span>
                  <span className="font-bold text-brand">{progress}%</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-brand to-brand-teal transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  أكملت {completedCount} من {totalChapters} جزءاً
                </p>
                {resumeChapter && (
                  <p className="mt-3 truncate text-sm">
                    <span className="text-muted-foreground">التالي: </span>
                    {resumeChapter.title}
                  </p>
                )}
              </div>
            )}

            {!hasAccess && (
              <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                {/* Price, stated plainly */}
                <div className="border-b p-5 dark:border-white/10">
                  <p className="text-xs font-semibold text-muted-foreground">
                    سعر الدرس
                  </p>
                  <p className="mt-1 flex items-baseline gap-x-1.5">
                    <span className="text-3xl font-black text-brand-deep dark:text-brand">
                      {course.price ?? 0}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">
                      جنية
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    دفعة واحدة · وصول مدى الحياة
                  </p>

                  <div className="mt-4">
                    <PurchaseCta
                      courseTitle={course.title}
                      coursePrice={course.price}
                      bundles={bundles}
                      vodafoneCash={payment.vodafoneCash}
                      instapay={payment.instapay}
                      instapayHandle={payment.instapayHandle}
                      support={payment.support}
                      whatsappHref={whatsappLink(payment.support)}
                    />
                  </div>
                </div>

                <ul className="space-y-2 p-5 text-xs text-muted-foreground">
                  <li className="flex items-start gap-x-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    {totalChapters} جزء
                    {duration ? ` · ${duration}` : ""}
                  </li>
                  {freeChaptersCount > 0 && (
                    <li className="flex items-start gap-x-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                      {freeChaptersCount} جزء مجاني تقدر تجربه قبل ما تدفع
                    </li>
                  )}
                  <li className="flex items-start gap-x-2">
                    <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    باقي الأجزاء بتتفتح فور تأكيد التحويل
                  </li>
                </ul>
              </div>
            )}
          </aside>
          )}

          <section
            id="chapters"
            className={cn(
              "scroll-mt-24 lg:order-1",
              hasAside ? "lg:col-span-2" : "lg:col-span-3"
            )}
          >
            <h2 className="mb-5 text-2xl font-bold">الأجزاء</h2>

          {!course.chapters.length ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground dark:border-white/10">
              لسه مفيش أجزاء منشورة في الدرس ده.
            </p>
          ) : (
            <div className="divide-y overflow-hidden rounded-xl border bg-white dark:divide-white/5 dark:border-white/10 dark:bg-white/[0.02]">
              {course.chapters.map((chapter, index) => {
                const isCompleted = Boolean(chapter.userProgress[0]?.isCompleted);
                const unlocked = isChapterOpen(chapter, hasAccess);
                const chapterDuration = formatDuration(
                  chapter.videoData?.duration
                );
                const chapterSummary = stripHtml(chapter.description);

                const body = (
                  <>
                    <span
                      className={cn(
                        "w-8 shrink-0 text-center text-2xl font-black tabular-nums",
                        isCompleted
                          ? "text-brand"
                          : "text-slate-300 dark:text-slate-600"
                      )}
                    >
                      {index + 1}
                    </span>

                    <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800 md:h-24 md:w-40">
                      <ChapterThumb
                        src={chapter.videoData?.thumbnailUrl}
                        fallbackSrc={courseImageUrl(course.imageUrl, "thumb")}
                        alt={chapter.title}
                      />
                      <span
                        className={cn(
                          "absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition",
                          unlocked && "group-hover:opacity-100"
                        )}
                      >
                        <Play className="h-8 w-8 fill-white text-white" />
                      </span>
                      {!unlocked && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Lock className="h-5 w-5 text-slate-200" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-x-3">
                        <h3 className="font-semibold leading-6 transition-colors group-hover:text-brand">
                          {chapter.title}
                        </h3>
                        {chapterDuration && (
                          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                            {chapterDuration}
                          </span>
                        )}
                      </div>

                      {chapterSummary && (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {chapterSummary}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        {isCompleted && (
                          <span className="flex items-center gap-x-1 rounded-full bg-brand/10 px-2 py-0.5 text-brand dark:bg-brand/15">
                            <CheckCircle2 className="h-3 w-3" />
                            مكتمل
                          </span>
                        )}
                        {chapter.isFree && (
                          <span className="rounded-full bg-brand-teal/15 px-2 py-0.5 text-brand-deep dark:text-brand-teal">
                            مجاني
                          </span>
                        )}
                        {chapter.exercises.length > 0 && (
                          <span className="flex items-center gap-x-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                            <Terminal className="h-3 w-3" />
                            {chapter.exercises.length} تمرين
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                );

                const rowClass =
                  "group flex w-full items-center gap-x-4 p-4 text-right transition";

                return (
                  <Fragment key={chapter.id}>
                    {unlocked ? (
                      <Link
                        href={`/courses/${course.id}/chapters/${chapter.id}`}
                        className={cn(
                          rowClass,
                          "hover:bg-slate-50 dark:hover:bg-white/5"
                        )}
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className={cn(rowClass, "opacity-60")}>{body}</div>
                    )}

                  </Fragment>
                );
              })}
            </div>
          )}
          </section>
        </div>

      </main>
    </div>
  );
};

export default CourseIdPage;
