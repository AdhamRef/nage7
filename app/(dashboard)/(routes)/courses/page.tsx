import { BookOpen, Sparkles } from "lucide-react";
import React from "react";

import getCourses from "@/actions/get-courses";
import BrandGlow from "@/components/brand-glow";
import CoursesList from "@/components/courses-list";
import SearchInput from "@/components/search-input";
import { requireCompleteProfile } from "@/lib/require-profile";

type SearchParams = {
  title: string;
};

type Props = {
  searchParams: SearchParams;
};

/** The catalogue. Every course is listed here, however many there are. */
const CoursesPage = async ({ searchParams }: Props) => {
  const { userId } = await requireCompleteProfile();

  const courses = await getCourses({
    userId,
    ...searchParams,
  });

  const enrolled = courses.filter((course) => course.progress !== null).length;
  const isSearching = Boolean(searchParams.title);

  return (
    <div className="relative min-h-full">
      <BrandGlow />

      <div className="relative space-y-8 p-6">
        {/* Header */}
        <header>

          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            <span className="bg-gradient-to-tr from-slate-700 to-slate-700 bg-clip-text text-transparent dark:from-brand dark:to-brand-teal">
              الدروس
            </span>
          </h1>
          <span className="mt-3 block h-1 w-20 rounded-full bg-gradient-to-r from-slate-600 to-slate-600 dark:from-brand dark:to-brand-teal" />

          <div className="mt-6 max-w-md md:hidden">
            <SearchInput />
          </div>
        </header>

        {/* Grid */}
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-14 text-center dark:border-white/10">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/15 to-brand-teal/15">
              <BookOpen className="h-7 w-7 text-brand" />
            </span>
            <p className="font-bold">
              {isSearching ? "مفيش نتايج مطابقة" : "مفيش دروس متاحة دلوقتي"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isSearching
                ? "جرب كلمة بحث مختلفة."
                : "بنجهّز المحتوى دلوقتي، وهيظهر هنا أول ما يتنشر."}
            </p>
          </div>
        ) : (
          <CoursesList items={courses} />
        )}
      </div>
    </div>
  );
};

export default CoursesPage;
