"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircleIcon } from "lucide-react";

const bannerVariants = cva(
  "border text-center p-4 text-sm flex items-center w-full",
  {
    variants: {
      variant: {
        // Text and icon stay white, so the backgrounds are dark enough in both
        // themes to keep the contrast readable.
        warning: "bg-amber-600 dark:bg-amber-700 border-amber-700/40 text-white",
        success: "bg-emerald-700 dark:bg-emerald-800 border-emerald-800/40 text-white",
      },
    },
    defaultVariants: {
      variant: "warning",
    },
  }
);

interface BannerProps extends VariantProps<typeof bannerVariants> {
  label: string;
}

const iconMap = {
    warning: AlertTriangle,
    success: CheckCircleIcon,
}

export const Banner: React.FC<BannerProps> = ({
  label,
  variant,
}: BannerProps) => {
    const Icon = iconMap[variant || "warning"]
  return (
    <div className={cn(bannerVariants({ variant }))}>
        <Icon className="h-4 w-4 ml-2" />
        {label}
    </div>
  );
};
