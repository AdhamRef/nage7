import { grantedCourseIds } from "@/lib/course-access";
import { db } from "@/lib/db";
import { Course } from "@prisma/client";
import getProgress from "./get-progress";

type CourseWithProgress = Course & {
  chapters: { id: string }[];
  progress: number | null;
  imageUrl: string; // Ensure this is always a string
  /** Total runtime of the published chapters, for the card. */
  durationSeconds: number;
  /** True when the student can open it — free, granted, or via a group. */
  hasAccess: boolean;
};

type GetCourses = {
  userId: string;
  title?: string;
};

const getCourses = async ({
  userId,
  title,
}: GetCourses): Promise<CourseWithProgress[]> => {
  try {
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        title: {
          contains: title,
        },
      },
      include: {
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            videoData: { select: { duration: true } },
          },
        },
        _count: { select: { chapters: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // One lookup for the whole page rather than one per card.
    const unlocked = await grantedCourseIds(
      userId,
      courses.map((course) => course.id)
    );

    const coursesWithProgress: CourseWithProgress[] = await Promise.all(
      courses.map(async (course) => {
        const durationSeconds = course.chapters.reduce(
          (total, chapter) => total + (chapter.videoData?.duration ?? 0),
          0
        );

        const hasAccess = course.isFree || unlocked.has(course.id);

        if (!course.chapters.length) {
          return {
            ...course,
            progress: null,
            durationSeconds,
            hasAccess,
            imageUrl: course.imageUrl || "/default-image.jpg",
          };
        }

        const progressPercentage = await getProgress(userId, course.id);

        return {
          ...course,
          progress: progressPercentage,
          durationSeconds,
          hasAccess,
          imageUrl: course.imageUrl || "/default-image.jpg",
        };
      })
    );

    return coursesWithProgress;
  } catch (error) {
    console.log("[GET_COURSES]", error);
    return [];
  }
};

export default getCourses;
