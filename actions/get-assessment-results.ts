import { cache } from "react";

import { db } from "@/lib/db";

export interface ResultAnswer {
  exerciseId: string;
  question: string;
  type: "CODE" | "MCQ";
  /** The options, for a multiple-choice question. */
  choices: string[];
  correctIndex: number | null;
  /** What the teacher expects a coding answer to print. */
  expectedOutput: string;
  /** What the student submitted last. */
  choiceIndex: number | null;
  code: string | null;
  isCorrect: boolean;
  attempts: number;
  answeredAt: Date | null;
}

export interface StudentResult {
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  correct: number;
  total: number;
  /** 0–100. */
  score: number;
  answered: number;
  lastAnsweredAt: Date | null;
  answers: ResultAnswer[];
}

export interface AssessmentResults {
  chapterId: string;
  chapterTitle: string;
  kind: string;
  courseId: string;
  courseTitle: string;
  totalQuestions: number;
  students: StudentResult[];
}

/**
 * Every student's work on one assessment: their score, and the answer they
 * gave to each question so the teacher can mark it by eye.
 *
 * Only students who actually submitted something appear — an empty row would
 * be indistinguishable from a student who never opened it.
 */
const getAssessmentResults = cache(
  async (
    teacherId: string,
    chapterId: string
  ): Promise<AssessmentResults | null> => {
    try {
      const chapter = await db.chapter.findFirst({
        where: { id: chapterId, course: { userId: teacherId } },
        select: {
          id: true,
          title: true,
          kind: true,
          course: { select: { id: true, title: true } },
          exercises: {
            where: { isPublished: true },
            orderBy: { position: "asc" },
            select: {
              id: true,
              question: true,
              type: true,
              choices: true,
              correctIndex: true,
              expectedOutput: true,
            },
          },
        },
      });

      if (!chapter) return null;

      const exerciseIds = chapter.exercises.map((exercise) => exercise.id);
      const progress = exerciseIds.length
        ? await db.exerciseProgress.findMany({
            where: { exerciseId: { in: exerciseIds } },
          })
        : [];

      const userIds = Array.from(new Set(progress.map((row) => row.userId)));
      const users = userIds.length
        ? await db.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { fullName: true, phone: true } },
            },
          })
        : [];

      const userById = new Map(users.map((user) => [user.id, user]));
      const byUser = new Map<string, typeof progress>();
      for (const row of progress) {
        byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), row]);
      }

      const students: StudentResult[] = userIds.map((userId) => {
        const rows = byUser.get(userId) ?? [];
        const rowByExercise = new Map(rows.map((row) => [row.exerciseId, row]));

        const answers: ResultAnswer[] = chapter.exercises.map((exercise) => {
          const row = rowByExercise.get(exercise.id);

          return {
            exerciseId: exercise.id,
            question: exercise.question,
            type: exercise.type,
            choices: exercise.choices,
            correctIndex: exercise.correctIndex,
            expectedOutput: exercise.expectedOutput,
            choiceIndex: row?.choiceIndex ?? null,
            code: row?.code ?? null,
            // A solved question counts even if the last attempt was a retry.
            isCorrect: row?.isCompleted ?? false,
            attempts: row?.attempts ?? 0,
            answeredAt: row?.answeredAt ?? null,
          };
        });

        const correct = answers.filter((answer) => answer.isCorrect).length;
        const answered = answers.filter((answer) => answer.attempts > 0).length;
        const times = rows
          .map((row) => row.answeredAt)
          .filter(Boolean) as Date[];

        const user = userById.get(userId);

        return {
          userId,
          name:
            user?.profile?.fullName ?? user?.name ?? user?.email ?? "مستخدم",
          email: user?.email ?? null,
          phone: user?.profile?.phone ?? null,
          correct,
          total: chapter.exercises.length,
          score: chapter.exercises.length
            ? Math.round((correct / chapter.exercises.length) * 100)
            : 0,
          answered,
          lastAnsweredAt: times.length
            ? new Date(Math.max(...times.map((date) => date.getTime())))
            : null,
          answers,
        };
      });

      // Best first — that is the order a teacher scans a mark sheet in.
      students.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "ar"));

      return {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        kind: chapter.kind,
        courseId: chapter.course.id,
        courseTitle: chapter.course.title,
        totalQuestions: chapter.exercises.length,
        students,
      };
    } catch (error) {
      console.error("[GET_ASSESSMENT_RESULTS]", error);
      return null;
    }
  }
);

export default getAssessmentResults;
