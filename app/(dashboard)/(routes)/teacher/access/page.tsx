import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import AccessTabs from "./_components/access-tabs";
import type { AccessStudent } from "./_components/access-manager";
import type { AccessGroup } from "./_components/groups-manager";

/** Who can open which of the teacher's courses — by cohort or one at a time. */
const AccessPage = async () => {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const courses = await db.course.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      price: true,
      isFree: true,
      isPublished: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const courseIds = courses.map((course) => course.id);

  const [users, accesses, groupRows] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        profile: { select: { fullName: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    courseIds.length
      ? db.courseAccess.findMany({
          where: { courseId: { in: courseIds } },
          select: { userId: true, courseId: true },
        })
      : Promise.resolve([]),
    db.accessGroup.findMany({
      where: { userId },
      include: {
        members: { select: { userId: true } },
        courses: { select: { courseId: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const grantedByUser = new Map<string, string[]>();
  for (const row of accesses) {
    grantedByUser.set(row.userId, [
      ...(grantedByUser.get(row.userId) ?? []),
      row.courseId,
    ]);
  }

  // What each student already gets through the cohorts they belong to.
  const groupCoursesByUser = new Map<string, Set<string>>();
  for (const group of groupRows) {
    for (const member of group.members) {
      const set = groupCoursesByUser.get(member.userId) ?? new Set<string>();
      for (const row of group.courses) set.add(row.courseId);
      groupCoursesByUser.set(member.userId, set);
    }
  }

  const students: AccessStudent[] = users.map((user) => ({
    userId: user.id,
    name: user.profile?.fullName ?? user.name ?? user.email ?? "مستخدم",
    email: user.email,
    phone: user.profile?.phone ?? null,
    courseIds: grantedByUser.get(user.id) ?? [],
    groupCourseIds: Array.from(groupCoursesByUser.get(user.id) ?? []),
  }));

  const groups: AccessGroup[] = groupRows.map((group) => ({
    id: group.id,
    name: group.name,
    note: group.note,
    price: group.price,
    courseIds: group.courses.map((row) => row.courseId),
    memberIds: group.members.map((row) => row.userId),
  }));

  const paidCourses = courses.filter((course) => !course.isFree).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-x-2 text-2xl font-bold">
          <ShieldCheck className="h-6 w-6" />
          فتح الدروس
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {students.length} حساب · {paidCourses} درس مدفوع · {groups.length}{" "}
          مجموعة — افتح درس لمجموعة كاملة أو لطالب لوحده.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border p-12 text-center dark:border-slate-800">
          <p className="font-medium">لسه مفيش حسابات مسجّلة</p>
        </div>
      ) : (
        <AccessTabs students={students} courses={courses} groups={groups} />
      )}
    </div>
  );
};

export default AccessPage;
