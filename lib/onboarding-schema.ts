import * as z from "zod";

import { GENDERS } from "@/lib/onboarding-options";

const optional = (schema: z.ZodTypeAny) =>
  z.union([schema, z.literal("")]).optional();

/** Full international form, e.g. +201012345678. */
const phone = (label: string) =>
  z
    .string()
    .regex(/^\+\d{8,17}$/, { message: `${label} غير صحيح` });

export const PASSWORD_RE = /^[a-zA-Z0-9._-]{6,20}$/;

/** Step 1 — account details. */
export const accountStepSchema = z.object({
  fullName: z.string().trim().min(3, { message: "أدخل اسمك الكامل" }),
  gender: z.enum(GENDERS, {
    errorMap: () => ({ message: "اختر النوع" }),
  }),
  email: z.string().trim().email({ message: "البريد الإلكتروني غير صحيح" }),
  phone: phone("رقم الموبايل"),
  whatsapp: phone("رقم الواتساب"),
  governorate: optional(z.string()),
  city: optional(z.string()),
});

/** Password only applies to the email/password path. */
export const passwordSchema = z
  .object({
    password: z.string().regex(PASSWORD_RE, {
      message: "من 6 إلى 20 حرفاً: أحرف وأرقام و _ . - بس",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  });

/** Step 2 — who we contact about this student. */
export const extraStepSchema = z.object({
  guardianPhone: phone("رقم موبايل ولي الأمر"),
});

/** Step 3 — terms. */
export const termsStepSchema = z.object({
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "لازم توافق على الشروط والأحكام" }),
  }),
});

/** Everything except the password — what /api/profile stores. */
export const profileSchema = accountStepSchema
  .merge(extraStepSchema)
  .merge(termsStepSchema);

/** The full credentials sign-up payload. */
export const registerSchema = profileSchema.and(passwordSchema);

export type ProfileValues = z.infer<typeof profileSchema>;

/** Blank-to-null so optional selects don't store empty strings. */
export const nullable = (value?: string | null) =>
  value && value.trim().length ? value.trim() : null;
