"use client";

import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { COUNTRIES, countryByIso, countryName, flagUrl } from "@/lib/countries";
import { cn } from "@/lib/utils";

/** Falls back to the ISO code if the artwork can't load. */
const Flag = ({ iso2 }: { iso2: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex h-[15px] w-5 shrink-0 items-center justify-center rounded-[2px] bg-white/10 text-[9px] font-bold text-slate-300">
        {iso2}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(iso2)}
      srcSet={`${flagUrl(iso2, 80)} 2x`}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-[15px] w-5 shrink-0 rounded-[2px] object-cover"
    />
  );
};

interface PhoneInputProps {
  id?: string;
  /** ISO2 of the selected country. */
  country: string;
  onCountryChange: (iso2: string) => void;
  /** National part only — no dial code. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
}

/**
 * Country picker + number field. The whole control is LTR because a phone
 * number reads left to right regardless of the page direction.
 */
export const PhoneInput = ({
  id,
  country,
  onCountryChange,
  value,
  onChange,
  placeholder = "1012345678",
  disabled,
  invalid,
}: PhoneInputProps) => {
  const [open, setOpen] = useState(false);
  const selected = countryByIso(country) ?? COUNTRIES[0];

  // Names come from Intl, so resolve them once rather than on every keystroke.
  const options = useMemo(
    () => COUNTRIES.map((entry) => ({ ...entry, name: countryName(entry.iso2) })),
    []
  );

  return (
    <div
      dir="ltr"
      className={cn(
        "flex overflow-hidden rounded-lg border bg-white/5 transition focus-within:border-emerald-500",
        invalid ? "border-rose-500/60" : "border-white/10",
        disabled && "opacity-60"
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="اختر الدولة"
            className="flex h-12 shrink-0 items-center gap-x-2 border-r border-white/10 px-3 text-sm text-slate-200 transition hover:bg-white/5"
          >
            <Flag iso2={selected.iso2} />
            <span className="tabular-nums">+{selected.dial}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[300px] p-0" dir="ltr">
          <Command
            filter={(itemValue, search) =>
              itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput placeholder="ابحث عن دولة أو كود…" />
            <CommandList>
              <CommandEmpty>مفيش نتايج</CommandEmpty>
              <CommandGroup>
                {options.map((entry) => (
                  <CommandItem
                    key={entry.iso2}
                    // Searchable by name, ISO code and dial code.
                    value={`${entry.name} ${entry.iso2} +${entry.dial}`}
                    onSelect={() => {
                      onCountryChange(entry.iso2);
                      setOpen(false);
                    }}
                    className="cursor-pointer gap-x-2"
                  >
                    <Flag iso2={entry.iso2} />
                    <span className="flex-1 truncate">{entry.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      +{entry.dial}
                    </span>
                    {entry.iso2 === country && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <input
        id={id}
        dir="ltr"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, 15))
        }
        className="h-12 w-full bg-transparent px-4 text-left text-sm text-white outline-none placeholder:text-slate-500"
      />
    </div>
  );
};

export default PhoneInput;
