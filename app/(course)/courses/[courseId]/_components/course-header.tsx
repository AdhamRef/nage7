"use client";

import { LayoutDashboard, ListVideo, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { UserMenu } from "@/components/user-menu";
import { cn } from "@/lib/utils";

interface CourseHeaderProps {
  courseTitle: string;
  progress: number;
  hasStarted: boolean;
  resumeHref: string | null;
}

/**
 * Sticky bar over the course page. Picks up the course title and a resume
 * shortcut once the poster scrolls away, so it stays useful further down.
 */
const CourseHeader = ({
  courseTitle,
  progress,
  hasStarted,
  resumeHref,
}: CourseHeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b backdrop-blur-md transition-colors duration-300",
        scrolled
          ? "border-black/10 bg-white/85 dark:border-white/10 dark:bg-brand-ink/85"
          : "border-transparent bg-white/60 dark:bg-brand-ink/60"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-6 py-3.5">
        <Link href="/" className="shrink-0 text-xl font-black">
          ناجح
        </Link>

        <nav className="hidden items-center gap-x-6 text-sm font-semibold md:flex">
          <Link
            href="/courses"
            className="flex items-center gap-x-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            الدروس
          </Link>
          <a
            href="#chapters"
            className="flex items-center gap-x-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <ListVideo className="h-4 w-4" />
            الأجزاء
          </a>
        </nav>

        {/* Once the poster is gone, remind the reader what they're looking at */}
        <span
          className={cn(
            "hidden min-w-0 flex-1 truncate text-sm text-muted-foreground transition-opacity duration-300 lg:block",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        >
          {courseTitle}
        </span>

        <div className="mr-auto flex shrink-0 items-center gap-x-3">
          {hasStarted && (
            <span className="hidden rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand sm:block dark:bg-brand/15">
              {progress}% مكتمل
            </span>
          )}

          {resumeHref && scrolled && (
            <Link
              href={resumeHref}
              className="hidden items-center gap-x-1.5 rounded-lg px-4 py-1.5 text-sm bg-brand font-bold text-white shadow-lg shadow-brand/25 ring-1 ring-inset ring-white/20 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-brand/40 active:brightness-95 sm:flex"
            >
              <Play className="h-3.5 w-3.5 fill-slate-950" />
              {hasStarted ? "استكمال" : "ابدأ"}
            </Link>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default CourseHeader;
