import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "flame" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/60 " +
  "disabled:cursor-not-allowed disabled:opacity-55";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-lime-400 text-ink-950 hover:bg-lime-300 active:bg-lime-500 shadow-sm shadow-lime-500/20",
  flame:
    "bg-gradient-to-r from-flame-400 to-flame-600 text-white hover:brightness-110 shadow-lg shadow-flame-600/25",
  outline:
    "border border-ink-600 bg-transparent text-mist-100 hover:border-lime-400/60 hover:bg-ink-800",
  ghost: "text-mist-300 hover:bg-ink-800 hover:text-mist-100",
  danger: "bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/25",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra = ""
) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity=".25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
