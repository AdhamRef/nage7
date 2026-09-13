/** Turns the rich-text course/chapter description into plain text for previews. */
export const stripHtml = (html?: string | null) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
};

export const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

/** "5:07" for a chapter, used next to each lesson in the curriculum. */
export const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return null;
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
};

/** "3 ساعات و 20 دقيقة" for the course-level stat tile. */
export const formatTotalDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  const hoursLabel =
    hours === 0 ? "" : hours === 1 ? "ساعة" : hours === 2 ? "ساعتان" : `${hours} ساعات`;
  const minutesLabel =
    minutes === 0 ? "" : minutes === 1 ? "دقيقة" : minutes === 2 ? "دقيقتان" : `${minutes} دقيقة`;

  if (hoursLabel && minutesLabel) return `${hoursLabel} و ${minutesLabel}`;
  return hoursLabel || minutesLabel;
};

/**
 * "12:30" or "1:02:30" -> seconds. Returns null for anything unparseable, so
 * a half-typed value never silently becomes 0.
 */
export const parseTimecode = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(":").map((part) => part.trim());
  if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;

  return parts.reduce((total, part) => total * 60 + Number(part), 0);
};

/** Seconds -> "12:30", the shape `parseTimecode` reads back. */
export const toTimecode = (seconds?: number | null) => {
  if (seconds === null || seconds === undefined || seconds < 0) return "";

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(secs)}`
    : `${minutes}:${pad(secs)}`;
};

export const formatPrice = (price?: number | null) => {
  if (price === null || price === undefined) return null;
  if (price === 0) return "مجاناً";
  return `${price} جنية`;
};
