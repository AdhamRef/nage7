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

/** Appends a new exercise to the chapter. */
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const access = await authorize(params.courseId, params.chapterId);
    if (access === "unauthorized") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    if (access === "not-found") {
      return NextResponse.json({ error: "الجزء غير موجود" }, { status: 404 });
    }

    const result = normalise(await req.json());
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const last = await db.exercise.findFirst({
      where: { chapterId: params.chapterId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const exercise = await db.exercise.create({
      data: {
        ...result.data,
        chapterId: params.chapterId,
        position: (last?.position ?? -1) + 1,
      },
    });

    return NextResponse.json(exercise, { status: 201 });
  } catch (error) {
    console.error("[EXERCISES_POST]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
