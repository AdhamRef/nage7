import { cache } from "react";

import { db } from "@/lib/db";

export interface MonthPoint {
  /** "2026-08" */
  key: string;
  label: string;
  revenue: number;
  enrollments: number;
}

export interface CourseRow {
  id: string;
  title: string;
  isPublished: boolean;
  price: number | null;
  chapters: number;
  publishedChapters: number;
  students: number;
  revenue: number;
  /** Average completion across enrolled students, 0–100. */
  completion: number;
}

export interface TeacherDashboard {
  totalRevenue: number;
  totalStudents: number;
  totalEnrollments: number;
  publishedCourses: number;
  totalCourses: number;
  /** Courses opened by hand across all students. */
  grantedAccess: number;
  /** Students who can open at least one paid course. */
  studentsWithAccess: number;
  averageCompletion: number;
  /** Revenue and enrollments for the last 12 months, oldest first. */
  months: MonthPoint[];
  courses: CourseRow[];
  recentEnrollments: {
    userId: string;
    name: string;
    email: string | null;
    courseTitle: string;
    paidPrice: number;
    at: Date;
  }[];
}

const MONTH_LABELS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const empty: TeacherDashboard = {
  totalRevenue: 0,
  totalStudents: 0,
  totalEnrollments: 0,
  publishedCourses: 0,
  totalCourses: 0,
  grantedAccess: 0,
  studentsWithAccess: 0,
  averageCompletion: 0,
  months: [],
  courses: [],
  recentEnrollments: [],
};

/** Everything the teacher home page and analytics need, in one pass. */
const getTeacherDashboard = cache(
  async (userId: string): Promise<TeacherDashboard> => {
    try {
      const courses = await db.course.findMany({
        where: { userId },
        include: {
          chapters: { select: { id: true, isPublished: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!courses.length) return empty;

      const courseIds = courses.map((course) => course.id);

      const accesses = await db.courseAccess.findMany({
        where: { courseId: { in: courseIds } },
        orderBy: { createdAt: "desc" },
      });

      // Published chapter ids per course, for completion maths.
      const publishedByCourse = new Map<string, string[]>();
      const chapterToCourse = new Map<string, string>();
      for (const course of courses) {
        const published = course.chapters
          .filter((chapter) => chapter.isPublished)
          .map((chapter) => chapter.id);
        publishedByCourse.set(course.id, published);
        for (const id of published) chapterToCourse.set(id, course.id);
      }

      // Watching counts as being a student, not just unlocking.
      const learners = chapterToCourse.size
        ? await db.userProgress.findMany({
            where: { chapterId: { in: Array.from(chapterToCourse.keys()) } },
            select: { userId: true, chapterId: true, isCompleted: true },
          })
        : [];

      const studentIds = Array.from(
        new Set([
          ...accesses.map((a) => a.userId),
          ...learners.map((a) => a.userId),
        ])
      );

      const [users, progress] = await Promise.all([
        studentIds.length
          ? db.user.findMany({
              where: { id: { in: studentIds } },
              select: { id: true, name: true, email: true },
            })
          : Promise.resolve([]),
        Promise.resolve(learners.filter((row) => row.isCompleted)),
      ]);

      const userById = new Map(users.map((user) => [user.id, user]));

      // completed[courseId][userId] = number of finished chapters
      const completed = new Map<string, Map<string, number>>();
      for (const row of progress) {
        const courseId = chapterToCourse.get(row.chapterId);
        if (!courseId) continue;
        if (!completed.has(courseId)) completed.set(courseId, new Map());
        const perUser = completed.get(courseId)!;
        perUser.set(row.userId, (perUser.get(row.userId) ?? 0) + 1);
      }

      // ---- monthly series --------------------------------------------------
      const months: MonthPoint[] = [];
      const now = new Date();
      const monthIndex = new Map<string, MonthPoint>();
      for (let back = 11; back >= 0; back -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
        const point: MonthPoint = {
          key: monthKey(date),
          label: MONTH_LABELS[date.getMonth()],
          revenue: 0,
          enrollments: 0,
        };
        months.push(point);
        monthIndex.set(point.key, point);
      }

      for (const access of accesses) {
        const point = monthIndex.get(monthKey(access.createdAt));
        if (!point) continue;
        point.revenue += access.paidPrice ?? 0;
        point.enrollments += 1;
      }

      // ---- per-course rows -------------------------------------------------
      const courseRows: CourseRow[] = courses.map((course) => {
        const courseAccesses = accesses.filter((a) => a.courseId === course.id);
        const courseStudentIds = new Set(courseAccesses.map((a) => a.userId));
        for (const row of learners) {
          if (chapterToCourse.get(row.chapterId) === course.id) {
            courseStudentIds.add(row.userId);
          }
        }
        const published = publishedByCourse.get(course.id) ?? [];
        const perUser = completed.get(course.id);

        const completionSum = Array.from(courseStudentIds).reduce(
          (sum, studentId) => {
            if (!published.length) return sum;
            const done = perUser?.get(studentId) ?? 0;
            return sum + (done / published.length) * 100;
          },
          0
        );

        return {
          id: course.id,
          title: course.title,
          isPublished: course.isPublished,
          price: course.price,
          chapters: course.chapters.length,
          publishedChapters: published.length,
          students: courseStudentIds.size,
          revenue: courseAccesses.reduce(
            (sum, access) => sum + (access.paidPrice ?? 0),
            0
          ),
          completion: courseStudentIds.size
            ? Math.round(completionSum / courseStudentIds.size)
            : 0,
        };
      });

      // ---- manual grants ---------------------------------------------------
      const grantedAccess = accesses.length;
      const studentsWithAccess = new Set(accesses.map((row) => row.userId)).size;

      const totalRevenue = accesses.reduce(
        (sum, access) => sum + (access.paidPrice ?? 0),
        0
      );

      const enrolledRows = courseRows.filter((row) => row.students > 0);

      return {
        totalRevenue,
        totalStudents: studentIds.length,
        totalEnrollments: accesses.length,
        publishedCourses: courses.filter((course) => course.isPublished).length,
        totalCourses: courses.length,
        grantedAccess,
        studentsWithAccess,
        averageCompletion: enrolledRows.length
          ? Math.round(
              enrolledRows.reduce((sum, row) => sum + row.completion, 0) /
                enrolledRows.length
            )
          : 0,
        months,
        courses: courseRows,
        recentEnrollments: accesses.slice(0, 8).map((access) => {
          const user = userById.get(access.userId);
          return {
            userId: access.userId,
            name: user?.name ?? "مستخدم محذوف",
            email: user?.email ?? null,
            courseTitle:
              courses.find((course) => course.id === access.courseId)?.title ??
              "—",
            paidPrice: access.paidPrice ?? 0,
            at: access.createdAt,
          };
        }),
      };
    } catch (error) {
      console.error("[GET_TEACHER_DASHBOARD]", error);
      return empty;
    }
  }
);

export default getTeacherDashboard;
