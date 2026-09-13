import { IconBadge } from "@/components/icon-badge";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import React from "react";

type Props = {
  icon: LucideIcon;
  label: string;
  numberOfItems: number;
  variant?: "default" | "success";
};

const InfoCard = ({icon,label,numberOfItems,variant}: Props) => {
  return (
    <div className="border rounded-md flex items-center gap-x-2 p-3">
      <IconBadge variant={variant} icon={icon} />
      <div>
        <p className=" mr-2 font-medium">
            {label}
        </p>
        <p className=" mr-2 text-gray-500 text-sm">
            {numberOfItems} {numberOfItems === 1 ? "درس" : "درسات"}
        </p>
      </div>
    </div>
  );
};

export default InfoCard;
