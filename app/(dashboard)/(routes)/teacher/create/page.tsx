import { redirect } from "next/navigation";
import React from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import CreateCourseForm from "./_components/create-course-form";

const CreatePage = async () => {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  const groups = await db.accessGroup.findMany({
    where: { userId },
    select: { id: true, name: true, _count: { select: { members: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col p-6 md:w-max md:items-center md:justify-center">
      <div>
        <h1 className="mb-2 text-3xl">سمّي درسك</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          عايز تسمّي الدرس إيه؟ متقلقش، تقدر تغيّره بعدين.
        </p>
      </div>

      <CreateCourseForm
        groups={groups.map((group) => ({
          id: group.id,
          name: group.name,
          memberCount: group._count.members,
        }))}
      />
    </div>
  );
};

export default CreatePage;
