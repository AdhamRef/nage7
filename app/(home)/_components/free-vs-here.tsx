import { Check, Minus, Youtube } from "lucide-react";

import Logo from "@/components/logo";

const onYoutube = [
  "شرح مفتوح للكل ومجاني",
  "اتفرج عليه براحتك وكذا مرة",
  "كويس لو عايز تاخد فكرة سريعة",
];

const missing = [
  "شرح عام، مش على منهج البكالوريا بالظبط",
  "مفيش تمارين ولا امتحانات تتصحّح ليك",
  "محدش شايف درجاتك ولا عارف إنت واقف فين",
];

const here = [
  "شرح على منهج برمجة ٢ درس ورا درس بالترتيب",
  "تمارين وامتحانات بتتصحّح على طول",
  "ملفات ومذكرات مع كل درس في مكانها",
  "درجاتك متسجّلة، وأنا شايفها ومتابعها معاك",
  "وصول مدى الحياة لكل تحديث بيتضاف",
];

/**
 * Answers "why pay when there are free videos" — but late in the page and in
 * its own box, so the whole pitch isn't built on the objection.
 */
const FreeVsHere = () => (
  <section className="bg-white py-24 dark:bg-white/[0.03]">
    <div className="container mx-auto px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-black leading-snug md:text-4xl">
          وفي فرق إيه عن الفيديوهات المجانية؟
        </h2>
        <p className="mt-4 text-lg leading-9 text-muted-foreground">
          الفيديو المجاني شرح للكل. الدرس الخصوصي شرح ليك إنت، ومدرس شايف
          إنت واصل لفين.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        {/* The free videos, described fairly */}
        <div className="rounded-2xl border p-7 dark:border-slate-800">
          <div className="flex items-center gap-x-2.5">
            <Youtube className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-bold">فيديو مجاني على النت</h3>
          </div>

          <ul className="mt-5 space-y-3 text-sm">
            {onYoutube.map((line) => (
              <li key={line} className="flex items-start gap-x-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <ul className="mt-5 space-y-3 border-t pt-5 text-sm text-muted-foreground dark:border-slate-800">
            {missing.map((line) => (
              <li key={line} className="flex items-start gap-x-2.5">
                <Minus className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The lesson */}
        <div className="relative rounded-2xl border-2 border-brand bg-brand/5 p-7">
          <span className="absolute -top-3 right-7 rounded-full bg-brand px-3 py-1 text-[11px] font-black text-white">
            درس خصوصي أونلاين
          </span>

          <div className="flex items-center gap-x-2.5">
            <Logo height={22} href={null} />
            <h3 className="text-lg font-bold">هنا</h3>
          </div>

          <ul className="mt-5 space-y-3 text-sm">
            {here.map((line) => (
              <li key={line} className="flex items-start gap-x-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

export default FreeVsHere;
