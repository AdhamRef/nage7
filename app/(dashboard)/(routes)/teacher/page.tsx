import {
  BookOpen,
  CircleDollarSign,
  ShieldCheck,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import getTeacherDashboard from "@/actions/get-teacher-dashboard";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  AccessChart,
  CourseRevenueChart,
  EnrollmentsChart,
  RevenueChart,
} from "./_components/charts";
import StatCard from "./_components/stat-card";

const dateFormat = new Intl.DateTimeFormat("ar-EG", {
  month: "short",
  day: "numeric",
});

const TeacherHome = async () => {
  const { userId, user } = await auth();
  if (!userId) return redirect("/sign-in");

  const data = await getTeacherDashboard(userId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            أهلاً {user?.name?.split(" ")[0] ?? "بك"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            نظرة عامة على درساتك وطلابك
          </p>
        </div>
        <div className="flex items-center gap-x-2">
          <Link href="/teacher/access">
            <Button variant="outline" size="sm">
              <ShieldCheck className="ml-2 h-4 w-4" />
              فتح دروس لطالب
            </Button>
          </Link>
          <Link href="/teacher/create">
            <Button size="sm">
              <Plus className="ml-2 h-4 w-4" />
              درس جديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CircleDollarSign}
          tone="success"
          label="إجمالي الإيرادات"
          value={formatPrice(data.totalRevenue) ?? "0 جنية"}
          hint={`${data.totalEnrollments} عملية فتح`}
        />
        <StatCard
          icon={Users}
          tone="sky"
          label="الطلاب"
          value={data.totalStudents}
          hint={`متوسط الإنجاز ${data.averageCompletion}%`}
        />
        <StatCard
          icon={BookOpen}
          label="الدروس"
          value={`${data.publishedCourses} / ${data.totalCourses}`}
          hint="منشور من الإجمالي"
        />
        <StatCard
          icon={ShieldCheck}
          tone="amber"
          label="دروس مفتوحة يدوياً"
          value={data.grantedAccess}
          hint={`${data.studentsWithAccess} طالب`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RevenueChart data={data.months} />
        <EnrollmentsChart data={data.months} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CourseRevenueChart data={data.courses} />
        </div>
        <AccessChart
          granted={data.grantedAccess}
          free={Math.max(data.totalEnrollments - data.grantedAccess, 0)}
        />
      </div>

      {/* Courses + recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">درساتك</h3>
            <Link
              href="/teacher/courses"
              className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-400"
            >
              عرض الكل
            </Link>
          </div>

          {data.courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لم تنشئ أي درس بعد.
            </p>
          ) : (
            <div className="space-y-2">
              {data.courses.slice(0, 6).map((course) => (
                <Link
                  key={course.id}
                  href={`/teacher/courses/${course.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {course.title}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-bold",
                      course.isPublished
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {course.isPublished ? "منشور" : "مسودة"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {course.publishedChapters}/{course.chapters} جزء
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {course.students} طالب
                  </span>
                  <span className="text-xs text-muted-foreground">
                    إنجاز {course.completion}%
                  </span>
                  <span className="whitespace-nowrap text-sm font-semibold tabular-nums">
                    {course.revenue} جنية
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-x-2 font-semibold">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              أحدث الاشتراكات
            </h3>
            <Link
              href="/teacher/students"
              className="text-xs font-semibold text-sky-700 hover:underline dark:text-sky-400"
            >
              كل الطلاب
            </Link>
          </div>

          {data.recentEnrollments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              لسه مفيش اشتراكات.
            </p>
          ) : (
            <div className="space-y-3">
              {data.recentEnrollments.map((row, index) => (
                <div
                  key={`${row.userId}-${index}`}
                  className="flex items-center gap-x-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                    {row.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {row.courseTitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-left">
                    <p className="text-sm font-semibold tabular-nums">
                      {row.paidPrice}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dateFormat.format(new Date(row.at))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;
