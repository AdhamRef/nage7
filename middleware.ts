import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

import { DEVICE_COOKIE, isDeviceId } from "@/lib/device";

/**
 * Protects the app while leaving the marketing page, the auth screens and the
 * NextAuth endpoints public. Unauthenticated hits are bounced to /sign-in with
 * a callbackUrl so the student lands where they were headed.
 *
 * It also carries the second half of the one-account-one-device rule: sign-in
 * pins the account, and this refuses a session that shows up carrying a
 * different device id — a copied session cookie, in other words. Teachers are
 * exempt, and a missing id falls through, since the client restores it from
 * localStorage on load.
 */
export default withAuth(
  function middleware(req) {
    // Server components can't read the pathname, so hand it down. This is
    // what lets the onboarding gate send a student back where they were going.
    const withPath = () => {
      const headers = new Headers(req.headers);
      headers.set("x-pathname", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.next({ request: { headers } });
    };

    const token = req.nextauth?.token;
    if (!token || token.isTeacher) return withPath();

    const bound = token.deviceId;
    if (typeof bound !== "string" || !bound) return withPath();

    const present = req.cookies.get(DEVICE_COOKIE)?.value;
    if (!isDeviceId(present) || present === bound) return withPath();

    const blocked = new URL("/device-blocked", req.url);
    return NextResponse.redirect(blocked);
  },
  {
    pages: {
      // Most people arriving at a locked page have no account yet, so the
      // default bounce is registration. The form links across to sign-in.
      signIn: "/sign-up",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/search/:path*",
    "/courses/:path*",
    "/teacher/:path*",
    "/api/courses/:path*",
    "/api/cloudinary/:path*",
  ],
};
