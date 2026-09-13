import { hasGrantedAccess } from "@/lib/course-access";
import { db } from "@/lib/db";

interface GetChapterExercisesProps {
  userId: string;
  courseId: string;
  chapterId: string;
}

/** A chapter's published exercises, behind the same lock as the lesson. */
const getChapterExercises = async ({
  userId,
  courseId,
  chapterId,
}: GetChapterExercisesProps) => {
  try {
    const [course, chapter, access] = await Promise.all([
      db.course.findUnique({
        where: { id: courseId, isPublished: true },
        select: { id: true, isFree: true },
      }),
      db.chapter.findUnique({
        where: { id: chapterId, isPublished: true },
        select: {
          id: true,
          title: true,
          isFree: true,
          courseId: true,
          position: true,
        },
      }),
      hasGrantedAccess(userId, courseId),
    ]);

    if (!course || !chapter || chapter.courseId !== courseId) {
      return {
        chapter: null,
        exercises: [],
        locked: false,
        nextChapter: null,
        solvedIds: [],
      };
    }

    const hasAccess = course.isFree || Boolean(access);
    if (!hasAccess && !chapter.isFree) {
      return {
        chapter,
        exercises: [],
        locked: true,
        nextChapter: null,
        solvedIds: [],
      };
    }

    // Where the student goes once the practice is done.
    const [exercises, nextChapter] = await Promise.all([
      db.exercise.findMany({
        where: { chapterId, isPublished: true },
        orderBy: { position: "asc" },
      }),
      db.chapter.findFirst({
        where: {
          courseId,
          isPublished: true,
          position: { gt: chapter.position },
        },
        orderBy: { position: "asc" },
        select: { id: true, title: true },
      }),
    ]);

    const done = await db.exerciseProgress.findMany({
      where: {
        userId,
        isCompleted: true,
        exerciseId: { in: exercises.map((exercise) => exercise.id) },
      },
      select: { exerciseId: true },
    });

    return {
      chapter,
      exercises,
      locked: false,
      nextChapter,
      solvedIds: done.map((row) => row.exerciseId),
    };
  } catch (error) {
    console.error("[GET_CHAPTER_EXERCISES]", error);
    return {
        chapter: null,
        exercises: [],
        locked: false,
        nextChapter: null,
        solvedIds: [],
      };
  }
};

export default getChapterExercises;
