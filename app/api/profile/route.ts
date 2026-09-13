import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { nullable, profileSchema } from "@/lib/onboarding-schema";

/**
 * Completes the profile for someone who signed in with Google and therefore
 * never went through the credentials wizard.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "لازم تسجّل دخول الأول" }, { status: 401 });
    }

    const parsed = profileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const profile = {
      fullName: data.fullName.trim(),
      gender: data.gender,
      phone: data.phone,
      whatsapp: data.whatsapp,
      governorate: nullable(data.governorate),
      city: nullable(data.city),
      guardianPhone: data.guardianPhone,
      acceptedTermsAt: new Date(),
      completedAt: new Date(),
    };

    await db.studentProfile.upsert({
      where: { userId },
      create: { userId, ...profile },
      update: profile,
    });

    // Keep the display name in step with what they typed.
    await db.user.update({
      where: { id: userId },
      data: { name: data.fullName.trim() },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[PROFILE]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
