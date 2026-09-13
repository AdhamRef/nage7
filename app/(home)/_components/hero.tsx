import { ArrowLeft, GraduationCap, PlayCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  /** Real counts, so the numbers are never a claim we can't back. */
  courses: number;
  lessons: number;
  exercises: number;
};

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div>
    <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
    <p className="text-xs font-medium text-slate-400">{label}</p>
  </div>
);

/**
 * The landing hero. `landing-bg.jpg` has the instructor on its left half and is
 * empty on the right — which, in this RTL layout, is where reading starts.
 */
const Hero = ({ courses, lessons, exercises }: Props) => (
  <section className="relative isolate flex min-h-[calc(100vh-80px)] items-center overflow-hidden bg-[#050c0b] text-white">
    <Image
      src="/landing-bg.jpg"
      alt=""
      aria-hidden
      fill
      priority
      sizes="100vw"
      // Anchored to the top: a very wide viewport crops off the bottom of
      // the frame rather than the head.
      className="object-cover object-[32%_top] lg:object-top"
    />

    {/* Below lg the copy sits over the photograph itself, so it needs a
        scrim to read. Desktop keeps the artwork untouched — the text has the
        empty right half to itself there. */}
    <div
      aria-hidden
      className="absolute inset-0 bg-gradient-to-t from-[#050c0b] via-[#050c0b]/80 to-[#050c0b]/25 lg:hidden"
    />

    {/* Grid and glow behind the copy, like the sign-in panel. */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden lg:block"
    >
      <div className="absolute inset-0 bg-grid-neon [mask-image:linear-gradient(to_left,#000_25%,transparent_95%)]" />
      <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="absolute -bottom-40 right-1/4 h-[26rem] w-[26rem] rounded-full bg-brand-teal/15 blur-3xl" />
    </div>

    <div className="relative container mx-auto grid w-full items-center px-6 py-16 lg:grid-cols-2">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-x-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-sm font-semibold text-brand backdrop-blur">
          <GraduationCap className="h-4 w-4" />
          برمجة ٢ · بكالوريا
        </span>

        <h1 className="mt-6 text-4xl font-black leading-[1.25] drop-shadow-lg md:text-5xl lg:text-[3.4rem]">
          البرمجة في جيبك.
          <span className="block text-brand">أونلاين، وفي وقتك.</span>
        </h1>

        <p className="mt-6 text-base leading-9 text-slate-300 md:text-lg">
          شرح منهج برمجة ٢ للبكالوريا درس ورا درس، بنفس تركيز الدرس الخصوصي:
          فيديو مقسّم، تمارين بتتصحّح، امتحانات على المنهج، ومتابعة لدرجاتك —
          من بيتك وعلى أي جهاز.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-x-2 rounded-lg bg-brand px-8 py-3.5 font-bold text-white shadow-lg shadow-brand/25 ring-1 ring-inset ring-white/20 transition-all duration-300 hover:shadow-xl hover:shadow-brand/40 hover:brightness-110 active:brightness-95"
          >
            ابدأ أول درس
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            href="#courses"
            className="inline-flex items-center gap-x-2 rounded-lg border border-white/25 bg-white/5 px-8 py-3.5 font-bold backdrop-blur transition hover:bg-white/15"
          >
            <PlayCircle className="h-4 w-4" />
            شوف الدروس
          </Link>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          التسجيل مجاني · في دروس مفتوحة تجرّبها قبل ما تدفع مليم
        </p>

        {(courses > 0 || lessons > 0 || exercises > 0) && (
          <div className="mt-10 flex gap-x-10 border-t border-white/10 pt-6">
            <Stat value={`${courses}`} label="درس" />
            <Stat value={`${lessons}`} label="جزء" />
            <Stat value={`${exercises}`} label="تمرين" />
          </div>
        )}
      </div>
    </div>
  </section>
);

export default Hero;
