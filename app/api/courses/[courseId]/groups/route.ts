import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Replaces the set of access groups that unlock this course. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const course = await db.course.findFirst({
      where: { id: params.courseId, userId },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const requested: string[] = Array.isArray(body.groupIds)
      ? body.groupIds.map((id: unknown) => String(id))
      : [];

    // Only the teacher's own groups can be attached.
    const owned = await db.accessGroup.findMany({
      where: { userId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((group) => group.id));
    const wanted = new Set(requested.filter((id) => ownedIds.has(id)));

    const current = await db.courseAccessGroup.findMany({
      where: { courseId: course.id },
      select: { id: true, groupId: true },
    });
    const currentIds = new Set(current.map((row) => row.groupId));

    const remove = current.filter((row) => !wanted.has(row.groupId));
    const add = Array.from(wanted).filter((id) => !currentIds.has(id));

    if (remove.length) {
      await db.courseAccessGroup.deleteMany({
        where: { id: { in: remove.map((row) => row.id) } },
      });
    }
    if (add.length) {
      await db.courseAccessGroup.createMany({
        data: add.map((groupId) => ({ groupId, courseId: course.id })),
      });
    }

    return NextResponse.json({ groupIds: Array.from(wanted) });
  } catch (error) {
    console.error("[COURSE_GROUPS_PUT]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
