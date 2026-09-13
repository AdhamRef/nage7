"use client";

import axios from "axios";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Eye,
  EyeOff,
  Inbox,
  Loader2,
  Lock,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PhoneInput } from "@/components/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPhone, parsePhone } from "@/lib/countries";
import {
  GENDERS,
  GOVERNORATES,
  GOVERNORATE_NAMES,
  TERMS_SECTIONS,
  genderLabels,
} from "@/lib/onboarding-options";
import {
  accountStepSchema,
  extraStepSchema,
  passwordSchema,
  termsStepSchema,
} from "@/lib/onboarding-schema";
import { cn } from "@/lib/utils";

import { Field, fieldClass } from "./field";
import GoogleButton from "./google-button";

const TERMS_ICONS = [ShieldAlert, Wallet, Lock, BookOpen, Inbox];

type Values = {
  fullName: string;
  gender: string;
  email: string;
  password: string;
  confirmPassword: string;
  governorate: string;
  city: string;
  guardianPhone: string;
  acceptedTerms: boolean;
};

/** Country + national number, kept apart until they're submitted. */
type PhoneState = { country: string; national: string };

const emptyValues: Values = {
  fullName: "",
  gender: "",
  email: "",
  password: "",
  confirmPassword: "",
  governorate: "",
  city: "",
  guardianPhone: "",
  acceptedTerms: false,
};

const STEP_TITLES = [
  { title: "بيانات حسابك", subtitle: "دخّل بياناتك عشان تعمل حساب جديد." },
  { title: "معلومات إضافية", subtitle: "شوية تفاصيل زيادة قبل ما نخلص." },
  { title: "الشروط والأحكام", subtitle: "راجع شروطنا ووافق عليها عشان تكمل." },
];

const STEPS = STEP_TITLES.length;

/** Matches the brand glow behind the card. */
const primaryButton =
  "flex h-12 min-w-[180px] items-center justify-center gap-x-2 rounded-lg bg-gradient-to-l from-emerald-500 to-[#37B7C3] px-8 font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:brightness-110 disabled:opacity-60";

interface RegisterWizardProps {
  /**
   * "register" creates the account from scratch; "onboarding" completes the
   * profile of someone who already signed in with Google.
   */
  mode: "register" | "onboarding";
  defaults?: Partial<Values> & {
    phone?: string;
    whatsapp?: string;
    guardianPhone?: string;
  };
  callbackUrl?: string;
}

