import { db } from "@/lib/db";
import React from "react";

type Props = {};

const getProgress = async (
  userId: string,
  courseId: string
): Promise<number> => {
  try {
    const publishedChapters = await db.chapter.findMany({
      where: {
        courseId: courseId,
        isPublished: true,
      },
      select: {
        id: true,
      },
    });
    const publishedChaptersIds = publishedChapters.map((chapter) => chapter.id);

    if (!publishedChaptersIds.length) {
      return 0;
    }

    const validCompletedChapters = await db.userProgress.count({
      where: {
        userId: userId,
        chapterId: {
          in: publishedChaptersIds,
        },
        isCompleted: true,
      },
    });
    const progressPrecentage =
      (validCompletedChapters / publishedChaptersIds.length) * 100;

    return progressPrecentage;
  } catch (error) {
    console.log("[GET_PROGRESS]", error);
    return 0;
  }
};

export default getProgress;
