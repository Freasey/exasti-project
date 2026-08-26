import Link from "next/link";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* dua roda */}
      <circle cx="13" cy="32" r="8.5" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="35" cy="32" r="8.5" stroke="currentColor" strokeWidth="2.2" />
      {/* rangka */}
      <path
        d="M13 32 22 20h9l4 12M22 20l-3-5h-4M31 20l4 12M24 32h11"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* daun di setang */}
      <path
        d="M30 13c4.2-4 9.4-4.2 12-3.4.6 3-.4 8.4-4.6 11.2-2.7 1.8-6 1.3-7.6-.7-1.6-2-1.4-5.1.2-7.1Z"
        fill="currentColor"
        opacity=".95"
      />
      <path
        d="M42 9.6c-4.4 2-8.4 5.4-10.6 9.6"
        stroke="#0a0d0a"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  href = "/",
  compact = false,
}: {
  href?: "/" | "/dashboard";
  compact?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5 group">
      <span className="text-lime-400 transition-transform group-hover:-translate-y-0.5">
        <LogoMark className={compact ? "h-8 w-8" : "h-10 w-10"} />
      </span>
      <span className="leading-none">
        <span
          className={`block font-semibold tracking-tight ${
            compact ? "text-lg" : "text-[22px]"
          }`}
        >
          <span className="text-mist-100">Eco</span>
          <span className="text-lime-400">Cycle</span>
        </span>
        {!compact && (
          <span className="mt-1 block text-[11px] text-mist-500">
            Ride Green, Live Clean
          </span>
        )}
      </span>
    </Link>
  );
}
