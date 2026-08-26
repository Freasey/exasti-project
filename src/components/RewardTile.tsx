import type { ReactNode } from "react";
import { Leaf } from "lucide-react";
import { formatNumber } from "@/lib/format";
import type { Reward } from "@/lib/types";

/** Kartu brand — warna aksen diambil dari kolom `accent` di tabel rewards. */
export function RewardTile({
  reward,
  action,
  dim = false,
}: {
  reward: Reward;
  action?: ReactNode;
  dim?: boolean;
}) {
  return (
    <article
      className={`card flex flex-col overflow-hidden transition-colors ${
        dim ? "opacity-60" : "hover:border-lime-400/30"
      }`}
    >
      <div
        className="relative grid h-24 place-items-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${reward.accent} 0%, ${reward.accent}cc 55%, ${reward.accent}80 100%)`,
        }}
      >
        {/* siluet kota tipis sebagai tekstur */}
        <svg
          viewBox="0 0 240 60"
          className="absolute inset-x-0 bottom-0 h-8 w-full text-black/20"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0 60h20V36h14v24h18V24h22v36h16V40h20v20h24V28h18v32h26V44h18v16h24V32h20v28H0z"
          />
        </svg>
        <span className="relative z-10 px-3 text-center text-lg font-bold tracking-tight text-white drop-shadow-sm">
          {reward.brand}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-medium text-mist-100">{reward.title}</h3>
        <p className="mt-0.5 text-[15px] font-semibold text-lime-400">
          {reward.value_label}
        </p>

        <div className="mt-3 flex-1" />

        {action ?? (
          <span className="flex items-center justify-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-mist-300">
            <Leaf className="h-3.5 w-3.5 text-lime-400" />
            {formatNumber(reward.points_cost)}
            <span className="text-xs text-mist-500">PTS</span>
          </span>
        )}
      </div>
    </article>
  );
}
