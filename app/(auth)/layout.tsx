import { Sparkles } from "lucide-react";

import Logo from "@/components/logo";

import StudentProof from "./_components/student-proof";

/**
 * Split auth shell: brand panel on the right (the RTL "start"), form on the
 * left. Always dark, in the site's cyan/emerald identity.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[#0b1220] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1400px] lg:grid-cols-[1fr_1.1fr]">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-center overflow-hidden px-12 py-16 lg:flex">
          <div
            aria-hidden
            className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-32 left-0 h-96 w-96 rounded-full bg-[#37B7C3]/15 blur-3xl"
          />

          <div className="relative">
            <Logo height={40} priority className="mb-10" />

            <p className="flex items-center gap-x-2 text-sm font-semibold text-[#37B7C3]">
              <Sparkles className="h-4 w-4" />
              أكبر منصة لتعليم البرمجة بالعربي
            </p>

            <h2 className="mt-6 text-5xl font-black leading-tight">
              يلا نجهّز حسابك.
            </h2>
            <span className="mt-4 block h-1 w-28 rounded-full bg-gradient-to-l from-[#37B7C3] to-emerald-500" />

            <p className="mt-8 max-w-md text-lg leading-8 text-slate-400">
              كام دقيقة وهتبقى جاهز تتابع الدروس والتمارين البرمجية خطوة بخطوة.
            </p>

            <div className="mt-12">
              <StudentProof />
            </div>
          </div>
        </aside>

        {/* Form */}
        <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
          <div className="mb-8 lg:hidden">
            <Logo height={38} priority />
          </div>
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur sm:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
