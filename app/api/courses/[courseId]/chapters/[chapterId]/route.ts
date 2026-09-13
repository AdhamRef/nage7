import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

import { buildVideoUrls, destroyAsset } from "@/lib/cloudinary";
import { isChapterKind } from "@/lib/chapter-kind";
import { parseYoutubeId } from "@/lib/youtube";
import { db } from "@/lib/db";

interface PatchRequest {
  isPublished?: boolean;
  videoUrl?: string;
  /** Cloudinary public id returned by the direct upload. */
  videoPublicId?: string;
  videoDuration?: number;
  kind?: string;
  /** A YouTube link for this part; an empty string removes it. */
  youtubeUrl?: string;
  /** Marks into the course's source recording, in seconds. */
  startSeconds?: number | null;
  endSeconds?: number | null;
  [key: string]: any;
}

/** Removes the chapter's video from Cloudinary and from the database. */
const removeExistingVideo = async (chapterId: string) => {
  const existing = await db.videoData.findUnique({ where: { chapterId } });
  if (!existing) return;

  await destroyAsset(existing.publicId, "video");
  await db.videoData.delete({ where: { id: existing.id } });
};

export async function DELETE(
  req: NextRequest,
  { params }: { params: { courseId: string; chapterId: string } }
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

    // Update the chapter in the database
    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    await removeExistingVideo(params.chapterId);

    const deletedChapter = await db.chapter.delete({
      where: {
        id: params.chapterId,
      },
    });

    const publishedChaptersInCourse = await db.chapter.findMany({
      where: {
        courseId: params.chapterId,
        isPublished: true,
      },
    });

    if (!publishedChaptersInCourse.length) {
      await db.course.update({
        where: {
          id: params.courseId,
        },
        data: {
          isPublished: false,
        },
      });
    }

    return NextResponse.json(deletedChapter)
  } catch (error) {
    console.error("[CHAPTER_ID_DELETE]", error);
    return new NextResponse("Error deleting chapter", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { courseId: string; chapterId: string } }
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

    // Parse the request body. The Cloudinary metadata is handled separately, so
    // it never leaks into the chapter's own columns.
    const {
      isPublished,
      videoPublicId,
      videoDuration,
      startSeconds,
      endSeconds,
      kind,
      youtubeUrl,
      ...values
    }: PatchRequest = await req.json();

    if (kind !== undefined && !isChapterKind(kind)) {
      return NextResponse.json({ error: "نوع الجزء غير صحيح" }, { status: 400 });
    }

    /**
     * A part gets its video one of two ways, never both: its own upload, or a
     * slice of the course recording. Whichever the teacher just chose wins,
     * and the other is cleared so playback is never ambiguous.
     */
    const timing: {
      startSeconds?: number | null;
      endSeconds?: number | null;
      youtubeId?: string | null;
    } = {};

    // A YouTube link is the part's own video, so it retires any upload —
    // but keeps the timestamps, which apply to it just the same.
    if (youtubeUrl !== undefined) {
      if (youtubeUrl === "" || youtubeUrl === null) {
        timing.youtubeId = null;
      } else {
        const youtubeId = parseYoutubeId(String(youtubeUrl));
        if (!youtubeId) {
          return NextResponse.json({ error: "لينك يوتيوب مش صحيح" }, { status: 400 });
        }
        timing.youtubeId = youtubeId;
        await removeExistingVideo(params.chapterId);
        values.videoUrl = null as unknown as string;
      }
    }

    if (startSeconds !== undefined || endSeconds !== undefined) {
      const from = startSeconds === null ? null : Number(startSeconds);
      const to = endSeconds === null ? null : Number(endSeconds);

      if (from !== null && (!Number.isFinite(from) || from < 0)) {
        return NextResponse.json({ error: "بداية غير صحيحة" }, { status: 400 });
      }
      if (to !== null && (!Number.isFinite(to) || to < 0)) {
        return NextResponse.json({ error: "نهاية غير صحيحة" }, { status: 400 });
      }
      if (from !== null && to !== null && to <= from) {
        return NextResponse.json(
          { error: "وقت النهاية لازم يكون بعد البداية" },
          { status: 400 }
        );
      }

      timing.startSeconds = from;
      timing.endSeconds = to;

      // Marks on the course recording replace the part's own file; marks
      // on the part's own YouTube video just narrow it.
      const ownYoutube =
        timing.youtubeId !== undefined
          ? timing.youtubeId
          : (
              await db.chapter.findUnique({
                where: { id: params.chapterId },
                select: { youtubeId: true },
              })
            )?.youtubeId;

      if (from !== null && !ownYoutube) {
        await removeExistingVideo(params.chapterId);
        values.videoUrl = null as unknown as string;
      }
    }

    // A fresh upload replaces any clip marks and any YouTube link.
    if (videoPublicId && values.videoUrl) {
      timing.startSeconds = null;
      timing.endSeconds = null;
      timing.youtubeId = null;
    }

    // Update the chapter in the database
    const chapter = await db.chapter.update({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      data: {
        ...values,
        ...timing,
        ...(kind !== undefined ? { kind: kind as never } : {}),
      },
    });

    // Handle video changes
    if (videoPublicId && values.videoUrl) {
      await removeExistingVideo(params.chapterId);

      const { playbackUrl, hlsUrl, thumbnailUrl } = buildVideoUrls(
        videoPublicId,
        values.videoUrl
      );

      await db.videoData.create({
        data: {
          chapterId: params.chapterId,
          publicId: videoPublicId,
          playbackUrl,
          hlsUrl,
          thumbnailUrl,
          duration: videoDuration ?? null,
        },
      });
    }

    // Return the updated chapter
    return NextResponse.json(chapter, { status: 200 });
  } catch (error) {
    console.error("[CHAPTER_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
