import {
  BookOpenCheck,
  ClipboardCheck,
  Eye,
  GaugeCircle,
  Layers,
  Terminal,
} from "lucide-react";

/**
 * Why study with this tutor, written as outcomes and in his own voice. Every
 * card answers "what do I get?" rather than naming a menu item.
 */
const features = [
  {
    icon: BookOpenCheck,
    title: "شرح على منهج البكالوريا نفسه",
    body: "مش شرح برمجة عام من النت. كل درس متبني على منهج برمجة ٢ ونوعية الأسئلة اللي بتيجي في الامتحان، بأمثلة تقدر تجرّبها بنفسك وإنت قاعد.",
  },
  {
    icon: Terminal,
    title: "تكتب كود من أول يوم",
    body: "HTML و CSS و JavaScript و Python بيشتغلوا جوه المتصفح. مفيش تنصيب ولا إعدادات — دوس تشغيل وشوف كودك بيعمل إيه.",
  },
  {
    icon: Layers,
    title: "من الصفر، وبالترتيب",
    body: "الدروس مبنية فوق بعض بنفس ترتيب المنهج، وكل درس متقسّم لأجزاء قصيرة. مش هتحتار تبدأ منين ولا تشوف إيه بعد إيه.",
  },
  {
    icon: ClipboardCheck,
    title: "امتحانات زي بتاعة البكالوريا",
    body: "كويزات وامتحانات على كل وحدة، بتتصحّح لوحدها في ثواني. بتدخل الامتحان الحقيقي وإنت عارف شكل الأسئلة ومتعوّد عليها.",
  },
  {
    icon: GaugeCircle,
    title: "تعرف إنت واقف فين",
    body: "كل جزء بتخلّصه وكل تمرين بتحلّه بيتسجّل، فالتقدّم قدام عينك والنقص باين — تراجع اللي محتاج مراجعة بس.",
  },
  {
    icon: Eye,
    title: "متابعة شخصية مني",
    body: "درجاتك وإجاباتك بتوصلني. لو في نقطة واقفة معاك بشوفها من عندي، وبنراجعها سوا — ده الفرق بين مدرس خصوصي وقناة يوتيوب.",
  },
];

const FeatureGrid = () => (
  <section className="bg-gray-50 py-24 dark:bg-background">
    <div className="container mx-auto px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-black leading-snug md:text-4xl">
          ليه تذاكر معايا؟
        </h2>
        <p className="mt-4 text-lg leading-9 text-muted-foreground">
          ست حاجات بتفرق فعلاً في برمجة ٢، مش مجرد كلام على صفحة.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <article
            key={title}
            className="group rounded-2xl border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg dark:border-slate-800 dark:bg-white/[0.03]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>

            <h3 className="mt-5 text-lg font-bold leading-8">{title}</h3>
            <p className="mt-2.5 text-sm leading-8 text-muted-foreground">
              {body}
            </p>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureGrid;
