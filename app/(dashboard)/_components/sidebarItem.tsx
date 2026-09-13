"use client";
import React from "react";
import { LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  href: string;
  exact?: boolean;
};

const SidebarItem: React.FC<Props> = ({ icon: Icon, label, href, exact }) => {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = exact
    ? pathname === href
    : (pathname === "/" && href === "/") ||
      pathname === href ||
      pathname?.startsWith(`${href}/`);

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-x-2 text-slate-500 dark:text-gray-400 text-sm font-[500] pr-6 transition-all hover:text-slate-600 dark:hover:text-gray-100 hover:bg-slate-300/20 dark:hover:bg-sky-200/10",
        isActive &&
          " text-emerald-700 dark:text-white bg-emerald-200/20 dark:bg-emerald-200/10 hover:bg-emerald-200/10 hover:emerald-emerald-700 dark:hover:text-white"
      )}
      onClick={() => {
        router.push(`${href}`);
      }}
    >
      <div className=" flex items-center gap-x-2 py-4">
        <Icon
          size={22}
          className={cn("text-slate-500 dark:text-gray-400", isActive && "text-emerald-700 dark:text-emerald-400")}
        />
        {label}
      </div>
      <div
        className={cn(
          "mr-auto opacity-0 border-2 border-emerald-600 h-full transition-all",
          isActive && "opacity-100"
        )}
      />
    </button>
  );
};

export default SidebarItem;
