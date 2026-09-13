import { ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import getTeacherStudents from "@/actions/get-teacher-students";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import StudentsTable from "./_components/students-table";

const StudentsPage = async () => {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const [students, courses] = await Promise.all([
    getTeacherStudents(userId),
    db.course.findMany({
      where: { userId },
      select: { id: true, title: true, isFree: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalPaid = students.reduce((sum, student) => sum + student.totalPaid, 0);
  const active = students.filter((student) => student.enrollments.length).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-x-2 text-2xl font-bold">
          <Users className="h-6 w-6" />
          الطلاب
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {students.length} حساب مسجل · {active} بدأوا المشاهدة · إجمالي {totalPaid} جنية
        </p>
      </div>

      <Link
        href="/teacher/access"
        className="flex items-center gap-x-3 rounded-xl border bg-white p-4 transition hover:border-brand/50 dark:border-slate-800 dark:bg-slate-950"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">فتح الدروس لطالب</span>
          <span className="block text-xs text-muted-foreground">
            افتح أي درس أو مجموعة دروس لأي طالب من صفحة واحدة.
          </span>
        </span>
        <span className="shrink-0 text-brand">←</span>
      </Link>

      {students.length === 0 ? (
        <div className="rounded-xl border p-12 text-center dark:border-slate-800">
          <Users className="mx-auto mb-4 h-10 w-10 text-slate-400" />
          <p className="font-medium">لسه مفيش حسابات مسجّلة</p>
          <p className="mt-1 text-sm text-muted-foreground">
            كل من ينشئ حساباً على المنصة هيظهر هنا، ومعاه الدروس اللي فتحها أو
            شاهدها.
          </p>
        </div>
      ) : (
        <StudentsTable students={students} courses={courses} />
      )}
    </div>
  );
};

export default StudentsPage;
