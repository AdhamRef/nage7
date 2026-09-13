import React from "react";
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils";


type Props = {
    size?: "default" | "sm";
  variant?: "default" | "success";
  value: number;
};

const colorByVariant = {
    default: "text-sky-700",
    success: "text-emerald-700",
}
const sizeByVariant = {
    default: "text-sm",
    sm: "text-xs",
}

const CourseProgress: React.FC<Props> = ({ size, variant, value }) => {
  return <div>
    <Progress className="h-2" value={value} variant={variant} />
    <p className={cn('font-medium mt-2 text-sky-700 font-semibold',
        colorByVariant[variant || "default"],
        sizeByVariant[size || "default"],
    )}>
       أنهيت %{Math.round(value)}
    </p>
  </div>;
};

export default CourseProgress;
