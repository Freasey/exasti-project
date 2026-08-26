export function Progress({
  value,
  className = "",
}: {
  value: number; // 0..1
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-ink-700 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-lime-500 to-lime-300 transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
