"use client";

import {
  BadgeCheck,
  Check,
  Copy,
  Infinity as InfinityIcon,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import { InstapayLogo, VodafoneCashLogo } from "@/components/payment-logos";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface PurchaseBundle {
  id: string;
  name: string;
  price: number | null;
  courseCount: number;
}

export interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  coursePrice: number | null;
  /** Access groups this course belongs to, with what each bundle costs. */
  bundles: PurchaseBundle[];
  vodafoneCash: string;
  instapay: string;
  instapayHandle: string | null;
  support: string;
  whatsappHref: string;
}

/** The numbered heading that carries the student through the three steps. */
const Step = ({
  number,
  title,
  hint,
  done,
  muted,
}: {
  number: number;
  title: React.ReactNode;
  hint?: string;
  done?: boolean;
  muted?: boolean;
}) => (
  <div className={cn("flex items-start gap-x-3 transition-opacity", muted && "opacity-45")}>
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black transition-colors",
        done
          ? "bg-brand text-white"
          : muted
            ? "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            : "bg-brand text-white"
      )}
    >
      {done ? <Check className="h-4 w-4" strokeWidth={3} /> : number}
    </span>
    <span className="min-w-0">
      <span className="block text-base font-bold leading-7">{title}</span>
      {hint && (
        <span className="block text-xs leading-5 text-muted-foreground">
          {hint}
        </span>
      )}
    </span>
  </div>
);

/** A wallet the student can pay into — logo, number, and one tap to copy. */
const WalletCard = ({
  logo,
  name,
  number,
  handle,
  className,
}: {
  logo: React.ReactNode;
  name: string;
  number: string;
  handle?: string | null;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      toast.success(`تم نسخ رقم ${name}`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("انسخ الرقم بإيدك");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-white/[0.03]",
        className
      )}
    >
      <div className="flex items-center gap-x-2.5">
        {logo}
        <span className="text-sm font-bold">{name}</span>
      </div>

      <span
        dir="ltr"
        className="mt-3 block text-right font-mono text-lg font-black tracking-wide"
      >
        {number}
      </span>

      {handle && (
        <span dir="ltr" className="block text-right text-xs text-muted-foreground">
          {handle}
        </span>
      )}

      <button
        type="button"
        onClick={copy}
        className={cn(
          "mt-3 flex items-center justify-center gap-x-1.5 rounded-lg border py-2 text-xs font-bold transition",
          copied
            ? "border-brand bg-brand text-white"
            : "hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-white/5"
        )}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            تم النسخ
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            نسخ الرقم
          </>
        )}
      </button>
    </div>
  );
};

/**
 * How to pay, in one place. Picking a package unlocks the rest of the flow, so
 * the student is never looking at a wall of numbers without knowing which
 * amount is theirs.
 */
