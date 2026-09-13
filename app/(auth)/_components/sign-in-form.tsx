"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/device-client";
import { DEVICE_LOCKED_ERROR } from "@/lib/device";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import GoogleButton from "./google-button";

/** Shown when the account is already pinned to a different device. */
const DEVICE_LOCKED_MESSAGE =
  "مينفعش تستخدم الحساب على أكتر من جهاز. كلّم الإدارة لو في مشكلة.";

/** NextAuth bounces OAuth failures back here with an `error` query param. */
const errorMessages: Record<string, string> = {
  OAuthAccountNotLinked:
    "الإيميل ده مسجّل بطريقة تانية. ادخل بكلمة المرور الأول.",
  CredentialsSignin: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  AccessDenied: "تم رفض الوصول",
  [DEVICE_LOCKED_ERROR]: DEVICE_LOCKED_MESSAGE,
};

const SignInForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/courses";
  const initialError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? (errorMessages[initialError] ?? "تعذر تسجيل الدخول") : null
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        // Mints and mirrors the id so the server can read it on this request.
        deviceId: getDeviceId(),
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === DEVICE_LOCKED_ERROR ||
            result.error.includes(DEVICE_LOCKED_ERROR)
            ? DEVICE_LOCKED_MESSAGE
            : "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );
        return;
      }

      toast.success("مرحباً بعودتك");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("حدث خطأ، جرّب تاني");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          كمّل رحلتك في البرمجة
        </p>
      </div>

      <GoogleButton callbackUrl={callbackUrl} />

      <div className="flex items-center gap-x-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">أو</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            className="text-left"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور</Label>
          <Input
            id="password"
            type="password"
            dir="ltr"
            className="text-left"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isLoading}
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          تسجيل الدخول
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{" "}
        <Link
          href={`/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-semibold text-sky-700 hover:underline dark:text-sky-400"
        >
          أنشئ حساباً
        </Link>
      </p>
    </div>
  );
};

export default SignInForm;
