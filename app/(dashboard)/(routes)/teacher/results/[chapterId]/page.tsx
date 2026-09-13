import { ChevronRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import getAssessmentResults from "@/actions/get-assessment-results";
import { auth } from "@/lib/auth";
import { chapterKindLabels, type ChapterKind } from "@/lib/chapter-kind";

import ResultsTable from "../_components/results-table";

/** One assessment's mark sheet, with every student's paper. */
const AssessmentResultsPage = async ({
  params,
}: {
  params: { chapterId: string };
}) => {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const results = await getAssessmentResults(userId, params.chapterId);
  if (!results) return redirect("/teacher/results");

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/teacher/results"
          className="inline-flex items-center gap-x-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5" />
          كل الدرجات
        </Link>

        <h1 className="mt-2 flex items-center gap-x-2 text-2xl font-bold">
          <ClipboardCheck className="h-6 w-6" />
          {results.chapterTitle}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {chapterKindLabels[results.kind as ChapterKind]} في «
          {results.courseTitle}» ·{" "}
          <Link
            href={`/teacher/courses/${results.courseId}/chapters/${results.chapterId}`}
            className="font-semibold text-sky-700 hover:underline dark:text-sky-400"
          >
            تعديل الأسئلة
          </Link>
        </p>
      </div>

      <ResultsTable
        students={results.students}
        totalQuestions={results.totalQuestions}
        title={results.chapterTitle}
      />
    </div>
  );
};

export default AssessmentResultsPage;
