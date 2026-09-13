import getProgress from "@/actions/get-progress";
import { requireCompleteProfile } from "@/lib/require-profile";
import { hasGrantedAccess } from "@/lib/course-access";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CourseSidebar from "../_components/course-sidebar";
import CourseNavbar from "../_components/course-navbar";

const CourseLayout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { courseId: string };
}) => {
  const { userId } = await requireCompleteProfile();

  try {
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
      },
      include: {
        chapters: {
          where: {
            isPublished: true,
          },
          include: {
            userProgress: {
              where: {
                userId,
              },
            },
            exercises: {
              where: { isPublished: true },
              select: {
                id: true,
                userProgress: {
                  where: { userId },
                  select: { isCompleted: true },
                },
              },
            },
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return redirect("/sign-in");
    }

    // One course-level unlock decides every part.
    const hasAccess =
      course.isFree || (await hasGrantedAccess(userId, params.courseId));

    const progressCount = await getProgress(userId, course.id);

    return (
      <div className="h-full">
        <div className="h-[80px] md:pr-80 fixed inset-y-0 w-full z-50">
            <CourseNavbar course={course} progressCount={progressCount} hasAccess={hasAccess} />
        </div>
        <div className="hidden md:flex h-full w-80 flex-col fixed inset-y-0 z-50">
          <CourseSidebar course={course} progressCount={progressCount} hasAccess={hasAccess} />
        </div>
        <main className="md:pr-80 h-full pt-[80px]">{children}</main>
      </div>
    );
  } catch (error) {
    console.error("Error fetching course:", error);
    return redirect("/sign-in");
  }
};

export default CourseLayout;
