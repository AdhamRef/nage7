import { v2 as cloudinary } from "cloudinary";

import type { CloudinaryResourceType } from "@/lib/upload-endpoints";

export const cloudinaryCloudName =
  process.env.CLOUDINARY_CLOUD_NAME ??
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
  "";

const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export const isCloudinaryConfigured = () =>
  Boolean(cloudinaryCloudName && apiKey && apiSecret);

export { cloudinary, apiKey as cloudinaryApiKey };

/**
 * Signature for a browser-side direct upload. Only the params listed here may be
 * sent alongside `file` and `api_key`, otherwise Cloudinary rejects the request.
 */
export const signUploadParams = (params: Record<string, string | number>) =>
  cloudinary.utils.api_sign_request(params, apiSecret);

/** Resource types that can actually be deleted through the admin API. */
type DeletableResourceType = Exclude<CloudinaryResourceType, "auto">;

const deletableResourceType = (
  resourceType: string | null | undefined
): DeletableResourceType =>
  resourceType === "video" || resourceType === "raw" ? resourceType : "image";

/**
 * Best-effort delete. Cloudinary cleanup should never take down the request that
 * removes the database row, so failures are logged instead of thrown.
 */
export const destroyAsset = async (
  publicId: string | null | undefined,
  resourceType: string | null | undefined = "image"
) => {
  if (!publicId || !isCloudinaryConfigured()) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: deletableResourceType(resourceType),
      invalidate: true,
    });
  } catch (error) {
    console.error("[CLOUDINARY_DESTROY]", publicId, error);
  }
};

/**
 * Recovers `{ publicId, resourceType }` from a delivery URL. Used for assets
 * stored before public ids were persisted (and for attachments, where the URL is
 * the only thing we keep).
 */
export const parseCloudinaryUrl = (
  url: string | null | undefined
): { publicId: string; resourceType: DeletableResourceType } | null => {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!parsed.hostname.endsWith("cloudinary.com")) return null;

  // /<cloud_name>/<resource_type>/<delivery_type>/[transformations/][v123/]<public_id>.<ext>
  const segments = parsed.pathname.split("/").filter(Boolean);
  const uploadIndex = segments.findIndex((segment) =>
    ["upload", "authenticated", "private"].includes(segment)
  );
  if (uploadIndex < 1) return null;

  const resourceType = deletableResourceType(segments[uploadIndex - 1]);

  let rest = segments.slice(uploadIndex + 1);
  // Drop the version segment, plus any transformation segments before it.
  const versionIndex = rest.findIndex((segment) => /^v\d+$/.test(segment));
  if (versionIndex !== -1) rest = rest.slice(versionIndex + 1);
  if (!rest.length) return null;

  const publicId = rest.join("/");

  // Raw assets keep their extension as part of the public id; the others don't.
  if (resourceType === "raw") return { publicId, resourceType };

  return { publicId: publicId.replace(/\.[^./]+$/, ""), resourceType };
};

/** Deletes an asset when all we have on record is its delivery URL. */
export const destroyAssetByUrl = async (url: string | null | undefined) => {
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return;
  await destroyAsset(parsed.publicId, parsed.resourceType);
};

export interface VideoDeliveryUrls {
  /** Adaptive bitrate stream — Cloudinary's free stand-in for Mux playback. */
  hlsUrl: string;
  /**
   * What the player actually starts from. Cloudinary builds *derived* video
   * assets asynchronously and answers 423 until they exist, so this has to be
   * the untransformed delivery URL returned by the upload itself.
   */
  playbackUrl: string;
  /** Poster frame. */
  thumbnailUrl: string;
}

export const buildVideoUrls = (
  publicId: string,
  /** The secure_url Cloudinary returned for the upload. */
  secureUrl: string
): VideoDeliveryUrls => {
  const base = `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload`;

  return {
    hlsUrl: `${base}/sp_auto/${publicId}.m3u8`,
    playbackUrl: secureUrl,
    thumbnailUrl: `${base}/so_1,w_640,h_360,c_fill,q_auto,f_jpg/${publicId}.jpg`,
  };
};
