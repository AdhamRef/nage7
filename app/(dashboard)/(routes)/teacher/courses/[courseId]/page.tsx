import {
  CircleDollarSign,
  File,
  ShieldCheck,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Banner } from "@/components/banner";
import { IconBadge } from "@/components/icon-badge";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";

import AttachmentForm from "./_components/attachment-form";
import AccessGroupsForm from "./_components/access-groups-form";
import PriceForm from "./_components/price-form";
import SourceVideoForm from "./_components/source-video-form";
import ChaptersForm from "./_components/chapters-form";
import CourseActions from "./_components/course-actions";
import DescriptionForm from "./_components/description-form";
import ImageForm from "./_components/image-form";
import TitleForm from "./_components/title-form";

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint?: string;
}) => (
  <div className="rounded-lg border bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex items-center gap-x-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      {label}
    </div>
    <p className="mt-2 text-2xl font-bold">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const CourseIdPage = async ({ params }: { params: { courseId: string } }) => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  if (!ObjectId.isValid(params.courseId)) {
    return redirect("/teacher/courses");
  }

  const course = await db.course.findUnique({
    where: { id: params.courseId, userId },
    include: {
      chapters: {
        orderBy: { position: "asc" },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
      },
      groups: {
        select: { groupId: true },
      },
    },
  });

  if (!course) {
    return redirect("/teacher/courses");
  }

  // Cohorts the teacher can attach this course to.
  const accessGroups = await db.accessGroup.findMany({
    where: { userId },
    select: { id: true, name: true, _count: { select: { members: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Every student who unlocked this course.
  const accesses = await db.courseAccess.findMany({
    where: { courseId: course.id },
    select: { userId: true, paidPrice: true },
  });

  const publishedChapters = course.chapters.filter((c) => c.isPublished);
  const freeChapters = course.chapters.filter((c) => c.isFree);
  const revenue = accesses.reduce((sum, a) => sum + (a.paidPrice ?? 0), 0);
  const students = accesses.length;

  const requiredFields = [
    course.title,
    course.description,
    course.imageUrl,
    course.isFree || course.price !== null,
    publishedChapters.length > 0,
  ];
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${requiredFields.length})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!course.isPublished && (
        <Banner label="الدرس ده مش منشور، ومحدش هيقدر يشوفه" />
      )}
      {course.isPublished && (
        <Banner label="الدرس ده منشور وظاهر للكل دلوقتي" variant="success" />
      )}

      <div className="bg-white p-6 dark:bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <span className="text-sm text-muted-foreground">
              كمّل كل الخانات {completionText}
            </span>
          </div>
          <CourseActions
            disabled={!isComplete}
            courseId={params.courseId}
            isPublished={course.isPublished}
          />
        </div>

        {/* Dashboard */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={ListChecks}
            label="الأجزاء"
            value={`${publishedChapters.length} / ${course.chapters.length}`}
            hint={`${freeChapters.length} جزء مجاني للمعاينة`}
          />
          <StatCard
            icon={Users}
            label="الطلاب"
            value={students}
            hint="مفتوح لهم الدرس"
          />
          <StatCard
            icon={CircleDollarSign}
            label="الإيرادات"
            value={formatPrice(revenue) ?? "0 جنية"}
            hint={`سعر الدرس ${formatPrice(course.price) ?? "غير محدد"}`}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl font-semibold">تخصيص الدرس</h2>
              </div>
              <TitleForm initialData={course} courseId={course.id} />
              <DescriptionForm initialData={course} courseId={course.id} />
              <ImageForm initialData={course} courseId={course.id} />
            </div>

            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={CircleDollarSign} />
                <h2 className="text-xl">سعر الدرس</h2>
              </div>
              <PriceForm initialData={course} courseId={course.id} />

              <SourceVideoForm
                courseId={course.id}
                sourceVideoUrl={course.sourceVideoUrl}
                sourceVideoHlsUrl={course.sourceVideoHlsUrl}
                sourceVideoThumb={course.sourceVideoThumb}
                sourceVideoDuration={course.sourceVideoDuration}
                sourceYoutubeId={course.sourceYoutubeId}
                clipCount={
                  course.chapters.filter(
                    (chapter) => chapter.startSeconds !== null
                  ).length
                }
              />
              <AccessGroupsForm
                courseId={course.id}
                groups={accessGroups.map((group) => ({
                  id: group.id,
                  name: group.name,
                  memberCount: group._count.members,
                }))}
                selectedIds={course.groups.map((row) => row.groupId)}
              />
            </div>

            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={File} />
                <h2 className="text-xl">موارد و مرفقات</h2>
              </div>
              <AttachmentForm initialData={course} courseId={course.id} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={ListChecks} />
                <h2 className="text-xl">أجزاء الدرس</h2>
              </div>
              <ChaptersForm initialData={course} courseId={course.id} />
              <p className="mt-2 text-xs text-muted-foreground">
الأجزاء هي تقسيم الدرس فقط — الشراء يفتحها كلها.
              </p>
            </div>

            <div className="rounded-md border border-dashed p-6 text-sm">
              <p className="flex items-center gap-x-2 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                فتح الدرس للطلاب
              </p>
              <p className="mt-2 text-muted-foreground">
                افتح الدرس — أو مجموعة دروس — لأي طالب من صفحة فتح الدروس.
              </p>
              <Link
                href="/teacher/access"
                className="mt-3 inline-block font-semibold text-sky-700 hover:underline dark:text-sky-400"
              >
                فتح صفحة الصلاحيات ←
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseIdPage;
