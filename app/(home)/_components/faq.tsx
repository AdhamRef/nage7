import { ChevronDown } from "lucide-react";

/**
 * The objections a student actually has, answered plainly. Ordered by how
 * likely each one is to stop someone signing up.
 */
const questions = [
  {
    q: "أنا في بكالوريا. الشرح ده على منهج برمجة ٢ بتاعي؟",
    a: "أيوه. الدروس متبنية على منهج برمجة ٢ للبكالوريا بالترتيب بتاعه، والتمارين والامتحانات على نفس نوعية الأسئلة اللي بتيجي. مش شرح برمجة عام وبعدين تدوّر إنت على اللي يخصك.",
  },
  {
    q: "عمري ما كتبت سطر كود. الدرس ده يناسبني؟",
    a: "أيوه. الدروس بتبدأ من الصفر وبتفترض إنك مشوفتش برمجة قبل كده. كل فكرة بتتشرح قبل ما تتستخدم، والتمارين بتبدأ سهلة وبتكبر معاك بالراحة.",
  },
  {
    q: "في فيديوهات مجانية كتير على النت، أدفع ليه؟",
    a: "لأن ده درس خصوصي مش قناة. الشرح على منهجك بالظبط، بعده تمارين وامتحانات بتتصحّح، ملفات مع كل درس، ودرجاتك بتوصلني عشان لو واقف في حاجة أعرفها. الفيديو المجاني بيشرح للكل وخلاص — محدش عارف إنت فهمت ولا لأ.",
  },
  {
    q: "محتاج أنصّب حاجة عشان أكتب كود؟",
    a: "لأ. HTML و CSS و JavaScript و Python كلهم بيشتغلوا جوه المتصفح. اكتب حلّك، دوس تشغيل، وشوف الناتج — من اللاب أو من الموبايل.",
  },
  {
    q: "الدرس هيفضل معايا قد إيه؟",
    a: "مدى الحياة. أي حاجة بتتضاف أو بتتحدّث في الدرس بتوصلك من غير ما تدفع تاني.",
  },
  {
    q: "أقدر أشوف قبل ما أدفع؟",
    a: "أيوه. اعمل حساب مجاني وافتح أي درس مكتوب عليه مجاني. لو الطريقة مش عاجباك هتعرف قبل ما تدفع حاجة.",
  },
  {
    q: "بدفع إزاي وبيتفتح في قد إيه؟",
    a: "فودافون كاش أو إنستا باي. حوّل المبلغ، وابعتلنا صورة التحويل على واتساب ومعاها اسمك والإيميل اللي مسجّل بيه، وحسابك بيتفتح في دقايق.",
  },
];

const Faq = () => (
  <section className="bg-gray-50 py-24 dark:bg-background">
    <div className="container mx-auto px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-black leading-snug md:text-4xl">
          أسئلة من حقك تسألها
        </h2>
        <p className="mt-4 text-lg leading-9 text-muted-foreground">
          اسألها دلوقتي أحسن من بعد ما تدفع.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {questions.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-xl border bg-white p-5 transition-colors hover:border-brand/40 dark:border-slate-800 dark:bg-white/[0.03]"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-x-4 font-bold marker:content-['']">
              {q}
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition group-open:rotate-180" />
            </summary>
            <p className="mt-4 leading-9 text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export default Faq;