export const PurchaseDialog = ({
  open,
  onOpenChange,
  courseTitle,
  coursePrice,
  bundles,
  vodafoneCash,
  instapay,
  instapayHandle,
  support,
  whatsappHref,
}: PurchaseDialogProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const payRef = useRef<HTMLElement>(null);

  // The single course leads; the bundles follow, newest first.
  const options = [
    {
      id: "__course__",
      label: "الحصة دي بس",
      note: courseTitle,
      price: coursePrice ?? 0,
    },
    ...bundles
      .filter((bundle) => bundle.price !== null)
      .reverse()
      .map((bundle) => ({
        id: bundle.id,
        label: bundle.name,
        note: `يفتح ${bundle.courseCount} حصة`,
        price: bundle.price as number,
      })),
  ];

  const selected = options.find((option) => option.id === selectedId) ?? null;

  // A fresh visit starts at step one.
  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  const pick = (id: string) => {
    setSelectedId(id);
    // Let the section render before scrolling to it.
    window.setTimeout(() => {
      payRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-l from-brand-deep via-brand-deep to-brand px-6 py-8 text-white">
          <div
            aria-hidden
            className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl"
          />

          <DialogHeader className="relative space-y-2.5 text-right">
            <span className="inline-flex w-fit items-center gap-x-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              فتح مضمون خلال دقائق
            </span>

            <DialogTitle className="text-2xl font-black leading-9 text-white sm:text-3xl">
              احصل على «{courseTitle}»
            </DialogTitle>
            <DialogDescription className="max-w-lg text-sm leading-7 text-white/85">
              ٣ خطوات بس: اختار الباقة، حوّل المبلغ، وابعت صورة التحويل — ونفتحها
              لك على حسابك فوراً.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="divide-y p-6 dark:divide-slate-800">
          {/* 1 — pick a package */}
          <section className="pb-7">
            <Step
              number={1}
              title="اختار الباقة"
              hint="السعر شامل كل الأجزاء والتمارين، بدون رسوم إضافية."
              done={Boolean(selected)}
            />

            <div
              role="radiogroup"
              aria-label="الباقات"
              className={cn(
                "mt-4 grid gap-3",
                options.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"
              )}
            >
              {options.map((option) => {
                const isOn = option.id === selectedId;

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isOn}
                    onClick={() => pick(option.id)}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-5 text-right transition-all duration-200",
                      isOn
                        ? "border-2 border-brand bg-brand/5 shadow-md"
                        : "border-slate-200 hover:border-brand/60 hover:shadow-sm dark:border-slate-800"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 transition",
                        isOn
                          ? "border-brand bg-brand text-white"
                          : "border-slate-300 dark:border-slate-600"
                      )}
                    >
                      {isOn && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>

                    <span className="pe-7 text-lg font-black leading-7">
                      {option.label}
                    </span>
                    <span className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {option.note}
                    </span>

                    <span className="mt-auto flex items-baseline gap-x-1 pt-5">
                      <span className="text-3xl font-black leading-none text-brand-deep dark:text-brand">
                        {option.price}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        جنية
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2 — pay */}
          <section ref={payRef} className="scroll-mt-4 py-7">
            <Step
              number={2}
              title="حوّل المبلغ"
              hint={
                selected
                  ? "اختار المحفظة اللي تناسبك وانسخ الرقم."
                  : "اختار باقة فوق الأول."
              }
              muted={!selected}
            />

            {/* Grows open once a package is chosen. */}
            <div
              className={cn(
                "grid transition-all duration-500 ease-out",
                selected
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand bg-brand/5 p-4">
                  <span className="text-sm font-bold">
                    المبلغ المطلوب لـ «{selected?.label}»
                  </span>
                  <span className="flex items-baseline gap-x-1">
                    <span className="text-3xl font-black leading-none text-brand-deep dark:text-brand">
                      {selected?.price}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      جنية
                    </span>
                  </span>
                </div>

                {/* Either wallet works — the «أو» says so plainly. */}
                <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row">
                  <WalletCard
                    className="flex-1"
                    logo={<VodafoneCashLogo />}
                    name="فودافون كاش"
                    number={vodafoneCash}
                  />

                  <span
                    aria-hidden
                    className="flex items-center justify-center gap-2 sm:flex-col"
                  >
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700 sm:h-auto sm:w-px sm:flex-1" />
                    <span className="rounded-full border bg-white px-2.5 py-0.5 text-xs font-bold text-muted-foreground dark:border-slate-700 dark:bg-slate-900">
                      أو
                    </span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700 sm:h-auto sm:w-px sm:flex-1" />
                  </span>

                  <WalletCard
                    className="flex-1"
                    logo={<InstapayLogo />}
                    name="إنستا باي"
                    number={instapay}
                    handle={instapayHandle}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 3 — send the receipt */}
          <section className="py-7">
            <Step
              number={3}
              title={
                <>
                  خُد <strong className="text-brand-deep dark:text-brand">سكرين شوت</strong>{" "}
                  لإيصال التحويل وابعته على واتساب على{" "}
                  <span dir="ltr" className="font-mono">
                    {support}
                  </span>{" "}
                  ومعاه اسمك والبريد المسجّل بيه على المنصة.
                </>
              }
              muted={!selected}
            />

            <div
              className={cn(
                "grid transition-all duration-500 ease-out",
                selected
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block"
                >
                  <Button variant="brand" size="lg" className="w-full gap-x-2">
                    <MessageCircle className="h-4 w-4" />
                    افتح واتساب
                  </Button>
                </a>
              </div>
            </div>
          </section>

          {/* Trust */}
          <ul className="grid gap-3 pt-7 text-xs sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Timer, text: "الفتح خلال دقائق من وصول التحويل" },
              { icon: InfinityIcon, text: "وصول مدى الحياة لكل التحديثات" },
              { icon: Sparkles, text: "كل التمارين والملفات مشمولة" },
              { icon: BadgeCheck, text: "دعم مباشر لو حصلت أي مشكلة" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-x-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                <span className="leading-5 text-muted-foreground">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;
