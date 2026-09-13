import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

import RegisterWizard from "../_components/register-wizard";
import { safeCallback } from "../_components/safe-callback";

export const metadata = { title: "أكمل بياناتك" };

/** Where Google users land: the same wizard, minus the password step. */
const OnboardingPage = async ({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) => {
  const { userId, user } = await auth();
  const callbackUrl = safeCallback(searchParams.callbackUrl);

  if (!userId) return redirect("/sign-up");

  const profile = await db.studentProfile.findUnique({ where: { userId } });
  // Profile already done — carry on to wherever they were headed.
  if (profile?.completedAt) return redirect(callbackUrl);

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      }
    >
      <RegisterWizard
        mode="onboarding"
        callbackUrl={callbackUrl}
        defaults={{
          fullName: profile?.fullName ?? user?.name ?? "",
          email: user?.email ?? "",
          gender: profile?.gender ?? "",
          phone: profile?.phone ?? "",
          whatsapp: profile?.whatsapp ?? "",
          governorate: profile?.governorate ?? "",
          city: profile?.city ?? "",
          guardianPhone: profile?.guardianPhone ?? "",
        }}
      />
    </Suspense>
  );
};

export default OnboardingPage;
