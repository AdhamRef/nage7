import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Replaces the set of courses one student can open, for the courses the
 * signed-in teacher owns. Anything in `courseIds` is granted, anything of the
 * teacher's that is missing from it is revoked — so the teacher can hand over
 * a whole group of courses in one save.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: teacherId } = await auth();
    if (!teacherId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const student = await db.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, email: true },
    });

    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    const body = await req.json();
    const requested: string[] = Array.isArray(body.courseIds)
      ? body.courseIds.map((id: unknown) => String(id))
      : [];

    // Only ever touch courses this teacher owns.
    const owned = await db.course.findMany({
      where: { userId: teacherId },
      select: { id: true, price: true },
    });
    const ownedIds = new Set(owned.map((course) => course.id));
    const wanted = new Set(requested.filter((id) => ownedIds.has(id)));

    const current = await db.courseAccess.findMany({
      where: { userId: student.id, courseId: { in: Array.from(ownedIds) } },
      select: { id: true, courseId: true },
    });
    const currentIds = new Set(current.map((row) => row.courseId));

    const toRevoke = current.filter((row) => !wanted.has(row.courseId));
    const toGrant = Array.from(wanted).filter((id) => !currentIds.has(id));

    if (toRevoke.length) {
      await db.courseAccess.deleteMany({
        where: { id: { in: toRevoke.map((row) => row.id) } },
      });
    }

    if (toGrant.length) {
      await db.courseAccess.createMany({
        data: toGrant.map((courseId) => ({
          userId: student.id,
          courseId,
          // Opened by hand, so it carries no revenue.
          paidPrice: 0,
        })),
      });
    }

    return NextResponse.json({
      name: student.name,
      email: student.email,
      granted: toGrant.length,
      revoked: toRevoke.length,
      courseIds: Array.from(wanted),
    });
  } catch (error) {
    console.error("[STUDENT_ACCESS_PUT]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
