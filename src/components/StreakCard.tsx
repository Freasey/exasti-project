import { Flame, Minus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatKm } from "@/lib/format";
import {
  STREAK_MIN_DISTANCE_M,
  weekdayLabel,
  type StreakDay,
  type StreakSummary,
} from "@/lib/streak";

/** Kalimat status di bawah deretan hari. */
function statusText(streak: StreakSummary): string {
  if (streak.current === 0) {
    return `Gowes minimal ${formatKm(STREAK_MIN_DISTANCE_M, 0)} km hari ini untuk memulai streak.`;
  }
  if (streak.activeToday) return "Aman — hari ini sudah tercatat.";
  if (streak.restLeft > 0) {
    return "Belum gowes hari ini. Jatah libur masih tersisa, tapi sayang kalau dipakai.";
  }
  return "Jatah libur sudah terpakai. Gowes hari ini supaya streak tidak putus.";
}

export function StreakCard({ streak }: { streak: StreakSummary }) {
  const alive = streak.current > 0;

  return (
    <Card className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ${
            alive
              ? "bg-flame-500/10 text-flame-400 ring-flame-500/25"
              : "bg-ink-800 text-mist-600 ring-ink-700"
          }`}
        >
          <Flame className="h-6 w-6" />
        </span>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-mist-500">
            Streak gowes
          </p>
          <p className="mt-0.5 text-3xl font-semibold tracking-tight">
            {streak.current}
            <span className="ml-1.5 text-sm font-normal text-mist-500">
              hari
            </span>
          </p>
          <p className="mt-0.5 text-xs text-mist-500">
            Rekor terpanjang {streak.longest} hari
          </p>
        </div>
      </div>

      <div className="w-full sm:w-[286px]">
        {/* Grid tujuh kolom, bukan flex: di layar 320px pun titiknya ikut
            mengecil, tidak mendorong halaman jadi bisa digeser ke samping. */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {streak.days.map((day) => (
            <DayDot key={day.date} day={day} />
          ))}
        </div>
        <p
          className={`mt-3 text-xs ${
            streak.atRisk && streak.restLeft === 0
              ? "text-flame-400"
              : "text-mist-500"
          }`}
        >
          {statusText(streak)}
        </p>
      </div>
    </Card>
  );
}

/** Tanggal streak sudah berupa hari kalender, jadi diformat sebagai UTC. */
const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));

function DayDot({ day }: { day: StreakDay }) {
  const base =
    "grid aspect-square w-full max-w-9 place-items-center rounded-xl ring-1 transition-colors";
  const style =
    day.state === "active"
      ? "bg-flame-500/15 text-flame-400 ring-flame-500/30"
      : day.state === "rest"
        ? "bg-ink-800 text-mist-600 ring-ink-600"
        : day.isToday
          ? "bg-ink-800 text-mist-600 ring-lime-400/40"
          : "bg-ink-800 text-mist-600 ring-ink-700";

  const title =
    day.state === "active"
      ? `${dayLabel(day.date)} — ${formatKm(day.distanceM)} km`
      : day.state === "rest"
        ? `${dayLabel(day.date)} — hari libur`
        : `${dayLabel(day.date)} — belum ada ride`;

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      <span className={`${base} ${style}`} title={title}>
        {day.state === "active" ? (
          <Flame className="h-4 w-4" />
        ) : day.state === "rest" ? (
          <Minus className="h-4 w-4" />
        ) : null}
      </span>
      <span className="text-[10px] text-mist-600">{weekdayLabel(day.date)}</span>
    </div>
  );
}
