import { MessageCircle, MonitorSmartphone, ShieldAlert } from "lucide-react";
import Link from "next/link";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getPaymentInfo, whatsappLink } from "@/lib/payment";

export const metadata = {
  title: "جهاز غير مسموح",
};

/**
 * Where a student lands when their account is already pinned to another
 * device. Deliberately a dead end: the only way forward is talking to us.
 */
const DeviceBlockedPage = () => {
  const { support } = getPaymentInfo();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border bg-white shadow-lg dark:border-slate-800 dark:bg-white/[0.03]">
        <div className="flex flex-col items-center bg-gradient-to-l from-amber-600 to-amber-500 px-6 py-8 text-center text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-black leading-9">
            مينفعش تستخدم الحساب على أكتر من جهاز
          </h1>
        </div>

        <div className="space-y-5 p-6 text-center">
          <p className="text-sm leading-8 text-muted-foreground">
            الحساب ده مربوط بجهاز تاني خلاص. لأسباب أمنية مش هينفع تدخل من
            جهاز مختلف، حتى لو عملت تسجيل خروج.
          </p>

          <p className="flex items-start gap-x-2 rounded-xl border border-dashed p-4 text-right text-sm leading-7 dark:border-slate-800">
            <MonitorSmartphone className="mt-1.5 h-4 w-4 shrink-0 text-brand" />
            <span>
              لو غيّرت جهازك أو في مشكلة، كلّم الإدارة على الرقم ده وهنغيّر لك
              الجهاز المسجّل.
            </span>
          </p>

          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              رقم الإدارة
            </p>
            <p dir="ltr" className="mt-1 font-mono text-2xl font-black">
              {support}
            </p>
          </div>

          <a
            href={whatsappLink(support)}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="brand" size="lg" className="w-full gap-x-2">
              <MessageCircle className="h-4 w-4" />
              تواصل على واتساب
            </Button>
          </a>

          <Link
            href="/"
            className="block text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            الرجوع للرئيسية
          </Link>

          <div className="flex justify-center border-t pt-5 dark:border-slate-800">
            <Logo height={28} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceBlockedPage;
