import type { ReactNode } from "react";

export function Stat({
  icon,
  label,
  value,
  unit,
  hint,
  className = "",
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {icon && (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-800 text-lime-400 ring-1 ring-ink-700">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs text-mist-500">{label}</p>
        <p className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tracking-tight text-mist-100">
            {value}
          </span>
          {unit && <span className="text-xs text-mist-500">{unit}</span>}
        </p>
        {hint && <p className="text-[11px] text-mist-500">{hint}</p>}
      </div>
    </div>
  );
}
