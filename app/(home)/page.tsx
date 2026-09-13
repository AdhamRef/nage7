import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import CoursesList from "@/components/courses-list";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import CourseAnatomy from "./_components/course-anatomy";
import Faq from "./_components/faq";
import FeatureGrid from "./_components/feature-grid";
import FreeVsHere from "./_components/free-vs-here";
import Hero from "./_components/hero";
import HowItWorks from "./_components/how-it-works";

export default async function Home() {
  const { userId } = await auth();

  // Signed-in visitors go to the catalogue rather than the sales page.
  if (userId) {
    return redirect("/courses");
  }

  const [courses, lessons, exercises] = await Promise.all([
    db.course.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        chapters: {
          where: { isPublished: true },
          include: { videoData: { select: { duration: true } } },
        },
      },
    }),
    db.chapter.count({
      where: { isPublished: true, course: { isPublished: true } },
    }),
    db.exercise.count({
      where: { isPublished: true, chapter: { isPublished: true } },
    }),
  ]);

  const catalogue = courses.map((item) => ({
    ...item,
    progress: null,
    hasAccess: item.isFree,
    imageUrl: item.imageUrl || "",
    durationSeconds: item.chapters.reduce(
      (total, chapter) => total + (chapter.videoData?.duration ?? 0),
      0
    ),
  }));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Hero
        courses={courses.length}
        lessons={lessons}
        exercises={exercises}
      />

      {/* The product first: what a course here actually is. */}
      <CourseAnatomy />

      <FeatureGrid />

      <HowItWorks />

      {catalogue.length > 0 && (
        <section
          id="courses"
          className="scroll-mt-24 bg-white py-24 dark:bg-white/[0.03]"
        >
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-black leading-snug md:text-4xl">
                الدروس المتاحة
              </h2>
              <p className="mt-4 text-lg leading-9 text-muted-foreground">
                منهج برمجة ٢ بالترتيب — ابدأ من الأول، أو من الوحدة اللي واقفة
                معاك.
              </p>
            </div>

            <CoursesList items={catalogue} />
          </div>
        </section>
      )}

      {/* The objection, once the pitch has already been made. */}
      <FreeVsHere />

      <Faq />

      {/* Closing argument */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-deep to-brand-teal py-24 text-white">
        <div
          aria-hidden
          className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        />
        <div className="container relative mx-auto px-6 text-center">
          <h2 className="mx-auto max-w-3xl text-3xl font-black leading-snug md:text-5xl">
            البرمجة في جيبك، من غير ما تخرج من البيت.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-9 text-white/85">
            برمجة ٢ للبكالوريا، درس ورا درس، وأنا معاك لحد الامتحان. ابدأ
            النهاردة — الدروس الأولى مفتوحة ليك مجاناً.
          </p>

          <Link
            href="/sign-up"
            className="mt-10 inline-flex items-center gap-x-2 rounded-lg bg-white px-9 py-4 text-base font-bold text-brand-deep shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
          >
            اعمل حسابك المجاني
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <p className="mt-5 text-sm text-white/70">
            عندك حساب بالفعل؟{" "}
            <Link href="/sign-in" className="font-bold underline">
              ادخل من هنا
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
