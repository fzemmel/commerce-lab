import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-slate-950 text-white shadow-sm hover:bg-slate-800",
  secondary: "bg-white text-slate-950 shadow-sm hover:bg-amber-50",
  outline: "border border-slate-300 bg-white text-slate-950 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, ...rest }: ButtonProps) {
  return <button className={buttonVariants({ variant, size, className })} {...rest} />;
}
