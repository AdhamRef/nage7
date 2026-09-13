"use client";
import { BarChart, ClipboardCheck, BookOpen, Compass, Eye, Home, ShieldCheck, Layout, List, LogIn, Phone, User2 } from "lucide-react";
import React from "react";
import SidebarItem from "./sidebarItem";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type Props = {
};

const visitorRoutes = [
  {
    icon: Home,
    label: "الرأيسية",
    href: "/",
  },
  {
    icon: BookOpen,
    label: "الدروس",
    href: "/courses",
  },
  {
    icon: User2,
    label: "مدربين",
    href: "/instructors",
  },
  {
    icon: Eye,
    label: "مين إحنا",
    href: "/aboutus",
  },
  {
    icon: Phone,
    label: "كلّمنا",
    href: "/contact",
  },
  {
    icon: LogIn,
    label: "تسجيل",
    href: "/sign-in",
  },
];
const guestRoutes = [
  {
    icon: Layout,
    label: "لوحة المعلومات",
    href: "/dashboard",
  },
  {
    icon: Compass,
    label: "تصفح",
    href: "/courses",
  },
];
const teacherRoutes = [
  {
    icon: Layout,
    label: "لوحة التحكم",
    href: "/teacher",
    exact: true,
  },
  {
    icon: List,
    label: "الدروس",
    href: "/teacher/courses",
  },
  {
    icon: User2,
    label: "الطلاب",
    href: "/teacher/students",
  },
  {
    icon: ShieldCheck,
    label: "فتح الدروس",
    href: "/teacher/access",
  },
  {
    icon: ClipboardCheck,
    label: "الدرجات",
    href: "/teacher/results",
  },
  {
    icon: BarChart,
    label: "الإحصاءات",
    href: "/teacher/analytics",
  },
];
const SidebarRoutes = (props: Props) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  let routes = null;
  if (!userId) {
    routes = visitorRoutes;
  } else {
    const isTeacherPage = pathname?.includes("/teacher");
    routes = isTeacherPage ? teacherRoutes : guestRoutes;
  }

  return (
    <div className=" flex flex-col w-full">
      {routes.map((route) => (
        <SidebarItem
          key={route.href}
          icon={route.icon}
          label={route.label}
          href={route.href}
          exact={"exact" in route ? Boolean(route.exact) : false}
        />
      ))}
    </div>
  );
};

export default SidebarRoutes;
