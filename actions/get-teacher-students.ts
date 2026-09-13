import type { StudentProfile } from "@prisma/client";
import { cache } from "react";

import { db } from "@/lib/db";

export type EnrollmentSource = "free" | "manual" | "group" | "watching";

export interface StudentEnrollment {
  courseId: string;
  courseTitle: string;
  /** When they unlocked it, or first opened it if they never needed to. */
  startedAt: Date;
  paidPrice: number;
  /** True when the teacher has opened this course for them. */
  hasAccess: boolean;
  /** How they came to have it, for the badge in the table. */
  source: EnrollmentSource;
  /** True when a direct grant exists, so it can be revoked from the row. */
  hasDirectAccess: boolean;
  /** Access groups of theirs that unlock this course. */
  groups: string[];
  completedChapters: number;
  totalChapters: number;
  progress: number;
}

/** What the registration wizard collected, for the teacher to read. */
export type StudentDetails = Pick<
  StudentProfile,
  "gender" | "phone" | "whatsapp" | "governorate" | "city" | "guardianPhone"
>;

export interface TeacherStudent {
  userId: string;
  name: string;
  email: string | null;
  image: string | null;
  joinedAt: Date | null;
  /** True when no User row matches — e.g. a pre-migration id. */
  isOrphan: boolean;
  /** null when they registered before the wizard existed. */
  details: StudentDetails | null;
  /** True once the account is pinned to a device. */
  deviceBound: boolean;
  /** "Chrome · Windows", when we captured it. */
  deviceLabel: string | null;
  deviceBoundAt: Date | null;
  enrollments: StudentEnrollment[];
  totalPaid: number;
  /** Average completion across their courses, 0–100. */
  averageProgress: number;
  lastActivityAt: Date | null;
  /** Sort key: first course activity, else the day they registered. */
  firstSeenAt: Date;
}

/**
 * Every registered account, with whatever courses each one has touched —
 * watched for free, or opened for them by the teacher. Someone who has signed
 * up but never opened a lesson still appears, with no enrollments.
 */
