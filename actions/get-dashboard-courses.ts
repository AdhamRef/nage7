import { grantedCourseIds } from "@/lib/course-access";
import { db } from "@/lib/db";
import { Chapter, Course } from "@prisma/client";
import getProgress from "./get-progress";

type DashboardCourses = {
  completedCourses: any[];
  coursesInProgress: any[];
};
type CourseWithProgress = Course & {
  chapters: Chapter[];
  progress: number | null;
};

export const GetDashboardCourses = async (
  userId: string
): Promise<DashboardCourses> => {
  try {
    // Direct grants and anything their access groups unlock.
    const courseIds = Array.from(await grantedCourseIds(userId));

    const courses = (await db.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        chapters: {
          where: { isPublished: true },
        },
      },
    })) as CourseWithProgress[];

    for (let course of courses) {
      const progress = await getProgress(userId, course.id);
      course["progress"] = progress;
    }

    const completedCourses = courses.filter(
      (course) => course.progress === 100
    );
    const coursesInProgress = courses.filter(
      (course) => course.progress !== 100
    );
    
    return {
      completedCourses,
      coursesInProgress,
    };
  } catch (error) {
    console.error("[GET_DASHBOARD_COURSES]", error);
    return {
      completedCourses: [],
      coursesInProgress: [],
    };
  }
};
