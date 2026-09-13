import { Quote, Star } from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";

import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { db } from "@/lib/db";

const avatars = [
  { imageUrl: "/Student1.jpg", name: "أحمد محمد" },
  { imageUrl: "/Student2.jpg", name: "سارة علي" },
  { imageUrl: "/Student3.jpg", name: "خالد حسن" },
];

/**
 * Social proof beside the auth form.
 *
 * The headline count is read from the database rather than hard-coded, so it
 * never claims more students than actually registered — and the whole line is
 * dropped while there are none.
 */
const StudentProof = async () => {
  // Without this the count is baked in at build time and never moves.
  noStore();

  let learners = 0;
  try {
    learners = await db.studentProfile.count({
      where: { completedAt: { not: null } },
    });
  } catch (error) {
    console.error("[STUDENT_PROOF]", error);
  }

  // The avatars already stand for three of them.
  const extra = Math.max(learners - avatars.length, 0);

  return (
    <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
      <div className="flex items-center gap-x-4">
        <AvatarCircles avatarUrls={avatars} numPeople={extra} />

        <div className="min-w-0">
          <div className="flex items-center gap-x-0.5 text-amber-400">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <p className="mt-1 text-sm font-bold text-white">
            {learners > 0
              ? `${learners} طالب بدأوا رحلتهم معنا`
              : "كن أول من يبدأ رحلته معنا"}
          </p>
        </div>
      </div>

      <Quote className="mt-6 h-5 w-5 text-emerald-400" />
      <p className="mt-2 text-sm leading-7 text-slate-300">
        بدأت من الصفر تماماً، وخلال أسابيع كنت بكتب أول مشروع بنفسي. أسلوب
        الشرح بسيط وبيخليك تحل المشكلة لوحدك.
      </p>
      <p className="mt-3 text-xs font-semibold text-[#37B7C3]">
        أحمد محمد — طالب في درس البرمجة
      </p>
    </div>
  );
};

export default StudentProof;
