import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Records that a student opened this chapter, which is what makes them show up
 * as a student of the course. Deliberately never writes `isCompleted`, so it
 * can't undo a finished chapter.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const chapter = await db.chapter.findFirst({
      where: { id: params.chapterId, courseId: params.courseId, isPublished: true },
      select: { id: true },
    });
    if (!chapter) return new NextResponse("Not found", { status: 404 });

    await db.userProgress.upsert({
      where: { userId_chapterId: { userId, chapterId: params.chapterId } },
      create: { userId, chapterId: params.chapterId, isCompleted: false },
      // Touch the timestamp so "last activity" reflects the visit.
      update: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[CHAPTER_SEEN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
