"use client";

import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePathname, useRouter } from "next/navigation";
import qs from "query-string";

type Props = {};

const SearchInput = (props: Props) => {
  const pathname = usePathname();
  const router = useRouter();

  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, 500); // Added default delay

  useEffect(() => {
    const url = qs.stringifyUrl(
      {
        url: pathname,
        query: {
          title: debouncedValue,
        },
      },
      {
        skipNull: true,
        skipEmptyString: true,
      }
    );

    router.push(url);
  }, [debouncedValue, pathname, router]);

  return (
    <div className="relative">
      <Search className="h-4 w-4 absolute top-3 right-3 text-slate-600" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ابحث عن درس ..."
        className="w-full md:w-[300px] pr-9 rounded-full bg-slate-100 focus-visible:ring-slate-200"
      />
    </div>
  );
};

export default SearchInput;
