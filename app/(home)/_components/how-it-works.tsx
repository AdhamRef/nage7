const steps = [
  {
    title: "اختار الدرس",
    body: "كل درس مكتوب فيه بيغطي إيه من المنهج، فيه كام جزء، ومدته قد إيه. ابدأ من اللي واقف معاك أو امشي بالترتيب.",
  },
  {
    title: "اتفرج وطبّق",
    body: "جزء ورا جزء، وبعد كل جزء تمارين تكتب فيها كود بنفسك وتتصحّح على طول. الغلط جزء من الطريق.",
  },
  {
    title: "امتحن نفسك وراجع",
    body: "امتحان على الوحدة، ونتيجتك بتظهر على طول وبتتسجّل. وقت المراجعة بتعرف بالظبط إيه اللي محتاج تاني.",
  },
];

/** Three steps, so the routine is obvious before anyone signs up. */
const HowItWorks = () => (
  <section
    id="how-it-works"
    className="scroll-mt-24 bg-gray-50 py-24 dark:bg-background"
  >
    <div className="container mx-auto px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-black leading-snug md:text-4xl">
          بنذاكر مع بعض إزاي؟
        </h2>
        <p className="mt-4 text-lg leading-9 text-muted-foreground">
          نفس الحلقة في كل درس، لحد ما المنهج يخلص وإنت فاهمه فعلاً.
        </p>
      </div>

      <ol className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            {/* Connector between the steps on desktop. */}
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className="absolute left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] top-7 hidden h-px bg-gradient-to-l from-brand/40 to-transparent md:block"
              />
            )}

            <div className="relative flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-xl font-black text-white shadow-lg shadow-brand/25">
                {index + 1}
              </span>
              <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
              <p className="mt-2.5 max-w-xs text-sm leading-8 text-muted-foreground">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default HowItWorks;
