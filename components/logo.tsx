import Image from "next/image";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";

/** The artwork is 2158×751, so the height drives the box and width follows. */
const LOGO_RATIO = 2158 / 751;

type Props = {
  /** Rendered height in px. */
  height?: number;
  /** Where the mark links to; pass null to render it as plain artwork. */
  href?: string | null;
  priority?: boolean;
  className?: string;
};

/** The ناجح wordmark, used in every navigation surface. */
const Logo = ({
  height = 36,
  href = "/",
  priority = false,
  className,
}: Props) => {
  const image = (
    <Image
      src="/logo.webp"
      alt="ناجح"
      width={Math.round(height * LOGO_RATIO)}
      height={height}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} aria-label="ناجح — الصفحة الرئيسية" className="shrink-0">
      {image}
    </Link>
  );
};

export default Logo;
