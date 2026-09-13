/**
 * A part is either taught or tested. Assessments carry no video — the
 * questions are the whole content — so they can stand alone in a course.
 */
export type ChapterKind = "LESSON" | "QUIZ" | "EXAM";

export const CHAPTER_KINDS: ChapterKind[] = ["LESSON", "QUIZ", "EXAM"];

export const chapterKindLabels: Record<ChapterKind, string> = {
  LESSON: "درس",
  QUIZ: "كويز",
  EXAM: "امتحان",
};

export const chapterKindHints: Record<ChapterKind, string> = {
  LESSON: "فيديو شرح، وممكن تمارين بعده.",
  QUIZ: "أسئلة قصيرة من غير فيديو.",
  EXAM: "امتحان كامل من غير فيديو، بدرجة.",
};

/** True for the kinds whose content is questions rather than a recording. */
export const isAssessment = (kind: ChapterKind) => kind !== "LESSON";

export const isChapterKind = (value: unknown): value is ChapterKind =>
  typeof value === "string" && CHAPTER_KINDS.includes(value as ChapterKind);
