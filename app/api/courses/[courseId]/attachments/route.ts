import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { url, name, publicId, resourceType } = await req.json();

    if (!url) {
      return new NextResponse("Missing attachment url", { status: 400 });
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

    const attachment = await db.attachment.create({
      data: {
        url,
        name: name || url.split("/").pop(),
        publicId: publicId ?? null,
        resourceType: resourceType ?? null,
        courseId: params.courseId,
      },
    });

    return NextResponse.json(attachment, { status: 200 });
  } catch (error) {
    console.log("[COURSE_ID_ATTACHMENTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
