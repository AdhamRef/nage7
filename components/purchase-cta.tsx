"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import PurchaseDialog, {
  type PurchaseDialogProps,
} from "@/components/purchase-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = Omit<PurchaseDialogProps, "open" | "onOpenChange"> & {
  className?: string;
};

/** The «أحصل علي الحصة» button and the popup it opens. */
export const PurchaseCta = ({ className, ...dialog }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="brand"
        size="lg"
        onClick={() => setOpen(true)}
        className={cn("w-full gap-x-2 text-base", className)}
      >
        <Sparkles className="h-4 w-4" />
        أحصل على الحصة
      </Button>

      <PurchaseDialog open={open} onOpenChange={setOpen} {...dialog} />
    </>
  );
};

export default PurchaseCta;
