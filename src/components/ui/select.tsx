import type { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-2xl border border-slate-300 bg-white py-0 pl-4 pr-11 text-sm font-medium text-slate-950 shadow-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-amber-100",
          className,
        )}
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700"
      >
        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
