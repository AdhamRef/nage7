import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
    });
    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "الجزء غير موجود" }, { status: 404 });
    }

    /**
     * What "ready" means depends on the kind. A lesson needs video from any
     * of its three sources — its own upload, its own YouTube link, or a slice
     * of the course recording. An assessment has no video; it needs at least
     * one published question instead. Both need a title; only a lesson needs
     * the description, since a quiz is its questions.
     */
    const missing: string[] = [];
    if (!chapter.title) missing.push("العنوان");

    if (chapter.kind === "LESSON") {
      if (!chapter.description) missing.push("الوصف");
      const hasVideo =
        Boolean(chapter.videoUrl) ||
        Boolean(chapter.youtubeId) ||
        chapter.startSeconds !== null;
      if (!hasVideo) missing.push("الفيديو");
    } else {
      const questions = await db.exercise.count({
        where: { chapterId: chapter.id, isPublished: true },
      });
      if (questions === 0) missing.push("سؤال واحد على الأقل");
    }

    if (missing.length) {
      return NextResponse.json(
        { error: `ناقص: ${missing.join("، ")}` },
        { status: 400 }
      );
    }

    const publishedChapter = await db.chapter.update({
        where: {
            id: params.chapterId,
            courseId: params.courseId,
          },
          data: {
            isPublished: true
          }
    })

    return NextResponse.json(publishedChapter, { status: 200 });
  } catch (error) {
    console.log("[CHAPTER_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
