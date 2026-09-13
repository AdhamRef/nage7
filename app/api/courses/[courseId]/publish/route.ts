import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
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

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId
      },
      include: {
        chapters: {
            include: {
                videoData: true
            }
        }
      }
    });
    if(!course){
        return new NextResponse("Not found", { status: 404 });
    }

    const hasPublishedChapter = course.chapters.some((chapter) => chapter.isPublished)
    if (
      !course.title ||
      !course.description ||
      !course.imageUrl ||
      (!course.isFree && course.price === null) ||
      !hasPublishedChapter
    ) {
      return new NextResponse("Missing Required Fields", { status: 400 });
    }
    const publishedCourse = await db.course.update({
        where: {
            id: params.courseId,
            userId: userId
          },
          data: {
            isPublished: true
          }
    })

    return NextResponse.json(publishedCourse, { status: 200 });
  } catch (error) {
    console.log("[COURSE_ID_PUBLISH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
