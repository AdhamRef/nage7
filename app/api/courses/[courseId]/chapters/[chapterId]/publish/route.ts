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
    const videoData = await db.videoData.findUnique({
      where: {
        chapterId: params.chapterId,
      },
    });
    if (
      !chapter ||
      !videoData ||
      !chapter.title ||
      !chapter.description ||
      (chapter.kind === "LESSON" &&
        !chapter.videoUrl &&
        chapter.startSeconds === null)
    ) {
      return new NextResponse("Missing Required Fields", { status: 400 });
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
