import { hasGrantedAccess } from "@/lib/course-access";
import { db } from "@/lib/db";
import { Attachment, Chapter, Course, Exercise } from "@prisma/client";

interface GetChapterProps {
  userId: string;
  courseId: string;
  chapterId: string;
}

const getChapter = async ({ userId, courseId, chapterId }: GetChapterProps) => {
  try {
    const access = await hasGrantedAccess(userId, courseId);

    const course = await db.course.findUnique({
      where: {
        id: courseId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        isFree: true,
        sourceVideoUrl: true,
        sourceVideoHlsUrl: true,
        sourceVideoThumb: true,
        sourceYoutubeId: true,
      },
    });

    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        isPublished: true,
      },
    });

    if (!chapter || !course) {
      throw new Error("Chapter or course not found");
    }

    let videoData = null;
    let exercises: Exercise[] = [];
    let attachments: Attachment[] = [];
    let nextChapter: Chapter | null = null;

    const hasAccess = course.isFree || Boolean(access);

    if (hasAccess || chapter.isFree) {
      videoData = await db.videoData.findUnique({
        where: {
          chapterId: chapterId,
        },
      });
      exercises = await db.exercise.findMany({
        where: { chapterId, isPublished: true },
        orderBy: { position: "asc" },
      });
      attachments = await db.attachment.findMany({
        where: {
          courseId,
        },
      });

      // Fetch the next chapter
      nextChapter = await db.chapter.findFirst({
        where: {
          courseId,
          isPublished: true,
          position: {
            gt: chapter.position,
          },
        },
        orderBy: {
          position: "asc",
        },
      });
    }

    const userProgress = await db.userProgress.findFirst({
      where: {
        userId,
        chapterId,
      },
    });

    /**
     * Two ways a part can have video: its own upload, or a slice of the one
     * long recording on the course. The upload always wins, so a part that was
     * given its own file keeps playing it.
     */
    const hasSource = Boolean(course.sourceVideoUrl || course.sourceYoutubeId);
    const isClip =
      !videoData &&
      !chapter.videoUrl &&
      hasSource &&
      chapter.startSeconds !== null;

    const playback = isClip
      ? {
          youtubeId: course.sourceYoutubeId,
          hlsUrl: course.sourceVideoHlsUrl,
          playbackUrl: course.sourceVideoUrl,
          originalUrl: course.sourceVideoUrl,
          thumbnailUrl: course.sourceVideoThumb,
          startSeconds: chapter.startSeconds,
          endSeconds: chapter.endSeconds,
        }
      : {
          youtubeId: null,
          hlsUrl: videoData?.hlsUrl ?? null,
          playbackUrl: videoData?.playbackUrl ?? null,
          originalUrl: chapter.videoUrl,
          thumbnailUrl: videoData?.thumbnailUrl ?? null,
          startSeconds: null,
          endSeconds: null,
        };

    return {
      chapter,
      course,
      videoData,
      playback,
      exercises,
      attachments,
      nextChapter,
      userProgress,
      access,
      hasAccess,
    };
  } catch (error) {
    console.error("[GET_CHAPTER]", error);
    return {
      chapter: null,
      course: null,
      videoData: null,
      playback: null,
      exercises: [],
      attachments: [],
      nextChapter: null,
      userProgress: null,
      access: null,
      hasAccess: false,
    };
  }
};

export default getChapter;
