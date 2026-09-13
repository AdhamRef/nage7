import { db } from "@/lib/db";

/**
 * A student can open a course three ways: it is free, the teacher opened it
 * for them directly, or they belong to an access group ("شهر 1") the course is
 * attached to. Everything that gates a lesson goes through here so the three
 * never drift apart.
 */

/** Ids of the groups this student belongs to. */
const groupIdsFor = async (userId: string) => {
  const rows = await db.accessGroupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  return rows.map((row) => row.groupId);
};

/** True when the student may open the course, ignoring `isFree`. */
export const hasGrantedAccess = async (userId: string, courseId: string) => {
  const direct = await db.courseAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  if (direct) return true;

  const groupIds = await groupIdsFor(userId);
  if (!groupIds.length) return false;

  const viaGroup = await db.courseAccessGroup.findFirst({
    where: { courseId, groupId: { in: groupIds } },
    select: { id: true },
  });

  return Boolean(viaGroup);
};

/**
 * The subset of `courseIds` the student can open, ignoring `isFree` — for
 * pages that gate several courses in one pass.
 */
export const grantedCourseIds = async (
  userId: string,
  courseIds?: string[]
) => {
  const scope = courseIds?.length ? { in: courseIds } : undefined;

  const [direct, groupIds] = await Promise.all([
    db.courseAccess.findMany({
      where: { userId, ...(scope ? { courseId: scope } : {}) },
      select: { courseId: true },
    }),
    groupIdsFor(userId),
  ]);

  const ids = new Set(direct.map((row) => row.courseId));

  if (groupIds.length) {
    const viaGroups = await db.courseAccessGroup.findMany({
      where: { groupId: { in: groupIds }, ...(scope ? { courseId: scope } : {}) },
      select: { courseId: true },
    });
    for (const row of viaGroups) ids.add(row.courseId);
  }

  return ids;
};
