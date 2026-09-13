import React from 'react';
import { Chapter, Course, UserProgress } from '@prisma/client';
import NavbarRoutes from '@/components/navbarRoutes';
import CourseMobileSidebar from './course_mobile-sidebar';

type CourseWithDetails = Course & {
  chapters: (Chapter & {
    userProgress: UserProgress[] | null;
    exercises: {
      id: string;
      userProgress: { isCompleted: boolean }[];
    }[];
  })[];
};

type Props = {
  course: CourseWithDetails;
  progressCount: number;
  hasAccess: boolean;
};

const CourseNavbar: React.FC<Props> = ({ course, progressCount, hasAccess }) => {
  return (
    <div className="p-4 border-b h-full flex items-center justify-between shadow-sm z-50 backdrop-blur-md bg-white/85 dark:bg-background/85">
      <CourseMobileSidebar course={course} progressCount={progressCount} hasAccess={hasAccess} />
      <NavbarRoutes />
    </div>
  );
};

export default CourseNavbar;
