interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

const MARKER = "/image/upload/";

/** A Cloudinary path segment is a transformation, not a version or a folder. */
const isTransformSegment = (segment: string) =>
  /(^|,)[a-z]{1,3}_/.test(segment) && !/^v\d+$/.test(segment);

/**
 * next/image loader.
 *
 * Cloudinary is already a resizing, format-negotiating image CDN, so routing
 * its output through /_next/image re-encodes an image that was just encoded —
 * two lossy passes, and visible mush on a photographic backdrop. This hands the
 * width Next asked for straight to Cloudinary instead, which keeps it to one
 * encode while still giving Next a full srcset to choose from.
 *
 * Our course URLs already carry the crop (c_fill,g_auto,ar_16:9,w_…), so those
 * only need their width and quality retargeted. Anything that isn't a
 * Cloudinary image URL — local files under /public — is returned untouched.
 */
export default function cloudinaryLoader({ src, width, quality }: LoaderArgs) {
  const markerAt = src.indexOf(MARKER);
  if (markerAt === -1) return src;

  const q = quality ? `q_${quality}` : "q_auto:good";
  const insertAt = markerAt + MARKER.length;
  const rest = src.slice(insertAt);

  const slash = rest.indexOf("/");
  const firstSegment = slash === -1 ? rest : rest.slice(0, slash);
  const remainder = slash === -1 ? "" : rest.slice(slash + 1);

  // No transformation yet: add one instead of serving the full-size original.
  if (!isTransformSegment(firstSegment)) {
    return `${src.slice(0, insertAt)}c_limit,w_${width},${q},f_auto/${rest}`;
  }

  // Only ever rewrite inside the transformation segment, never the public id.
  let updated = /(^|,)w_\d+/.test(firstSegment)
    ? firstSegment.replace(/(^|,)w_\d+/, `$1w_${width}`)
    : `${firstSegment},w_${width}`;

  updated = /(^|,)q_[^,]+/.test(updated)
    ? updated.replace(/(^|,)q_[^,]+/, `$1${q}`)
    : `${updated},${q}`;

  return `${src.slice(0, insertAt)}${updated}/${remainder}`;
}
