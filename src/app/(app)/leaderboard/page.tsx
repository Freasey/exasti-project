import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Leaf, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { requireUser } from "@/lib/auth";
import { getLeaderboard, type LeaderboardPeriod } from "@/lib/queries";
import { levelFromXp } from "@/lib/metrics";
import { formatKm, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Leaderboard" };

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "week", label: "Minggu ini" },
  { key: "month", label: "Bulan ini" },
  { key: "all", label: "Sepanjang masa" },
];

export default async function LeaderboardPage({
  searchParams,
}: PageProps<"/leaderboard">) {
  const params = await searchParams;
  const raw = Array.isArray(params.period) ? params.period[0] : params.period;
  const period: LeaderboardPeriod =
    raw === "week" || raw === "month" || raw === "all" ? raw : "week";

  const user = await requireUser();
  const rows = await getLeaderboard(period, 25);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const myIndex = rows.findIndex((r) => r.user_id === user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-5 py-4">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <Trophy className="h-6 w-6 text-lime-400" />
          Leaderboard
        </h1>
        <p className="mt-1 text-sm text-mist-500">
          Peringkat berdasarkan poin yang dikumpulkan dari gowes.
        </p>
      </header>

      <nav className="flex gap-1.5 rounded-xl border border-ink-700 bg-ink-850 p-1.5">
        {PERIODS.map((item) => (
          <Link
            key={item.key}
            href={`/leaderboard?period=${item.key}`}
            className={`flex-1 rounded-lg px-4 py-2 text-center text-sm transition-colors ${
              period === item.key
                ? "bg-lime-400/10 font-medium text-lime-300"
                : "text-mist-500 hover:bg-ink-800 hover:text-mist-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Card className="px-5 py-16 text-center text-sm text-mist-500">
          Belum ada yang mengumpulkan poin pada periode ini.
        </Card>
      ) : (
        <>
          {/* ---------------- Podium ---------------- */}
          <div className="grid gap-3 sm:grid-cols-3">
            {podium.map((row, index) => {
              const isMe = row.user_id === user.id;
              const heights = ["sm:order-2", "sm:order-1", "sm:order-3"];
              const colors = [
                "border-amber-400/40 bg-amber-400/[0.07]",
                "border-slate-300/30 bg-slate-300/[0.05]",
                "border-orange-500/30 bg-orange-500/[0.06]",
              ];
              return (
                <Card
                  key={row.user_id}
                  className={`${heights[index]} ${colors[index]} flex flex-col items-center p-5 text-center ${
                    isMe ? "ring-1 ring-lime-400/40" : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar
                      name={row.name}
                      src={row.avatar_url}
                      size={index === 0 ? 72 : 60}
                    />
                    {index === 0 && (
                      <Crown className="absolute -top-3 left-1/2 h-6 w-6 -translate-x-1/2 text-amber-300" />
                    )}
                    <span className="absolute -bottom-1 left-1/2 grid h-6 w-6 -translate-x-1/2 place-items-center rounded-full bg-ink-850 text-xs font-semibold ring-1 ring-ink-600">
                      {index + 1}
                    </span>
                  </div>

                  <p className="mt-4 truncate text-sm font-semibold">
                    {row.username}
                  </p>
                  <p className="text-[11px] text-mist-500">{row.name}</p>
                  <p className="mt-2 text-xl font-semibold text-lime-400">
                    {formatNumber(row.points)}
                    <span className="ml-1 text-[10px] font-normal text-mist-500">
                      PTS
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-mist-500">
                    {formatKm(row.distance_m, 0)} km · {row.ride_count} ride
                  </p>
                </Card>
              );
            })}
          </div>

          {/* ---------------- Sisa peringkat ---------------- */}
          {rest.length > 0 && (
            <Card>
              <ul className="divide-y divide-ink-700">
                {rest.map((row, index) => {
                  const rank = index + 4;
                  const isMe = row.user_id === user.id;
                  const level = levelFromXp(row.points);
                  return (
                    <li
                      key={row.user_id}
                      className={`flex items-center gap-3 px-5 py-3.5 ${
                        isMe ? "bg-lime-400/[0.06]" : ""
                      }`}
                    >
                      <span className="w-6 shrink-0 text-center text-sm text-mist-500">
                        {rank}
                      </span>
                      <Avatar name={row.name} src={row.avatar_url} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {row.username}
                          {isMe && (
                            <span className="ml-1.5 text-[10px] text-lime-400">
                              kamu
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-mist-500">
                          {formatKm(row.distance_m, 0)} km ·{" "}
                          {row.co2_kg.toFixed(1)} kg CO₂
                          {period === "all" && ` · Lv ${level.level}`}
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
          )}

          {myIndex === -1 && (
            <Card className="flex items-center gap-3 px-5 py-4">
              <Leaf className="h-4 w-4 shrink-0 text-lime-400" />
              <p className="text-sm text-mist-500">
                Kamu belum masuk peringkat periode ini - satu ride saja sudah
                cukup untuk mulai naik.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
