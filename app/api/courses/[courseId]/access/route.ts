import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Confirms the caller owns this course. */
const authorize = async (courseId: string) => {
  const { userId } = await auth();
  if (!userId) return null;
  return db.course.findFirst({ where: { id: courseId, userId } });
};

/** Grants a student access to a paid course by hand, no code needed. */
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await authorize(params.courseId);
    if (!course) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const email = body.email ? String(body.email).toLowerCase().trim() : null;
    const studentId = body.userId ? String(body.userId) : null;

    const student = studentId
      ? await db.user.findUnique({ where: { id: studentId } })
      : email
        ? await db.user.findUnique({ where: { email } })
        : null;

    if (!student) {
      return NextResponse.json(
        { error: "مفيش طالب بالإيميل ده" },
        { status: 404 }
      );
    }

    const existing = await db.courseAccess.findUnique({
      where: { userId_courseId: { userId: student.id, courseId: course.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "الطالب ده عنده صلاحية بالفعل" },
        { status: 409 }
      );
    }

    await db.courseAccess.create({
      data: {
        userId: student.id,
        courseId: course.id,
        // Granted by hand, so it carries no code and no revenue.
        paidPrice: 0,
      },
    });

    return NextResponse.json(
      { name: student.name, email: student.email },
      { status: 201 }
    );
  } catch (error) {
    console.error("[COURSE_ACCESS_POST]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

/** Closes a course again for one student. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await authorize(params.courseId);
    if (!course) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("userId");
    if (!studentId) {
      return NextResponse.json({ error: "معرّف الطالب مطلوب" }, { status: 400 });
    }

    await db.courseAccess.deleteMany({
      where: { userId: studentId, courseId: course.id },
    });

    return NextResponse.json({ revoked: true }, { status: 200 });
  } catch (error) {
    console.error("[COURSE_ACCESS_DELETE]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
