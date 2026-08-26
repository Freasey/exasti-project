import type { Metadata } from "next";
import { Gift, History, Leaf, TrendingUp } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { RewardTile } from "@/components/RewardTile";
import { RedeemButton } from "./RedeemButton";
import { requireUser } from "@/lib/auth";
import { getRedemptions, getRewards } from "@/lib/queries";
import { levelFromXp } from "@/lib/metrics";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const user = await requireUser();
  const [rewards, redemptions] = await Promise.all([
    getRewards(),
    getRedemptions(user.id),
  ]);

  const level = levelFromXp(user.lifetime_points);
  const cheapest = rewards.reduce(
    (min, r) => Math.min(min, r.points_cost),
    Number.POSITIVE_INFINITY
  );
  const toNextReward = Math.max(0, cheapest - user.points_balance);

  return (
    <div className="mx-auto max-w-6xl space-y-5 py-4">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Gift className="h-6 w-6 text-lime-400" />
          Rewards
        </h1>
        <p className="mt-1 text-sm text-mist-500">
          Tukar poin hasil gowes dengan voucher partner.
        </p>
      </header>

      {/* ---------------- Saldo ---------------- */}
      <Card className="grid gap-6 p-6 sm:grid-cols-[minmax(0,260px)_1fr] sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-mist-500">
            Saldo poin
          </p>
          <p className="mt-1 flex items-baseline gap-2 text-4xl font-semibold tracking-tight text-lime-400">
            {formatNumber(user.points_balance)}
            <span className="text-base font-normal text-mist-500">PTS</span>
          </p>
          <p className="mt-1 text-xs text-mist-500">
            Total sepanjang masa: {formatNumber(user.lifetime_points)} PTS
          </p>
        </div>

        <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-mist-300">
              <TrendingUp className="h-4 w-4 text-lime-400" />
              Level {level.level} · {level.title}
            </span>
            <span className="text-xs text-mist-500">
              {formatNumber(level.xpIntoLevel)} / {formatNumber(level.xpForNext)} XP
            </span>
          </div>
          <Progress value={level.progress} className="mt-3" />
          <p className="mt-3 text-xs text-mist-500">
            {toNextReward > 0
              ? `${formatNumber(toNextReward)} poin lagi untuk reward termurah.`
              : "Poinmu sudah cukup untuk menukar reward."}
          </p>
        </div>
      </Card>

      {/* ---------------- Katalog ---------------- */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {rewards.map((reward) => (
          <RewardTile
            key={reward.id}
            reward={reward}
            dim={user.points_balance < reward.points_cost}
            action={<RedeemButton reward={reward} balance={user.points_balance} />}
          />
        ))}
      </div>

      {/* ---------------- Riwayat ---------------- */}
      <Card>
        <CardHeader
          icon={<History className="h-[18px] w-[18px]" />}
          title="Riwayat penukaran"
        />
        {redemptions.length === 0 ? (
          <p className="border-t border-ink-700 px-5 py-12 text-center text-sm text-mist-500">
            Belum ada penukaran. Kumpulkan poin dengan gowes, lalu tukar di sini.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700 border-t border-ink-700">
            {redemptions.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                  style={{ background: item.accent }}
                >
                  {item.brand.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.brand} · {item.value_label}
                  </p>
                  <p className="text-xs text-mist-500">
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <code className="rounded-lg border border-ink-700 bg-ink-800 px-2.5 py-1.5 font-mono text-xs tracking-wider text-lime-300">
                  {item.code}
                </code>
                <span className="hidden items-center gap-1 text-xs text-mist-500 sm:flex">
                  <Leaf className="h-3 w-3" />-{formatNumber(item.points_spent)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