const getTeacherStudents = cache(
  async (teacherId: string): Promise<TeacherStudent[]> => {
    try {
      const courses = await db.course.findMany({
        where: { userId: teacherId },
        select: {
          id: true,
          title: true,
          isFree: true,
          chapters: { where: { isPublished: true }, select: { id: true } },
        },
      });

      const courseById = new Map(courses.map((course) => [course.id, course]));
      const chapterToCourse = new Map<string, string>();
      for (const course of courses) {
        for (const chapter of course.chapters) {
          chapterToCourse.set(chapter.id, course.id);
        }
      }

      const [users, accesses, progress, groups] = await Promise.all([
        // Everyone who has ever signed in, minus the teacher themselves.
        db.user.findMany({
          where: { id: { not: teacherId } },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
            profile: true,
            deviceId: true,
            deviceLabel: true,
            deviceBoundAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        courses.length
          ? db.courseAccess.findMany({
              where: { courseId: { in: courses.map((course) => course.id) } },
              orderBy: { createdAt: "desc" },
            })
          : Promise.resolve([]),
        chapterToCourse.size
          ? db.userProgress.findMany({
              where: { chapterId: { in: Array.from(chapterToCourse.keys()) } },
              select: {
                userId: true,
                chapterId: true,
                isCompleted: true,
                updatedAt: true,
                createdAt: true,
              },
            })
          : Promise.resolve([]),
        // Cohorts open courses for everyone inside them.
        db.accessGroup.findMany({
          where: { userId: teacherId },
          select: {
            name: true,
            members: { select: { userId: true } },
            courses: { select: { courseId: true } },
          },
        }),
      ]);

      // (student, course) -> the names of the groups granting it.
      const groupGrants = new Map<string, string[]>();
      for (const group of groups) {
        for (const member of group.members) {
          for (const row of group.courses) {
            const key = `${member.userId}:${row.courseId}`;
            groupGrants.set(key, [...(groupGrants.get(key) ?? []), group.name]);
          }
        }
      }

      const userById = new Map(users.map((user) => [user.id, user]));
      const accessByPair = new Map(
        accesses.map((row) => [`${row.userId}:${row.courseId}`, row])
      );

      // Per (student, course): completed count, first touch, last activity.
      const completed = new Map<string, number>();
      const firstTouch = new Map<string, Date>();
      const lastActivity = new Map<string, Date>();
      const pairs = new Set<string>();

      for (const row of progress) {
        const courseId = chapterToCourse.get(row.chapterId);
        if (!courseId) continue;

        const pair = `${row.userId}:${courseId}`;
        pairs.add(pair);

        if (row.isCompleted) {
          completed.set(pair, (completed.get(pair) ?? 0) + 1);
        }
        if (!firstTouch.has(pair) || row.createdAt < firstTouch.get(pair)!) {
          firstTouch.set(pair, row.createdAt);
        }

        const previous = lastActivity.get(row.userId);
        if (!previous || row.updatedAt > previous) {
          lastActivity.set(row.userId, row.updatedAt);
        }
      }

      for (const row of accesses) pairs.add(`${row.userId}:${row.courseId}`);
      for (const key of Array.from(groupGrants.keys())) pairs.add(key);

      // Start from the accounts, so a student with no activity still lists.
      const byStudent = new Map<string, TeacherStudent>();
      const shell = (studentId: string): TeacherStudent => {
        const user = userById.get(studentId);
        return {
          userId: studentId,
          name: user?.profile?.fullName ?? user?.name ?? "مستخدم غير معروف",
          email: user?.email ?? null,
          image: user?.image ?? null,
          joinedAt: user?.createdAt ?? null,
          isOrphan: !user,
          details: user?.profile ?? null,
          deviceBound: Boolean(user?.deviceId),
          deviceLabel: user?.deviceLabel ?? null,
          deviceBoundAt: user?.deviceBoundAt ?? null,
          enrollments: [],
          totalPaid: 0,
          averageProgress: 0,
          lastActivityAt: lastActivity.get(studentId) ?? null,
          firstSeenAt: user?.createdAt ?? new Date(0),
        };
      };

      for (const user of users) byStudent.set(user.id, shell(user.id));

      for (const pair of Array.from(pairs)) {
        const [studentId, courseId] = pair.split(":");
        const course = courseById.get(courseId);
        if (!course) continue;

        // Rows left behind by a deleted or pre-migration account.
        if (!byStudent.has(studentId)) byStudent.set(studentId, shell(studentId));
        const student = byStudent.get(studentId)!;

        const access = accessByPair.get(pair);
        const total = course.chapters.length;
        const done = completed.get(pair) ?? 0;

        const viaGroups = groupGrants.get(pair) ?? [];
        const source: EnrollmentSource = access
          ? "manual"
          : viaGroups.length
            ? "group"
            : course.isFree
              ? "free"
              : "watching";

        const startedAt = access?.createdAt ?? firstTouch.get(pair) ?? new Date();

        student.enrollments.push({
          courseId: course.id,
          courseTitle: course.title,
          startedAt,
          paidPrice: access?.paidPrice ?? 0,
          hasAccess: Boolean(access) || viaGroups.length > 0,
          hasDirectAccess: Boolean(access),
          groups: viaGroups,
          source,
          completedChapters: done,
          totalChapters: total,
          progress: total ? Math.round((done / total) * 100) : 0,
        });

        student.totalPaid += access?.paidPrice ?? 0;
        if (startedAt < student.firstSeenAt) student.firstSeenAt = startedAt;
      }

      const students = Array.from(byStudent.values());
      for (const student of students) {
        student.averageProgress = student.enrollments.length
          ? Math.round(
              student.enrollments.reduce((sum, row) => sum + row.progress, 0) /
                student.enrollments.length
            )
          : 0;
      }

      // Most recently active first, then the newest accounts.
      return students.sort((a, b) => {
        const aKey = a.lastActivityAt ?? a.joinedAt ?? a.firstSeenAt;
        const bKey = b.lastActivityAt ?? b.joinedAt ?? b.firstSeenAt;
        return bKey.getTime() - aKey.getTime();
      });
    } catch (error) {
      console.error("[GET_TEACHER_STUDENTS]", error);
      return [];
    }
  }
);

export default getTeacherStudents;
