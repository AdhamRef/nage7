import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { nullable, registerSchema } from "@/lib/onboarding-schema";

/** Email + password sign-up with the full student profile. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "بيانات غير صحيحة" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const email = data.email.toLowerCase().trim();

    const existingUser = await db.user.findUnique({ where: { email } });

    if (existingUser?.password) {
      return NextResponse.json({ error: "الإيميل ده مسجّل بالفعل" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // An address that only ever used Google can adopt a password here.
    const user = existingUser
      ? await db.user.update({
          where: { id: existingUser.id },
          data: { password: passwordHash, name: data.fullName },
        })
      : await db.user.create({
          data: { name: data.fullName, email, password: passwordHash },
        });

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
      where: { userId: user.id },
      create: { userId: user.id, ...profile },
      update: profile,
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
