"use client";

import { LogIn, LogOut } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import Logo from "@/components/logo";
import { UserMenu } from "@/components/user-menu";

import { ModeToggle } from "./mode-toggle";
import SearchInput from "./search-input";
import { Button } from "./ui/button";

type Props = {
};

const NavbarRoutes: React.FC<Props> = () => {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const pathname = usePathname();

  const isTeacherPage = pathname?.startsWith("/teacher");
  // A specific course, not the catalogue.
  const isCoursePage = pathname?.startsWith("/courses/");
  const isCatalogue = pathname === "/courses";

  return (
    <>
      {isCatalogue && (
        <div className="hidden md:block">
          <SearchInput />
        </div>
      )}
      <div className="w-auto md:w-full flex justify-between align-center">
        {/* The mark stays put; only the marketing links depend on sign-in. */}

        {!userId && (
          <>
            <div className="hidden md:flex gap-x-10 items-center mr-20">
            <Link className=" font-semibold  text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white" href="/">
              الرئيسية
            </Link>
            <Link className=" font-semibold  text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white" href="/courses">
              الدروس
            </Link>
            <Link className=" font-semibold  text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white" href="/instructors">
              مدربين
            </Link>
            <Link className=" font-semibold  text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white" href="/aboutus">
              مين إحنا
            </Link>

            </div>
          </>
        )}

        <div className="md:flex hidden items-center gap-x-2 mr-auto">
          {userId ? (
            <>
              {isTeacherPage || isCoursePage ? (
                <Link href="/">
                  <Button>
                    <LogOut className="h-4 w-4 ml-2" />
                    خروج
                  </Button>
                </Link>
              ) : (
                <Link href="/teacher/courses">
                  <Button size="sm" variant="ghost">
                    لوحة المدرّس
                  </Button>
                </Link>
              )}
            </>
          ) : null}
          <Button variant='outline' size='sm'>
          <Link className="text-slate-600 dark:text-gray-200 hover:text-slate-900 dark:hover:text-white" href="/contact">
              كلّمنا
            </Link>
          </Button>

          {status === "authenticated" ? (
            <UserMenu />
          ) : status === "unauthenticated" ? (
            <Link href="/sign-in">
              <Button className="flex gap-x-2" size="sm">
                تسجيل <LogIn className="w-4 h-4 rotate-180" />
              </Button>
            </Link>
          ) : null}

          <ModeToggle />
        </div>
      </div>
    </>
  );
};

export default NavbarRoutes;
