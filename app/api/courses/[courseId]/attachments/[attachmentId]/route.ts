import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

import { destroyAsset, destroyAssetByUrl } from "@/lib/cloudinary";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; attachmentId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if the course exists and belongs to the authenticated user
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete the attachment
    const attachment = await db.attachment.delete({
      where: {
        id: params.attachmentId,
        courseId: params.courseId,
      },
    });

    // ...and the file behind it
    if (attachment.publicId) {
      await destroyAsset(attachment.publicId, attachment.resourceType);
    } else {
      await destroyAssetByUrl(attachment.url);
    }

    return NextResponse.json(attachment, { status: 200 });
  } catch (error) {
    console.error("[COURSE_ID_ATTACHMENTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
