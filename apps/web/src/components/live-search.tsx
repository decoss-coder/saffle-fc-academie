"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type LiveSearchProps = {
  placeholder?: string;
  paramName?: string;
  preserveParams?: string[];
  className?: string;
};

export function LiveSearch({
  placeholder = "Rechercher nom ou matricule…",
  paramName = "q",
  preserveParams = ["groupe"],
  className = "",
}: LiveSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(initial);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(searchParams.get(paramName) ?? "");
  }, [searchParams, paramName]);

  function pushQuery(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();
    if (trimmed) params.set(paramName, trimmed);
    else params.delete(paramName);
    for (const key of preserveParams) {
      const existing = searchParams.get(key);
      if (existing) params.set(key, existing);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className={`w-full sm:min-w-[280px] sm:max-w-sm ${className}`}>
      <label htmlFor="live-search" className="sr-only">
        Rechercher
      </label>
      <input
        id="live-search"
        type="search"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => pushQuery(next), 300);
        }}
        placeholder={placeholder}
        className="w-full rounded-full border border-green-200 bg-white px-4 py-2.5 text-sm text-green-950 outline-none ring-green-600 focus:ring-2"
      />
    </div>
  );
}
