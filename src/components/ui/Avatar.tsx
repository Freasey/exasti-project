import { initials } from "@/lib/format";

const PALETTE = [
  "from-lime-500 to-emerald-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-700",
  "from-sky-500 to-indigo-700",
  "from-fuchsia-500 to-purple-700",
  "from-rose-500 to-red-700",
];

function hashIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % PALETTE.length;
}

export function Avatar({
  name,
  src,
  size = 40,
  ring = false,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const ringClass = ring ? "ring-2 ring-lime-400/70 ring-offset-2 ring-offset-ink-880" : "";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${ringClass} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-ink-950 ${
        PALETTE[hashIndex(name)]
      } ${ringClass} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}
