"use client";

import axios from "axios";
import { FileUp, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import {
  formatBytes,
  uploadEndpoints,
  type UploadEndpoint,
} from "@/lib/upload-endpoints";

export interface UploadedFile {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes?: number;
  /** Only present for videos, in seconds. */
  duration?: number;
  originalFilename?: string;
}

interface FileUploadProps {
  onChange: (file?: UploadedFile) => void;
  endpoint: UploadEndpoint;
}

interface SignatureResponse {
  cloudName: string;
  apiKey: string;
  signature: string;
  timestamp: number;
  folder: string;
  resourceType: string;
  uploadUrl: string;
}

/** Direct-to-Cloudinary upload with a signature minted by our own API. */
const uploadToCloudinary = (
  file: File,
  signature: SignatureResponse,
  onProgress: (percent: number) => void
) =>
  new Promise<UploadedFile>((resolve, reject) => {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signature.apiKey);
    body.append("timestamp", String(signature.timestamp));
    body.append("folder", signature.folder);
    body.append("signature", signature.signature);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signature.uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => reject(new Error("تعذر الاتصال بخدمة الرفع"));

    xhr.onload = () => {
      let payload: any;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("رد غير متوقع من خدمة الرفع"));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(payload?.error?.message ?? "فشل رفع الملف"));
        return;
      }

      resolve({
        url: payload.secure_url,
        publicId: payload.public_id,
        resourceType: payload.resource_type,
        format: payload.format,
        bytes: payload.bytes,
        duration: payload.duration,
        originalFilename: payload.original_filename,
      });
    };

    xhr.send(body);
  });

export const FileUpload = ({ onChange, endpoint }: FileUploadProps) => {
  const config = uploadEndpoints[endpoint];
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const isUploading = progress !== null;

  const validate = (file: File) => {
    if (file.size > config.maxFileSize) {
      return `حجم الملف أكبر من الحد المسموح (${formatBytes(config.maxFileSize)})`;
    }
    if (
      config.mimePrefixes &&
      !config.mimePrefixes.some((prefix) => file.type.startsWith(prefix))
    ) {
      return "نوع الملف غير مدعوم";
    }
    return null;
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || isUploading) return;

    const validationError = validate(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setProgress(0);
    try {
      const { data: signature } = await axios.post<SignatureResponse>(
        "/api/cloudinary/sign",
        { endpoint }
      );
      const uploaded = await uploadToCloudinary(file, signature, setProgress);
      onChange(uploaded);
    } catch (error: any) {
      const message =
        error?.response?.data ?? error?.message ?? "حدث خطأ أثناء الرفع";
      console.error("[FILE_UPLOAD]", error);
      toast.error(typeof message === "string" ? message : "حدث خطأ أثناء الرفع");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-y-2 rounded-md border-2 border-dashed border-slate-300 bg-white/50 p-8 text-center transition dark:border-slate-700 dark:bg-slate-950/50",
          !isUploading && "hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-slate-900",
          isDragging && "border-sky-500 bg-sky-50 dark:bg-slate-900",
          isUploading && "cursor-not-allowed opacity-80"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
            <p className="text-sm text-muted-foreground">جاري الرفع… {progress}%</p>
            <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-sky-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <FileUp className="h-8 w-8 text-sky-600" />
            <p className="text-sm font-medium">اسحب الملف هنا أو اضغط للاختيار</p>
            <p className="text-xs text-muted-foreground">{config.hint}</p>
          </>
        )}
      </button>
    </div>
  );
};
