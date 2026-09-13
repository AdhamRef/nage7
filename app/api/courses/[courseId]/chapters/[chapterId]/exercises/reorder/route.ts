import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Persists the order the teacher dragged the exercises into. */
export async function PUT(
  req: NextRequest,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const courseOwner = await db.course.findFirst({
      where: { id: params.courseId, userId },
    });
    if (!courseOwner) return new NextResponse("Unauthorized", { status: 401 });

    const { list } = await req.json();
    if (!Array.isArray(list)) {
      return new NextResponse("Invalid payload", { status: 400 });
    }

    for (const item of list) {
      await db.exercise.updateMany({
        where: { id: String(item.id), chapterId: params.chapterId },
        data: { position: Number(item.position) },
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[EXERCISES_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
