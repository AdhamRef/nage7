import {
  BarChart3,
  CircleDollarSign,
  GraduationCap,
  ShieldCheck,
  Percent,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import getTeacherDashboard from "@/actions/get-teacher-dashboard";
import { auth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  AccessChart,
  CourseRevenueChart,
  EnrollmentsChart,
  RevenueChart,
} from "../_components/charts";
import StatCard from "../_components/stat-card";

const Analytics = async () => {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const data = await getTeacherDashboard(userId);

  // "This month" vs "last month", for a direction of travel.
  const thisMonth = data.months[data.months.length - 1];
  const lastMonth = data.months[data.months.length - 2];
  const delta =
    lastMonth && lastMonth.revenue > 0
      ? Math.round(
          ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100
        )
      : null;

  const averagePerStudent = data.totalStudents
    ? Math.round(data.totalRevenue / data.totalStudents)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-x-2 text-2xl font-bold">
          <BarChart3 className="h-6 w-6" />
          الإحصاءات
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أداء درساتك خلال آخر 12 شهراً
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={CircleDollarSign}
          tone="success"
          label="إجمالي الإيرادات"
          value={formatPrice(data.totalRevenue) ?? "0 جنية"}
        />
        <StatCard
          icon={CircleDollarSign}
          label="إيرادات الشهر ده"
          value={formatPrice(thisMonth?.revenue ?? 0) ?? "0 جنية"}
          hint={
            delta === null
              ? "لسه مفيش مقارنة"
              : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% عن الشهر الماضي`
          }
        />
        <StatCard
          icon={Users}
          tone="sky"
          label="الطلاب"
          value={data.totalStudents}
          hint={`${data.totalEnrollments} عملية فتح`}
        />
        <StatCard
          icon={GraduationCap}
          label="متوسط الإنجاز"
          value={`${data.averageCompletion}%`}
        />
        <StatCard
          icon={Percent}
          label="متوسط الدخل للطالب"
          value={`${averagePerStudent} جنية`}
        />
        <StatCard
          icon={ShieldCheck}
          tone="amber"
          label="دروس مفتوحة يدوياً"
          value={data.grantedAccess}
          hint={`${data.studentsWithAccess} طالب`}
        />
      </div>

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

      {/* Per-course detail */}
      <div className="overflow-hidden rounded-xl border dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-right dark:bg-slate-900">
              <tr className="border-b dark:border-slate-800">
                <th className="p-3 font-semibold">الدرس</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">الأجزاء</th>
                <th className="p-3 font-semibold">السعر</th>
                <th className="p-3 font-semibold">الطلاب</th>
                <th className="p-3 font-semibold">الإيرادات</th>
                <th className="p-3 font-semibold">متوسط الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              {data.courses.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-muted-foreground">
                    لسه مفيش دروس
                  </td>
                </tr>
              )}
              {data.courses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <td className="p-3 font-medium">{course.title}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
                        course.isPublished
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {course.isPublished ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="p-3 tabular-nums text-muted-foreground">
                    {course.publishedChapters} / {course.chapters}
                  </td>
                  <td className="p-3 tabular-nums">
                    {formatPrice(course.price) ?? "—"}
                  </td>
                  <td className="p-3 tabular-nums">{course.students}</td>
                  <td className="p-3 font-semibold tabular-nums">
                    {course.revenue} جنية
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-x-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${Math.min(course.completion, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {course.completion}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
