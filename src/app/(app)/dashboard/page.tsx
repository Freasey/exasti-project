import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bike,
  Droplets,
  Gift,
  Leaf,
  Play,
  TreePine,
  Trophy,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { CyclistScene } from "@/components/CyclistScene";
import { RewardTile } from "@/components/RewardTile";
import { StreakCard } from "@/components/StreakCard";
import { ImpactChart, RangeSelect } from "@/components/charts/ImpactChart";
import { RideRow } from "@/components/RideRow";
import { requireUser } from "@/lib/auth";
import {
  getActiveRide,
  getImpactSeries,
  getLeaderboard,
  getRecentRides,
  getRewards,
  getUserTotals,
  monthBounds,
  type ImpactRange,
} from "@/lib/queries";
import {
  fuelLitersFromCo2,
  levelFromXp,
  treesFromCo2,
} from "@/lib/metrics";
import { getStreak } from "@/lib/streak";
import { formatKm, formatNumber, greeting } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

const RANGES: ImpactRange[] = ["week", "month", "year"];

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const params = await searchParams;
  const rangeParam = Array.isArray(params.range) ? params.range[0] : params.range;
  const range: ImpactRange = RANGES.includes(rangeParam as ImpactRange)
    ? (rangeParam as ImpactRange)
    : "month";

  const user = await requireUser();
  const { thisMonth, lastMonth } = monthBounds();

  const [
    series,
    leaderboard,
    rewards,
    recentRides,
    current,
    previous,
    activeRide,
    streak,
  ] = await Promise.all([
    getImpactSeries(user.id, range),
    getLeaderboard("all", 5),
    getRewards(),
    getRecentRides(user.id, 4),
    getUserTotals(user.id, thisMonth),
    getUserTotals(user.id, lastMonth, thisMonth),
    getActiveRide(user.id),
    getStreak(user.id),
  ]);

  const level = levelFromXp(user.lifetime_points);
  const rangeCo2 = series.length > 0 ? series[series.length - 1].co2 : 0;
  const delta =
    previous.co2_kg > 0
      ? ((current.co2_kg - previous.co2_kg) / previous.co2_kg) * 100
      : current.co2_kg > 0
        ? 100
        : 0;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 py-4 lg:py-2">
      {/* ---------------- Banner sambutan ---------------- */}
      <section className="card eco-glow relative overflow-hidden">
        <CyclistScene className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[52%] opacity-80 md:block" />

        <div className="relative z-10 max-w-2xl p-6 sm:p-8">
          <p className="text-lg text-mist-500">{greeting()},</p>
          <h1 className="mt-0.5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {user.name}! <span className="align-middle">👋</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist-500">
            Terus gowes, kumpulkan poin, dan bantu bikin kotamu lebih bersih.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-5 rounded-2xl border border-ink-700 bg-ink-880/80 px-5 py-3.5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
                  <Leaf className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-mist-500">
                    Total Poin
                  </p>
                  <p className="text-xl font-semibold">
                    {formatNumber(user.points_balance)}{" "}
                    <span className="text-xs font-normal text-mist-500">PTS</span>
                  </p>
                </div>
              </div>

              <span className="h-10 w-px bg-ink-700" />

              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-800 text-lime-400 ring-1 ring-ink-700">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-mist-500">
                    Level
                  </p>
                  <p className="text-xl font-semibold">
                    {level.level}{" "}
                    <span className="text-xs font-normal text-lime-400">
                      {level.title}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-1.5 px-6 pb-6 sm:px-8 md:absolute md:bottom-8 md:right-8 md:px-0 md:pb-0">
          <Link href="/ride" className={buttonClass("flame", "lg", "w-full md:w-auto")}>
            <Play className="h-5 w-5 fill-current" />
            {activeRide ? "Lanjutkan Ride" : "Start Cycling"}
          </Link>
          <p className="flex items-center gap-1.5 text-xs text-mist-500">
            <Bike className="h-3.5 w-3.5" />
            {activeRide ? "Ada sesi yang belum selesai" : "Setiap kayuhan dihitung!"}
          </p>
        </div>
      </section>

      {/* ---------------- Streak ---------------- */}
      <StreakCard streak={streak} />

      {/* ---------------- Dampak + leaderboard ---------------- */}
      <div className="grid gap-5 xl:grid-cols-[1.75fr_1fr]">
        <Card>
          <CardHeader
            icon={<Leaf className="h-[18px] w-[18px]" />}
            title="Dampak Lingkungan & Karbon Dihemat"
            action={<RangeSelect value={range} />}
          />
          <div className="grid gap-6 border-t border-ink-700 p-5 lg:grid-cols-[210px_1fr]">
            <div>
              <p className="text-sm text-mist-500">Total CO₂ Dihemat</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-lime-400">
                {rangeCo2.toFixed(1)}
                <span className="ml-1 text-lg font-normal">kg</span>
              </p>

              <span
                className={`mt-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium ${
                  delta >= 0
                    ? "bg-lime-400/10 text-lime-400"
                    : "bg-flame-500/10 text-flame-400"
                }`}
              >
                <ArrowUpRight
                  className={`h-3.5 w-3.5 ${delta < 0 ? "rotate-90" : ""}`}
                />
                {Math.abs(delta).toFixed(0)}%
              </span>
              <p className="mt-1 text-[11px] text-mist-500">vs bulan lalu</p>

              <dl className="mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-800 text-lime-400 ring-1 ring-ink-700">
                    <TreePine className="h-4 w-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-mist-500">Setara Pohon</dt>
                    <dd className="font-semibold">
                      {treesFromCo2(rangeCo2).toFixed(1)}{" "}
                      <span className="text-xs font-normal text-mist-500">pohon</span>
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-800 text-lime-400 ring-1 ring-ink-700">
                    <Droplets className="h-4 w-4" />
                  </span>
                  <div>
                    <dt className="text-xs text-mist-500">BBM Dihemat</dt>
                    <dd className="font-semibold">
                      {fuelLitersFromCo2(rangeCo2).toFixed(1)}{" "}
                      <span className="text-xs font-normal text-mist-500">L</span>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <ImpactChart data={series} />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            icon={<Trophy className="h-[18px] w-[18px]" />}
            title="Top Leaderboard"
            action={
              <Link
                href="/leaderboard"
                className="flex items-center gap-1 text-sm text-lime-400 hover:text-lime-300"
              >
                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-ink-700 border-t border-ink-700">
            {leaderboard.map((row, index) => {
              const isMe = row.user_id === user.id;
              return (
                <li
                  key={row.user_id}
                  className={`flex items-center gap-3 px-5 py-3.5 ${
                    isMe ? "bg-lime-400/[0.06]" : ""
                  }`}
                >
                  <RankBadge rank={index + 1} />
                  <Avatar name={row.name} src={row.avatar_url} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {row.username}
                      {isMe && (
                        <span className="ml-1.5 text-[10px] text-lime-400">kamu</span>
                      )}
                    </p>
                    <p className="text-[11px] text-mist-500">
                      {formatKm(row.distance_m, 0)} km · {row.ride_count} ride
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-lime-400">
                    {formatNumber(row.points)}
                    <span className="ml-1 text-[10px] font-normal text-mist-500">
                      PTS
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* ---------------- Reward ---------------- */}
      <Card>
        <CardHeader
          icon={<Gift className="h-[18px] w-[18px]" />}
          title="Tukar Reward"
          action={
            <Link
              href="/rewards"
              className="flex items-center gap-1 text-sm text-lime-400 hover:text-lime-300"
            >
              Semua reward <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 border-t border-ink-700 p-5 sm:grid-cols-3 lg:grid-cols-5">
          {rewards.slice(0, 5).map((reward) => (
            <RewardTile
              key={reward.id}
              reward={reward}
              dim={user.points_balance < reward.points_cost}
            />
          ))}
        </div>
      </Card>

      {/* ---------------- Ride terakhir ---------------- */}
      <Card>
        <CardHeader
          icon={<Bike className="h-[18px] w-[18px]" />}
          title="Aktivitas Terakhir"
          action={
            <Link
              href="/activities"
              className="flex items-center gap-1 text-sm text-lime-400 hover:text-lime-300"
            >
              Semua aktivitas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        {recentRides.length === 0 ? (
          <p className="border-t border-ink-700 px-5 py-10 text-center text-sm text-mist-500">
            Belum ada ride tersimpan. Tekan{" "}
            <span className="text-lime-400">Start Cycling</span> untuk memulai.
          </p>
        ) : (
          <ul className="divide-y divide-ink-700 border-t border-ink-700">
            {recentRides.map((ride) => (
              <RideRow key={ride.id} ride={ride} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "bg-amber-400/15 text-amber-300 ring-amber-400/30"
      : rank === 2
        ? "bg-slate-300/15 text-slate-200 ring-slate-300/30"
        : rank === 3
          ? "bg-orange-500/15 text-orange-300 ring-orange-500/30"
          : "bg-ink-800 text-mist-500 ring-ink-700";

  return (
    <span
      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ring-1 ${medal}`}
    >
      {rank}
    </span>
  );
}
