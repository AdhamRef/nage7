"use client";

import { Layers, UserRound } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import AccessManager, {
  type AccessCourse,
  type AccessStudent,
} from "./access-manager";
import GroupsManager, { type AccessGroup } from "./groups-manager";

interface Props {
  students: AccessStudent[];
  courses: AccessCourse[];
  groups: AccessGroup[];
}

const TABS = [
  { id: "groups" as const, label: "المجموعات", icon: Layers },
  { id: "student" as const, label: "طالب بعينه", icon: UserRound },
];

/** Two ways to open a course: a whole cohort, or one student at a time. */
export const AccessTabs = ({ students, courses, groups }: Props) => {
  const [tab, setTab] = useState<"groups" | "student">("groups");

  return (
    <div className="space-y-5">
      <div className="flex w-fit gap-x-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex items-center gap-x-2 rounded-md px-4 py-2 text-sm font-semibold transition",
              tab === item.id
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "groups" ? (
        <GroupsManager groups={groups} students={students} courses={courses} />
      ) : (
        <AccessManager students={students} courses={courses} />
      )}
    </div>
  );
};

export default AccessTabs;
