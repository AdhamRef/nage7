"use client";

import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + error, laid out the same across every wizard step. */
export const Field = ({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: FieldProps) => (
  <div className={cn("space-y-1.5", className)}>
    <label htmlFor={htmlFor} className="block text-sm text-slate-300">
      {label}
      {required && <span className="mr-1 text-rose-400">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    {error && <p className="text-xs text-rose-400">{error}</p>}
  </div>
);

export const fieldClass =
  "h-12 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-500 focus:bg-white/[0.07] disabled:opacity-60";

export const selectClass = cn(fieldClass, "cursor-pointer appearance-none pl-10");

/** Egyptian mobile input with a fixed +20 prefix, always LTR. */
export const PhoneInput = ({
  id,
  value,
  onChange,
  placeholder = "1012345678",
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="flex overflow-hidden rounded-lg border border-white/10 bg-white/5 transition focus-within:border-emerald-500">
    <span className="flex shrink-0 items-center gap-x-1.5 border-l border-white/10 px-3 text-sm text-slate-300">
      <span aria-hidden>🇪🇬</span>
      <span dir="ltr">+20</span>
    </span>
    <input
      id={id}
      dir="ltr"
      inputMode="numeric"
      autoComplete="tel"
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 10))}
      className="h-12 w-full bg-transparent px-4 text-left text-sm text-white outline-none placeholder:text-slate-500"
    />
  </div>
);
