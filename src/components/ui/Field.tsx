"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  icon?: ReactNode;
};

export function Field({ label, hint, icon, className = "", ...props }: FieldProps) {
  const id = useId();
  const isPassword = props.type === "password";
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-mist-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-500">
            {icon}
          </span>
        )}
        <input
          id={id}
          {...props}
          type={isPassword && revealed ? "text" : props.type}
          className={`h-12 w-full rounded-xl border border-ink-700 bg-ink-850 text-[15px] text-mist-100 placeholder:text-mist-600 transition-colors focus:border-lime-400/70 focus:outline-none focus:ring-2 focus:ring-lime-400/15 ${
            icon ? "pl-11" : "pl-4"
          } ${isPassword ? "pr-11" : "pr-4"}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mist-500 transition-colors hover:text-mist-100"
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-mist-500">{hint}</p>}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {children}
    </p>
  );
}
