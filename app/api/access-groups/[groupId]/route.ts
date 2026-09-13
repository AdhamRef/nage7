import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Confirms the signed-in teacher owns this group. */
const authorize = async (groupId: string) => {
  const { userId } = await auth();
  if (!userId) return null;

  const group = await db.accessGroup.findFirst({
    where: { id: groupId, userId },
    select: { id: true },
  });

  return group ? { teacherId: userId, group } : null;
};

/**
 * Renames the group and/or replaces its members and courses in one save, so
 * the teacher edits a whole cohort at once.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const auth_ = await authorize(params.groupId);
    if (!auth_) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();

    if (
      body.name !== undefined ||
      body.note !== undefined ||
      body.price !== undefined
    ) {
      const name = body.name === undefined ? undefined : String(body.name).trim();
      if (name !== undefined && !name) {
        return NextResponse.json(
          { error: "اسم المجموعة مطلوب" },
          { status: 400 }
        );
      }

      const price = Number(body.price);

      await db.accessGroup.update({
        where: { id: params.groupId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(body.note !== undefined
            ? { note: body.note ? String(body.note).trim() : null }
            : {}),
          ...(body.price !== undefined
            ? { price: Number.isFinite(price) && price >= 0 ? price : null }
            : {}),
        },
      });
    }

    // --- courses ---------------------------------------------------------
    if (Array.isArray(body.courseIds)) {
      // Only courses this teacher owns can be attached.
      const owned = await db.course.findMany({
        where: { userId: auth_.teacherId },
        select: { id: true },
      });
      const ownedIds = new Set(owned.map((course) => course.id));
      const wanted = new Set(
        body.courseIds.map((id: unknown) => String(id)).filter((id: string) => ownedIds.has(id))
      );

      const current = await db.courseAccessGroup.findMany({
        where: { groupId: params.groupId },
        select: { id: true, courseId: true },
      });
      const currentIds = new Set(current.map((row) => row.courseId));

      const remove = current.filter((row) => !wanted.has(row.courseId));
      const add = Array.from(wanted).filter((id) => !currentIds.has(id as string));

      if (remove.length) {
        await db.courseAccessGroup.deleteMany({
          where: { id: { in: remove.map((row) => row.id) } },
        });
      }
      if (add.length) {
        await db.courseAccessGroup.createMany({
          data: add.map((courseId) => ({
            groupId: params.groupId,
            courseId: courseId as string,
          })),
        });
      }
    }

    // --- members ---------------------------------------------------------
    if (Array.isArray(body.memberIds)) {
      const wanted = new Set(body.memberIds.map((id: unknown) => String(id)));

      const current = await db.accessGroupMember.findMany({
        where: { groupId: params.groupId },
        select: { id: true, userId: true },
      });
      const currentIds = new Set(current.map((row) => row.userId));

      const remove = current.filter((row) => !wanted.has(row.userId));
      const add = Array.from(wanted).filter((id) => !currentIds.has(id as string));

      if (remove.length) {
        await db.accessGroupMember.deleteMany({
          where: { id: { in: remove.map((row) => row.id) } },
        });
      }
      if (add.length) {
        await db.accessGroupMember.createMany({
          data: add.map((userId) => ({
            groupId: params.groupId,
            userId: userId as string,
          })),
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ACCESS_GROUP_PATCH]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

/** Deletes the group; its members lose whatever it was unlocking. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const auth_ = await authorize(params.groupId);
    if (!auth_) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await db.accessGroup.delete({ where: { id: params.groupId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ACCESS_GROUP_DELETE]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
