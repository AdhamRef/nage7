import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

import { destroyAsset, destroyAssetByUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { courseId } = params;
    const values = await req.json();

    // Replacing the cover image should not orphan the previous one on Cloudinary.
    if (values.imageUrl || values.imagePublicId) {
      const current = await db.course.findUnique({
        where: { id: courseId, userId },
        select: { imageUrl: true, imagePublicId: true },
      });

      if (current?.imagePublicId && current.imagePublicId !== values.imagePublicId) {
        await destroyAsset(current.imagePublicId, "image");
      } else if (!current?.imagePublicId && current?.imageUrl !== values.imageUrl) {
        await destroyAssetByUrl(current?.imageUrl);
      }
    }

    const course = await db.course.update({
      where: {
        id: courseId,
        userId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.log("[COURSE_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the user is the owner of the course
    const courseOwner = await db.course.findFirst({
      where: {
        id: params.courseId,
        userId: userId,
      },
    });
    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the course with everything that has a Cloudinary asset behind it
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
      },
      include: {
        chapters: {
          include: {
            videoData: true,
          },
        },
        attachments: true,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Delete the Cloudinary assets for each chapter video
    for (const chapter of course.chapters) {
      if (chapter.videoData?.publicId) {
        await destroyAsset(chapter.videoData.publicId, "video");
      }
    }

    // ...the attachments...
    for (const attachment of course.attachments) {
      if (attachment.publicId) {
        await destroyAsset(attachment.publicId, attachment.resourceType);
      } else {
        await destroyAssetByUrl(attachment.url);
      }
    }

    // ...and the cover image.
    if (course.imagePublicId) {
      await destroyAsset(course.imagePublicId, "image");
    } else {
      await destroyAssetByUrl(course.imageUrl);
    }

    // Delete the course from the database
    const deletedCourse = await db.course.delete({
      where: {
        id: params.courseId,
      },
    });

    return NextResponse.json(deletedCourse);
  } catch (error) {
    console.error("[COURSE_ID_DELETE]", error);
    return new NextResponse("Error deleting course", { status: 500 });
  }
}
