"use client";

import { DEVICE_COOKIE, DEVICE_COOKIE_MAX_AGE, isDeviceId } from "@/lib/device";

/**
 * The browser half of the device binding. localStorage is the source of truth
 * because it survives cookie clearing; the cookie exists so the server can read
 * the id on a plain navigation.
 */

const writeCookie = (value: string) => {
  document.cookie = `${DEVICE_COOKIE}=${value}; path=/; max-age=${DEVICE_COOKIE_MAX_AGE}; SameSite=Lax`;
};

/** Reads this browser's id, minting one the first time. */
export const getDeviceId = () => {
  let stored: string | null = null;

  try {
    stored = window.localStorage.getItem(DEVICE_COOKIE);
  } catch {
    // Private mode or blocked storage: fall back to the cookie alone.
  }

  if (!isDeviceId(stored)) {
    const fromCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${DEVICE_COOKIE}=`))
      ?.split("=")[1];

    stored = isDeviceId(fromCookie) ? fromCookie : crypto.randomUUID();

    try {
      window.localStorage.setItem(DEVICE_COOKIE, stored);
    } catch {
      // Nothing to do — the cookie still carries it.
    }
  }

  writeCookie(stored);
  return stored;
};