export const RegisterWizard = ({
  mode,
  defaults,
  callbackUrl = "/courses",
}: RegisterWizardProps) => {
  const router = useRouter();
  const isOnboarding = mode === "onboarding";

  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ ...emptyValues, ...defaults });
  const [phone, setPhone] = useState<PhoneState>(() => {
    const parsed = parsePhone(defaults?.phone);
    return { country: parsed.iso2, national: parsed.national };
  });
  const [whatsapp, setWhatsapp] = useState<PhoneState>(() => {
    const parsed = parsePhone(defaults?.whatsapp);
    return { country: parsed.iso2, national: parsed.national };
  });
  const [guardian, setGuardian] = useState<PhoneState>(() => {
    const parsed = parsePhone(defaults?.guardianPhone);
    return { country: parsed.iso2, national: parsed.national };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openTerm, setOpenTerm] = useState<string | null>(TERMS_SECTIONS[0].id);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    clearError(key as string);
  };

  const clearError = (key: string) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  const cities = useMemo(
    () => (values.governorate ? GOVERNORATES[values.governorate] ?? [] : []),
    [values.governorate]
  );

  /** What actually gets posted: phones flattened to +<dial><number>. */
  const payload = () => ({
    ...values,
    phone: formatPhone(phone.country, phone.national),
    whatsapp: formatPhone(whatsapp.country, whatsapp.national),
    guardianPhone: formatPhone(guardian.country, guardian.national),
  });

  const validateStep = () => {
    const collect = (result: { success: boolean; error?: any }) => {
      if (result.success) return {};
      const found: Record<string, string> = {};
      for (const issue of result.error.errors) {
        const key = issue.path[0];
        if (key && !found[key]) found[key] = issue.message;
      }
      return found;
    };

    const data = payload();
    let found: Record<string, string> = {};

    if (step === 0) {
      found = collect(accountStepSchema.safeParse(data));
      if (!isOnboarding) {
        found = { ...found, ...collect(passwordSchema.safeParse(data)) };
      }
    } else if (step === 1) {
      found = collect(extraStepSchema.safeParse(data));
    } else {
      found = collect(termsStepSchema.safeParse(data));
    }

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    if (step < STEPS - 1) {
      setStep(step + 1);
      return;
    }
    void submit();
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      if (isOnboarding) {
        await axios.post("/api/profile", payload());
        toast.success("حسابك اتعمل بنجاح");
        router.push(callbackUrl);
        router.refresh();
        return;
      }

      await axios.post("/api/register", payload());

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("تم إنشاء الحساب — سجل الدخول من فضلك");
        router.push(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      toast.success("تم إنشاء حسابك");
      router.push(callbackUrl);
      router.refresh();
    } catch (error: any) {
      const message = error?.response?.data?.error ?? "حدث خطأ، جرّب تاني";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTrigger = cn(
    fieldClass,
    "flex items-center justify-between text-right data-[placeholder]:text-slate-500"
  );

  return (
    <div className="w-full">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-x-4">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/5"
            aria-label="رجوع"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1">
          <p className="mb-2 text-left text-xs text-emerald-400">
            الخطوة {step + 1} من {STEPS}
          </p>
          <div className="flex gap-x-2" dir="ltr">
            {Array.from({ length: STEPS }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  index <= step
                    ? "bg-gradient-to-l from-emerald-500 to-[#37B7C3]"
                    : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white">{STEP_TITLES[step].title}</h1>
      <p className="mt-1 text-sm text-slate-400">{STEP_TITLES[step].subtitle}</p>

      <div className="mt-6 space-y-5">
        {/* ---------------- Step 1 — account ---------------- */}
        {step === 0 && (
          <>
            {!isOnboarding && (
              <>
                <GoogleButton callbackUrl={callbackUrl} />
                <div className="flex items-center gap-x-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-slate-500">أو</span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
              </>
            )}

            <Field label="الاسم الكامل" htmlFor="fullName" required error={errors.fullName}>
              <input
                id="fullName"
                className={fieldClass}
                placeholder="دخل اسمك الكامل"
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </Field>

            <Field label="النوع" required error={errors.gender}>
              <div className="grid grid-cols-3 gap-3">
                {GENDERS.map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => set("gender", gender)}
                    className={cn(
                      "h-12 rounded-lg border text-sm transition",
                      values.gender === gender
                        ? "border-emerald-500 bg-emerald-500/10 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
                    )}
                  >
                    {genderLabels[gender]}
                  </button>
                ))}
              </div>
            </Field>

            {!isOnboarding && (
              <Field label="البريد الإلكتروني" htmlFor="email" required error={errors.email}>
                <input
                  id="email"
                  type="email"
                  dir="ltr"
                  className={cn(fieldClass, "text-left")}
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="رقم الموبايل" htmlFor="phone" required error={errors.phone}>
                <PhoneInput
                  id="phone"
                  country={phone.country}
                  onCountryChange={(country) => {
                    setPhone((current) => ({ ...current, country }));
                    clearError("phone");
                  }}
                  value={phone.national}
                  onChange={(national) => {
                    setPhone((current) => ({ ...current, national }));
                    clearError("phone");
                  }}
                  invalid={Boolean(errors.phone)}
                />
              </Field>

              <Field label="رقم الواتساب" htmlFor="whatsapp" required error={errors.whatsapp}>
                <PhoneInput
                  id="whatsapp"
                  country={whatsapp.country}
                  onCountryChange={(country) => {
                    setWhatsapp((current) => ({ ...current, country }));
                    clearError("whatsapp");
                  }}
                  value={whatsapp.national}
                  onChange={(national) => {
                    setWhatsapp((current) => ({ ...current, national }));
                    clearError("whatsapp");
                  }}
                  invalid={Boolean(errors.whatsapp)}
                />
              </Field>
            </div>

            {!isOnboarding && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="كلمة المرور"
                  htmlFor="password"
                  required
                  error={errors.password}
                  hint="من 6 إلى 20 حرفاً: أحرف وأرقام و _ . - بس."
                >
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      className={cn(fieldClass, "pl-10 text-left")}
                      placeholder="اعمل كلمة مرور"
                      value={values.password}
                      onChange={(e) => set("password", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 transition hover:text-white"
                      aria-label="إظهار كلمة المرور"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                <Field
                  label="أكد كلمة المرور"
                  htmlFor="confirmPassword"
                  required
                  error={errors.confirmPassword}
                >
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    className={cn(fieldClass, "text-left")}
                    placeholder="دخل كلمة المرور تاني"
                    value={values.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                  />
                </Field>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="المحافظة" error={errors.governorate}>
                <Select
                  value={values.governorate}
                  onValueChange={(value) => {
                    set("governorate", value);
                    set("city", "");
                  }}
                >
                  <SelectTrigger className={selectTrigger}>
                    <SelectValue placeholder="اختار المحافظة" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {GOVERNORATE_NAMES.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="المدينة" error={errors.city}>
                <Select
                  value={values.city}
                  onValueChange={(value) => set("city", value)}
                  disabled={!values.governorate}
                >
                  <SelectTrigger className={selectTrigger}>
                    <SelectValue
                      placeholder={
                        values.governorate ? "اختار المدينة" : "اختار المحافظة أولاً"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </>
        )}

        {/* ---------------- Step 2 — guardian ---------------- */}
        {step === 1 && (
          <Field
            label="رقم موبايل ولي الأمر"
            htmlFor="guardianPhone"
            required
            error={errors.guardianPhone}
            hint="هنستخدمه للتواصل بخصوص متابعة الطالب."
          >
            <PhoneInput
              id="guardianPhone"
              country={guardian.country}
              onCountryChange={(country) => {
                setGuardian((current) => ({ ...current, country }));
                clearError("guardianPhone");
              }}
              value={guardian.national}
              onChange={(national) => {
                setGuardian((current) => ({ ...current, national }));
                clearError("guardianPhone");
              }}
              invalid={Boolean(errors.guardianPhone)}
            />
          </Field>
        )}

        {/* ---------------- Step 3 — terms ---------------- */}
        {step === 2 && (
          <>
            <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {TERMS_SECTIONS.map((section, index) => {
                const Icon = TERMS_ICONS[index] ?? ShieldAlert;
                const isOpen = openTerm === section.id;

                return (
                  <div key={section.id}>
                    <button
                      type="button"
                      onClick={() => setOpenTerm(isOpen ? null : section.id)}
                      className="flex w-full items-center gap-x-3 p-4 text-right transition hover:bg-white/5"
                    >
                      <span className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 font-semibold text-white">
                        {section.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-slate-400 transition",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-4 pb-4 text-sm leading-7 text-slate-400">
                        {section.body}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => set("acceptedTerms", !values.acceptedTerms)}
              className={cn(
                "flex w-full items-start gap-x-3 rounded-xl border p-4 text-right transition",
                values.acceptedTerms
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/25"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs",
                  values.acceptedTerms
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-white/25"
                )}
              >
                {values.acceptedTerms && "✓"}
              </span>
              <span>
                <span className="block font-semibold text-white">
                  موافق على شروط وأحكام ناجح
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  لما توافق، يبقى إنت قبلت كل السياسات اللي فوق.
                </span>
              </span>
            </button>

            {errors.acceptedTerms && (
              <p className="text-xs text-rose-400">{errors.acceptedTerms}</p>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={next} disabled={isSubmitting} className={primaryButton}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === STEPS - 1 ? "اعمل الحساب" : "كمّل"}
          </button>

          {!isOnboarding && (
            <p className="text-sm text-slate-400">
              هل عندك حساب فعلاً؟{" "}
              <Link
                href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="font-semibold text-emerald-400 hover:underline"
              >
                تسجيل الدخول
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterWizard;
