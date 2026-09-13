import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import SignInForm from "../_components/sign-in-form";

export const metadata = { title: "تسجيل الدخول" };

const SignInPage = () => (
  <Suspense
    fallback={
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }
  >
    <SignInForm />
  </Suspense>
);

export default SignInPage;
