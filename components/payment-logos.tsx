import Image from "next/image";
import React from "react";

/**
 * The wallet marks, from /public. Both are transparent PNG/WebP with dark
 * artwork, so they are rendered on a white tile to stay legible in dark mode.
 */

const Tile = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 ring-1 ring-slate-200 dark:ring-slate-700">
    {children}
  </span>
);

export const VodafoneCashLogo = () => (
  <Tile>
    <Image
      src="/vodaphone.webp"
      alt="Vodafone Cash"
      width={28}
      height={28}
      className="h-7 w-7 object-contain"
    />
  </Tile>
);

export const InstapayLogo = () => (
  <Tile>
    {/* 327×206 lockup — the wordmark is part of the artwork. */}
    <Image
      src="/instapay.png"
      alt="InstaPay"
      width={44}
      height={28}
      className="h-7 w-auto object-contain"
    />
  </Tile>
);
