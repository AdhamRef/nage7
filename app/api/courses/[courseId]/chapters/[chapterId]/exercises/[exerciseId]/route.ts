import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  MCQ_CHOICES,
  isExerciseLanguage,
  isExerciseType,
  isQuizEditorTab,
  isQuizMatchMode,
} from "@/lib/quiz";

/** Confirms the signed-in user owns the course this chapter belongs to. */
const authorize = async (courseId: string, chapterId: string) => {
  const { userId } = await auth();
  if (!userId) return "unauthorized" as const;

  const courseOwner = await db.course.findFirst({
    where: { id: courseId, userId },
  });
  if (!courseOwner) return "unauthorized" as const;

  const chapter = await db.chapter.findUnique({
    where: { id: chapterId, courseId },
  });
  if (!chapter) return "not-found" as const;

  return "ok" as const;
};

/** Turns a request body into storable fields, or an error message. */
const normalise = (body: any) => {
  const type = body.type ?? "CODE";
  if (!isExerciseType(type)) return { error: "نوع التمرين غير صحيح" };

  const question = String(body.question ?? "").trim();
  if (!question) return { error: "نص السؤال مطلوب" };

  const shared = {
    type,
    question,
    hint: body.hint ? String(body.hint).trim() : null,
    isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
  };

  if (type === "MCQ") {
    const choices = Array.isArray(body.choices)
      ? body.choices.map((choice: unknown) => String(choice ?? "").trim())
      : [];

    if (choices.length !== MCQ_CHOICES || choices.some((c: string) => !c)) {
      return { error: `أدخل ${MCQ_CHOICES} إجابات كاملة` };
    }

    const correctIndex = Number(body.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= MCQ_CHOICES) {
      return { error: "اختر الإجابة الصحيحة" };
    }

    return {
      data: {
        ...shared,
        choices,
        correctIndex,
        explanation: body.explanation ? String(body.explanation).trim() : null,
        // Coding fields stay at their defaults for an MCQ.
        expectedOutput: "",
        language: "WEB" as const,
        starterPython: "",
        starterHtml: "",
        starterCss: "",
        starterJs: "",
      },
    };
  }

  const expectedOutput = String(body.expectedOutput ?? "").trim();
  if (!expectedOutput) return { error: "الناتج المتوقع مطلوب" };
  if (body.matchMode !== undefined && !isQuizMatchMode(body.matchMode)) {
    return { error: "طريقة التصحيح غير صحيحة" };
  }
  if (body.defaultTab !== undefined && !isQuizEditorTab(body.defaultTab)) {
    return { error: "التبويب الافتراضي غير صحيح" };
  }
  if (body.language !== undefined && !isExerciseLanguage(body.language)) {
    return { error: "لغة التمرين غير صحيحة" };
  }

  const language = body.language ?? "WEB";
  // Python is graded on what it prints, so the console is the only sane mode.
  const matchMode =
    language === "PYTHON" ? "CONSOLE" : (body.matchMode ?? "CONSOLE");

  return {
    data: {
      ...shared,
      expectedOutput,
      language,
      matchMode,
      caseSensitive: Boolean(body.caseSensitive),
      defaultTab: body.defaultTab ?? "JS",
      starterPython: String(body.starterPython ?? ""),
      starterHtml: String(body.starterHtml ?? ""),
      starterCss: String(body.starterCss ?? ""),
      starterJs: String(body.starterJs ?? ""),
      choices: [],
      correctIndex: null,
      explanation: null,
    },
  };
};

/** Replaces an exercise. */
export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: { courseId: string; chapterId: string; exerciseId: string } }
) {
  try {
    const access = await authorize(params.courseId, params.chapterId);
    if (access !== "ok") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const result = normalise(await req.json());
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const existing = await db.exercise.findFirst({
      where: { id: params.exerciseId, chapterId: params.chapterId },
    });
    if (!existing) {
      return NextResponse.json({ error: "التمرين غير موجود" }, { status: 404 });
    }

    const exercise = await db.exercise.update({
      where: { id: existing.id },
      data: result.data,
    });

    return NextResponse.json(exercise, { status: 200 });
  } catch (error) {
    console.error("[EXERCISE_PATCH]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: { params: { courseId: string; chapterId: string; exerciseId: string } }
) {
  try {
    const access = await authorize(params.courseId, params.chapterId);
    if (access !== "ok") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    await db.exercise.deleteMany({
      where: { id: params.exerciseId, chapterId: params.chapterId },
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    console.error("[EXERCISE_DELETE]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
