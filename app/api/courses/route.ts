import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { title, groupIds } = await req.json();

    const course = await db.course.create({
      data: {
        userId,
        title,
      },
    });

    // Optional: open it for whole cohorts from the moment it exists.
    if (Array.isArray(groupIds) && groupIds.length) {
      const owned = await db.accessGroup.findMany({
        where: { userId, id: { in: groupIds.map((id: unknown) => String(id)) } },
        select: { id: true },
      });

      if (owned.length) {
        await db.courseAccessGroup.createMany({
          data: owned.map((group) => ({
            groupId: group.id,
            courseId: course.id,
          })),
        });
      }
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
