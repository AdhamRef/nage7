import {
  ClipboardCheck,
  FileText,
  ListChecks,
  MonitorPlay,
} from "lucide-react";

/**
 * What a lesson on this platform actually contains. The page leads with the
 * product itself — the exercises are one part of it, not the whole pitch.
 */
const parts = [
  {
    icon: MonitorPlay,
    label: "الشرح",
    title: "زي الدرس الخصوصي، بس مسجّل ومترتب",
    body: "كل درس متقسّم لأجزاء قصيرة، كل جزء بياخد فكرة واحدة من المنهج لحد ما تخلص. تقدر تقف وترجع وتعيد أي جزء براحتك.",
  },
  {
    icon: ListChecks,
    label: "التطبيق",
    title: "تمارين بعد كل جزء",
    body: "أسئلة اختيار من متعدد للنظري، وكود بتكتبه وتشغّله للعملي. بتتصحّح في نفس اللحظة، فبتعرف فهمت ولا لأ قبل ما تكمّل.",
  },
  {
    icon: ClipboardCheck,
    label: "الامتحان",
    title: "كويزات وامتحانات على المنهج",
    body: "امتحن نفسك على كل وحدة زي ما هتتمتحن في البكالوريا. النتيجة بتظهر على طول، ودرجاتك بتتسجّل عشان تعرف مستواك قبل الامتحان الحقيقي.",
  },
  {
    icon: FileText,
    label: "المذاكرة",
    title: "ملفات ومراجع مع كل درس",
    body: "المذكرات والمرفقات موجودة مع الدرس بتاعها، فوقت المراجعة بتفتح صفحة واحدة بدل ما تدوّر في مية مكان.",
  },
];

const CourseAnatomy = () => (
  <section className="bg-white py-24 dark:bg-white/[0.03]">
    <div className="container mx-auto px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-black leading-snug md:text-4xl">
          إيه اللي جوه كل درس؟
        </h2>
        <p className="mt-4 text-lg leading-9 text-muted-foreground">
          مش مجرد فيديوهات مرصوصة — كل درس نظام مذاكرة كامل لوحدة من منهج
          برمجة ٢.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-5 sm:grid-cols-2">
        {parts.map(({ icon: Icon, label, title, body }) => (
          <article
            key={title}
            className="rounded-2xl border p-7 transition-colors hover:border-brand/50 dark:border-slate-800"
          >
            <span className="inline-flex items-center gap-x-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-black text-brand-deep dark:text-brand">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>

            <h3 className="mt-4 text-xl font-bold leading-8">{title}</h3>
            <p className="mt-2.5 text-sm leading-8 text-muted-foreground">
              {body}
            </p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default CourseAnatomy;
