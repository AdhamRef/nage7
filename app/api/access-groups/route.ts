import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Creates a named access group, e.g. "شهر 1". */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "اسم المجموعة مطلوب" }, { status: 400 });
    }

    const price = Number(body.price);

    const group = await db.accessGroup.create({
      data: {
        userId,
        name,
        note: body.note ? String(body.note).trim() : null,
        price: Number.isFinite(price) && price >= 0 ? price : null,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("[ACCESS_GROUPS_POST]", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
