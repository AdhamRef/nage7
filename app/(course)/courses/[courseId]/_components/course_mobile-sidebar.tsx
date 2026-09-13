import React from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CourseSidebar from "./course-sidebar";
import { Chapter, Course, UserProgress } from "@prisma/client";

type CourseWithDetails = Course & {
  chapters: (Chapter & {
    userProgress: UserProgress[] | null;
    exercises: {
      id: string;
      userProgress: { isCompleted: boolean }[];
    }[];
  })[];
};

type CourseMobileSidebarProps = {
  course: CourseWithDetails | undefined;
  progressCount: number | null;
  hasAccess: boolean;
};

const CourseMobileSidebar: React.FC<CourseMobileSidebarProps> = ({
  course,
  progressCount,
  hasAccess,
}) => {
  return (
    <Sheet>
      <SheetTrigger className="md:hidden pl-4 hover:opacity-75 transition">
        <Menu />
      </SheetTrigger>
      <SheetContent side="right" className="p-0 bg-white w-72">
        <CourseSidebar course={course} progressCount={progressCount} hasAccess={hasAccess} />
      </SheetContent>
    </Sheet>
  );
};

export default CourseMobileSidebar;
