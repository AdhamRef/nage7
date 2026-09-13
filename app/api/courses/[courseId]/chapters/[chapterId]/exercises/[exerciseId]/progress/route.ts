import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasGrantedAccess } from "@/lib/course-access";
import { db } from "@/lib/db";

/**
 * Records a submission. Every attempt is written, right or wrong — the teacher
 * needs the wrong ones to review an exam, and `isCompleted` only ever moves
 * from false to true so a later mistake cannot take away a solved mark.
 */
export async function PUT(
  req: Request,
  {
    params,
  }: { params: { courseId: string; chapterId: string; exerciseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const isCorrect = Boolean(body.isCompleted ?? body.isCorrect);

    // The exercise has to really belong to the chapter in the URL.
    const exercise = await db.exercise.findFirst({
      where: {
        id: params.exerciseId,
        chapterId: params.chapterId,
        chapter: { courseId: params.courseId, isPublished: true },
      },
      select: { id: true, type: true, chapter: { select: { isFree: true } } },
    });

    if (!exercise) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Same gate as the lesson: a free course, a free part, or granted access.
    const [course, access] = await Promise.all([
      db.course.findUnique({
        where: { id: params.courseId },
        select: { isFree: true },
      }),
      hasGrantedAccess(userId, params.courseId),
    ]);

    const hasAccess =
      Boolean(course?.isFree) || Boolean(access) || exercise.chapter.isFree;

    if (!hasAccess) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const choice = Number(body.choiceIndex);
    const answer = {
      choiceIndex:
        exercise.type === "MCQ" && Number.isInteger(choice) ? choice : null,
      code: typeof body.code === "string" ? body.code.slice(0, 20000) : null,
      isCorrect,
      answeredAt: new Date(),
    };

    const existing = await db.exerciseProgress.findUnique({
      where: { userId_exerciseId: { userId, exerciseId: params.exerciseId } },
      select: { id: true, attempts: true, isCompleted: true },
    });

    const progress = existing
      ? await db.exerciseProgress.update({
          where: { id: existing.id },
          data: {
            ...answer,
            attempts: existing.attempts + 1,
            // Once solved, always solved.
            isCompleted: existing.isCompleted || isCorrect,
          },
        })
      : await db.exerciseProgress.create({
          data: {
            userId,
            exerciseId: params.exerciseId,
            ...answer,
            attempts: 1,
            isCompleted: isCorrect,
          },
        });

    return NextResponse.json(progress, { status: 200 });
  } catch (error) {
    console.log("[EXERCISE_PROGRESS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
