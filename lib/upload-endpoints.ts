/**
 * Shared (client + server safe) description of every upload slot in the app.
 * Contains no secrets, so it can be imported from client components as well as
 * from the signing route.
 */

export const MB = 1024 * 1024;

export type UploadEndpoint = "courseImage" | "courseAttachment" | "courseVideo";

/** Cloudinary resource types we hand to the upload API. */
export type CloudinaryResourceType = "image" | "video" | "raw" | "auto";

export interface UploadEndpointConfig {
  /** Cloudinary resource type used in the upload URL. */
  resourceType: CloudinaryResourceType;
  /** Cloudinary folder every asset of this kind lands in. */
  folder: string;
  /** Hard client-side limit, kept in sync with the Cloudinary free plan caps. */
  maxFileSize: number;
  /** `accept` attribute for the file input. */
  accept: string;
  /** Allowed mime prefixes. `undefined` means "anything". */
  mimePrefixes?: string[];
  /** Arabic hint shown inside the dropzone. */
  hint: string;
}

export const uploadEndpoints: Record<UploadEndpoint, UploadEndpointConfig> = {
  courseImage: {
    resourceType: "image",
    folder: "nage7/course-images",
    maxFileSize: 10 * MB,
    accept: "image/*",
    mimePrefixes: ["image/"],
    hint: "صورة 16:9 — يفضل 1920×1080 بكسل، بحد أقصى 10 ميجابايت",
  },
  courseAttachment: {
    resourceType: "auto",
    folder: "nage7/course-attachments",
    maxFileSize: 10 * MB,
    accept: "image/*,video/*,audio/*,application/pdf,text/*",
    hint: "ملف واحد بحد أقصى 10 ميجابايت",
  },
  courseVideo: {
    resourceType: "video",
    folder: "nage7/course-videos",
    maxFileSize: 100 * MB,
    accept: "video/*",
    mimePrefixes: ["video/"],
    hint: "فيديو واحد بحد أقصى 100 ميجابايت",
  },
};

export const isUploadEndpoint = (value: unknown): value is UploadEndpoint =>
  typeof value === "string" && value in uploadEndpoints;

export const formatBytes = (bytes: number) => {
  if (bytes >= MB) return `${Math.round(bytes / MB)} ميجابايت`;
  return `${Math.round(bytes / 1024)} كيلوبايت`;
};
