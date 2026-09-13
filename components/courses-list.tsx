import { Course } from "@prisma/client";
import React from "react";
import CourseCard from "./course-card";

type CoursesWithProgress = Course & {
  chapters: { id: string }[];
  progress: number | null;
  imageUrl: string;
  durationSeconds: number;
  hasAccess: boolean;
};

type Props = {
  items: CoursesWithProgress[];
};

const CoursesList: React.FC<Props> = ({ items }) => {
  return (
    <>
      {items && items.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="h-full">
              <CourseCard
                key={item.id}
                id={item.id}
                title={item.title}
                imageUrl={item.imageUrl}
                chaptersLength={item.chapters.length}
                durationSeconds={item.durationSeconds}
                price={item.price ?? 0}
                isFree={item.isFree}
                hasAccess={item.hasAccess}
                progress={item.progress}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground mt-10">
          مفيش دروس بتتابعها
        </div>
      )}
    </>
  );
};

export default CoursesList;
