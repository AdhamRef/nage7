import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";

import RegisterWizard from "../_components/register-wizard";
import { safeCallback } from "../_components/safe-callback";

export const metadata = { title: "إنشاء حساب" };

const SignUpPage = async ({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) => {
  const { userId } = await auth();
  const callbackUrl = safeCallback(searchParams.callbackUrl);

  // Already signed in: finish the profile instead of making a second account.
  if (userId) {
    return redirect(
      `/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      }
    >
      <RegisterWizard mode="register" callbackUrl={callbackUrl} />
    </Suspense>
  );
};

export default SignUpPage;
