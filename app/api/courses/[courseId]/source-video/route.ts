import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { buildVideoUrls, destroyAsset } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { parseYoutubeId, youtubeThumbnail } from "@/lib/youtube";

const authorize = async (courseId: string) => {
  const { userId } = await auth();
  if (!userId) return null;
  return db.course.findFirst({ where: { id: courseId, userId } });
};

/**
 * Stores the one long recording a course's parts can be sliced out of. The
 * per-part upload still works — this is the alternative for teachers who
 * record a whole session in one go.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await authorize(params.courseId);
    if (!course) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();

    // --- YouTube: nothing to upload, just remember the id -----------------
    if (body.youtubeUrl !== undefined) {
      const youtubeId = parseYoutubeId(String(body.youtubeUrl ?? ""));
      if (!youtubeId) {
        return NextResponse.json({ error: "لينك يوتيوب مش صحيح" }, { status: 400 });
      }

      // Switching to YouTube retires whatever was uploaded before.
      if (course.sourceVideoPublicId) {
        await destroyAsset(course.sourceVideoPublicId, "video");
      }

      await db.course.update({
        where: { id: course.id },
        data: {
          sourceYoutubeId: youtubeId,
          sourceVideoUrl: null,
          sourceVideoPublicId: null,
          sourceVideoHlsUrl: null,
          sourceVideoThumb: youtubeThumbnail(youtubeId),
          sourceVideoDuration: null,
        },
      });

      return NextResponse.json({ sourceYoutubeId: youtubeId });
    }

    // --- Cloudinary upload --------------------------------------------------
    const url = String(body.videoUrl ?? "").trim();
    const publicId = String(body.videoPublicId ?? "").trim();

    if (!url || !publicId) {
      return NextResponse.json({ error: "الفيديو مطلوب" }, { status: 400 });
    }

    // Replacing the recording should not leave the old one on Cloudinary.
    if (course.sourceVideoPublicId && course.sourceVideoPublicId !== publicId) {
      await destroyAsset(course.sourceVideoPublicId, "video");
    }

    const { hlsUrl, playbackUrl, thumbnailUrl } = buildVideoUrls(publicId, url);
    const duration = Number(body.videoDuration);

    const updated = await db.course.update({
      where: { id: course.id },
      data: {
        sourceVideoUrl: playbackUrl,
        sourceVideoPublicId: publicId,
        sourceVideoHlsUrl: hlsUrl,
        sourceVideoThumb: thumbnailUrl,
        sourceVideoDuration: Number.isFinite(duration) ? duration : null,
        // An upload replaces a YouTube source.
        sourceYoutubeId: null,
      },
      select: { sourceVideoUrl: true, sourceVideoDuration: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[COURSE_SOURCE_VIDEO_POST]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

/** Drops the recording. Parts that were slices of it stop having video. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const course = await authorize(params.courseId);
    if (!course) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    if (course.sourceVideoPublicId) {
      await destroyAsset(course.sourceVideoPublicId, "video");
    }

    await db.course.update({
      where: { id: course.id },
      data: {
        sourceVideoUrl: null,
        sourceVideoPublicId: null,
        sourceVideoHlsUrl: null,
        sourceVideoThumb: null,
        sourceVideoDuration: null,
        sourceYoutubeId: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[COURSE_SOURCE_VIDEO_DELETE]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
