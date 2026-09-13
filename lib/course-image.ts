/**
 * One shape for every course image.
 *
 * Instructors upload whatever they have; delivery is what gets standardised.
 * Each variant asks Cloudinary for a 16:9 crop at the width that surface
 * actually needs, with smart gravity so the subject survives the crop.
 * Non-Cloudinary URLs (or already-transformed ones) pass through untouched.
 */

export type CourseImageVariant =
  | "thumb"
  | "card"
  | "poster"
  | "hero"
  | "backdrop";

/** What to tell instructors to upload, and what the biggest surface needs. */
export const COURSE_IMAGE = {
  aspectRatio: "16:9",
  recommendedWidth: 1920,
  recommendedHeight: 1080,
  minWidth: 1280,
  minHeight: 720,
} as const;

/** Delivered pixel width per surface (already doubled for retina). */
/** The card is taller than the rest, so it asks for a taller crop. */
const variantAspect: Record<CourseImageVariant, string> = {
  thumb: "16:9",
  card: "16:9",
  poster: "4:3",
  hero: "16:9",
  backdrop: "16:9",
};

const variantWidths: Record<CourseImageVariant, number> = {
  thumb: 320, // chapter row fallback  (160 CSS px)
  card: 900, // course grid card      (3 per row on desktop)
  poster: 800, // full-bleed catalogue card (400 CSS px)
  hero: 1280, // landing-page hero     (640 CSS px)
  backdrop: 1920, // full-bleed course banner
};

/** `sizes` hint for next/image, matching how each surface is laid out. */
export const courseImageSizes: Record<CourseImageVariant, string> = {
  thumb: "160px",
  card: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  poster: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  hero: "(max-width: 1024px) 100vw, 640px",
  backdrop: "100vw",
};

const UPLOAD_MARKER = "/image/upload/";

export const courseImageUrl = (
  url: string | null | undefined,
  variant: CourseImageVariant = "card"
): string => {
  if (!url) return "";

  const markerIndex = url.indexOf(UPLOAD_MARKER);
  if (markerIndex === -1) return url; // not a Cloudinary image URL

  const insertAt = markerIndex + UPLOAD_MARKER.length;
  const rest = url.slice(insertAt);

  // Already carries a transformation — leave it alone rather than stacking one.
  if (/^[a-z]{1,3}_[^/]*\//.test(rest) && !/^v\d+\//.test(rest)) return url;

  const transformation = [
    "c_fill",
    "g_auto", // keep the subject in frame when cropping
    `ar_${variantAspect[variant]}`,
    `w_${variantWidths[variant]}`,
    "q_auto:good",
    "f_auto",
  ].join(",");

  return `${url.slice(0, insertAt)}${transformation}/${rest}`;
};
