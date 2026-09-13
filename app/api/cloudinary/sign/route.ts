import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

import {
  cloudinaryApiKey,
  cloudinaryCloudName,
  isCloudinaryConfigured,
  signUploadParams,
} from "@/lib/cloudinary";
import { isUploadEndpoint, uploadEndpoints } from "@/lib/upload-endpoints";

/**
 * Hands the browser a short-lived signature so it can upload straight to
 * Cloudinary. Keeping the bytes off our own route avoids the 4.5MB body limit
 * that would otherwise cap course videos.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!isCloudinaryConfigured()) {
      console.error("[CLOUDINARY_SIGN] Missing Cloudinary environment variables");
      return new NextResponse("Cloudinary is not configured", { status: 500 });
    }

    const { endpoint } = await req.json();
    if (!isUploadEndpoint(endpoint)) {
      return new NextResponse("Unknown upload endpoint", { status: 400 });
    }

    const config = uploadEndpoints[endpoint];
    const timestamp = Math.round(Date.now() / 1000);

    // Every param signed here must be echoed back by the client, and nothing
    // else may be added, or Cloudinary will refuse the upload.
    const paramsToSign = {
      folder: config.folder,
      timestamp,
    };

    return NextResponse.json({
      cloudName: cloudinaryCloudName,
      apiKey: cloudinaryApiKey,
      signature: signUploadParams(paramsToSign),
      resourceType: config.resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${config.resourceType}/upload`,
      ...paramsToSign,
    });
  } catch (error) {
    console.error("[CLOUDINARY_SIGN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
