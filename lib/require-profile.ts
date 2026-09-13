import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

/**
 * Student-facing gate: anyone who signed up through Google (or before the
 * wizard existed) is sent to finish their profile first. Teachers are exempt —
 * the wizard collects school data that means nothing for them.
 */
/** Where the visitor was heading, from the header the middleware sets. */
const intendedPath = () => {
  const path = headers().get("x-pathname");
  // Only ever bounce back inside the app.
  return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
};

export const requireCompleteProfile = async () => {
  const { userId, user } = await auth();
  const next = intendedPath();
  const suffix = next ? `?callbackUrl=${encodeURIComponent(next)}` : "";

  if (!userId) redirect(`/sign-up${suffix}`);
  if (isTeacher(user)) return { userId, user };

  const profile = await db.studentProfile.findUnique({
    where: { userId },
    select: { completedAt: true },
  });

  if (!profile?.completedAt) redirect(`/onboarding${suffix}`);

  return { userId, user };
};
