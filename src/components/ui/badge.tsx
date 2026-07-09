import type { HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
