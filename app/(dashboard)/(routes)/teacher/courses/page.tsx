import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import { columns } from "./_components/columns";
import { DataTable } from "./_components/data-table";

type Props = {};

const Courses = async (props: Props) => {
  const { userId } = await auth();
  if (!userId) {
    return redirect("/sign-in");
  }

  const rows = await db.course.findMany({
    where: {
      userId,
    },
    include: {
      _count: { select: { chapters: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const courses = rows.map(({ _count, ...course }) => ({
    ...course,
    chaptersCount: _count.chapters,
  }));

  return (
    <div className=" p-6">
      <DataTable columns={columns} data={courses} />
    </div>
  );
};

export default Courses;
