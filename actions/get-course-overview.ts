import { Chapter, Course, UserProgress, VideoData } from "@prisma/client";
import { cache } from "react";

import { hasGrantedAccess } from "@/lib/course-access";
import { db } from "@/lib/db";

export type OverviewChapter = Chapter & {
  videoData: VideoData | null;
  userProgress: UserProgress[];
  exercises: { id: string; question: string; type: string }[];
};

export interface CourseOverview {
  course: (Course & { chapters: OverviewChapter[] }) | null;
  /** True once the student has unlocked the course with a code. */
  hasAccess: boolean;
  /** 0–100 across published chapters. */
  progress: number;
  completedCount: number;
  totalChapters: number;
  totalDurationSeconds: number;
  freeChaptersCount: number;
  /** Where the resume button sends the student. */
  resumeChapter: OverviewChapter | null;
  /** True once at least one chapter is done, so the CTA says "استكمال". */
  hasStarted: boolean;
  /** Access bundles that include this course, for the purchase popup. */
  bundles: {
    id: string;
    name: string;
    price: number | null;
    courseCount: number;
  }[];
}

const empty: CourseOverview = {
  course: null,
  hasAccess: false,
  progress: 0,
  completedCount: 0,
  totalChapters: 0,
  totalDurationSeconds: 0,
  freeChaptersCount: 0,
  resumeChapter: null,
  hasStarted: false,
  bundles: [],
};

/**
 * Chapters are parts of one course, not separate products: a part is open when
 * the student owns the course, or when it is flagged as a free preview.
 */
export const isChapterOpen = (
  chapter: { isFree: boolean },
  hasAccess: boolean
) => hasAccess || chapter.isFree;

/** Everything the course landing page needs, in one round trip. */
const getCourseOverview = cache(
  async (courseId: string, userId: string): Promise<CourseOverview> => {
    try {
      const [course, access, groupRows] = await Promise.all([
        db.course.findUnique({
          where: { id: courseId },
          include: {
            chapters: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              include: {
                videoData: true,
                userProgress: { where: { userId } },
                exercises: {
                  where: { isPublished: true },
                  orderBy: { position: "asc" },
                  select: { id: true, question: true, type: true },
                },
              },
            },
          },
        }),
        hasGrantedAccess(userId, courseId),
        // The bundles that include this course, and how big each one is.
        db.courseAccessGroup.findMany({
          where: { courseId },
          select: {
            group: {
              select: {
                id: true,
                name: true,
                price: true,
                _count: { select: { courses: true } },
              },
            },
          },
        }),
      ]);

      if (!course) return empty;

      // A free course needs no unlock at all.
      const hasAccess = course.isFree || Boolean(access);
      const chapters = course.chapters;
      const completedCount = chapters.filter(
        (chapter) => chapter.userProgress[0]?.isCompleted
      ).length;

      const totalDurationSeconds = chapters.reduce(
        (total, chapter) => total + (chapter.videoData?.duration ?? 0),
        0
      );

      // Resume at the first unfinished part the student can actually open.
      const openable = chapters.filter((chapter) =>
        isChapterOpen(chapter, hasAccess)
      );
      const resumeChapter =
        openable.find((chapter) => !chapter.userProgress[0]?.isCompleted) ??
        openable[0] ??
        null;

      return {
        course,
        hasAccess,
        progress: chapters.length
          ? Math.round((completedCount / chapters.length) * 100)
          : 0,
        completedCount,
        totalChapters: chapters.length,
        totalDurationSeconds,
        freeChaptersCount: chapters.filter((chapter) => chapter.isFree).length,
        resumeChapter,
        hasStarted: completedCount > 0,
        bundles: groupRows.map((row) => ({
          id: row.group.id,
          name: row.group.name,
          price: row.group.price,
          courseCount: row.group._count.courses,
        })),
      };
    } catch (error) {
      console.error("[GET_COURSE_OVERVIEW]", error);
      return empty;
    }
  }
);

export default getCourseOverview;
