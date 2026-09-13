import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

/**
 * Releases a student's device binding so they can sign in from a new one. The
 * next successful sign-in pins the account again, to whatever device that was.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { user } = await auth();
    if (!isTeacher(user)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const student = await db.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, email: true },
    });
    if (!student) {
      return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
    }

    await db.user.update({
      where: { id: student.id },
      data: { deviceId: null, deviceLabel: null, deviceBoundAt: null },
    });

    return NextResponse.json({ ok: true, email: student.email });
  } catch (error) {
    console.error("[STUDENT_DEVICE_DELETE]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
