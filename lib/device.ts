/**
 * One account, one device.
 *
 * Students were handing their credentials around so several people could watch
 * on one subscription. Every account is therefore pinned to the first device it
 * signs in from: the browser mints a random id, keeps it in localStorage and
 * mirrors it into a long-lived cookie, and the server refuses a sign-in whose
 * id does not match the one on file. Only a teacher can release the binding.
 *
 * Teachers are exempt — see `isTeacher`.
 */

export const DEVICE_COOKIE = "nage7_did";
/** Five years; the point is that it outlives the course. */
export const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 5;

/** Ids we mint are UUIDs; anything else is a forged or corrupted cookie. */
export const isDeviceId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/** "Chrome · Windows" — enough for the teacher to recognise a device. */
export const deviceLabelFrom = (userAgent?: string | null) => {
  if (!userAgent) return "جهاز غير معروف";

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "متصفح";

  const platform = /Android/i.test(userAgent)
    ? "Android"
    : /iPhone|iPad|iPod/i.test(userAgent)
      ? "iOS"
      : /Windows/i.test(userAgent)
        ? "Windows"
        : /Mac OS X/i.test(userAgent)
          ? "macOS"
          : /Linux/i.test(userAgent)
            ? "Linux"
            : "نظام غير معروف";

  return `${browser} · ${platform}`;
};

/** The `error` code NextAuth hands back when the device does not match. */
export const DEVICE_LOCKED_ERROR = "DeviceLocked";
