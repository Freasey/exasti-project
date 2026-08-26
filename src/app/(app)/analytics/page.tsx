import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Bike,
  CalendarDays,
  Clock,
  Flame,
  Gauge,
  Leaf,
  Map as MapIcon,
  Mountain,
  Route,
  Sunrise,
  Trophy,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { SimpleBarChart, type BarDatum } from "@/components/charts/SimpleBarChart";
import { HeatMap } from "@/components/map";
import { requireUser } from "@/lib/auth";
import { getAnalyticsRides, getRoutePolylines } from "@/lib/queries";
import { fuelLitersFromCo2, treesFromCo2 } from "@/lib/metrics";
import { formatDurationShort, formatKm, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Analytics & Maps" };

const PERIODS = [
  { key: "30", label: "30 hari", days: 30 },
  { key: "90", label: "90 hari", days: 90 },
  { key: "365", label: "1 tahun", days: 365 },
];

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default async function AnalyticsPage({
  searchParams,
}: PageProps<"/analytics">) {
  const params = await searchParams;
  const raw = Array.isArray(params.period) ? params.period[0] : params.period;
  const period = PERIODS.find((p) => p.key === raw) ?? PERIODS[0];

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (period.days - 1));

  const user = await requireUser();
  const [rides, routes] = await Promise.all([
    getAnalyticsRides(user.id, since),
    getRoutePolylines(user.id, since),
  ]);

  /* ---------------- agregasi ---------------- */
  const totals = rides.reduce(
    (acc, r) => ({
      distance: acc.distance + Number(r.distance_m),
      moving: acc.moving + Number(r.moving_s),
      co2: acc.co2 + Number(r.co2_kg),
      elev: acc.elev + Number(r.elev_gain),
      calories: acc.calories + Number(r.calories),
      points: acc.points + Number(r.points),
    }),
    { distance: 0, moving: 0, co2: 0, elev: 0, calories: 0, points: 0 }
  );

  const avgSpeed = totals.moving > 0 ? (totals.distance / totals.moving) * 3.6 : 0;
  const maxSpeed = rides.reduce((m, r) => Math.max(m, Number(r.max_speed)), 0);
  const longest = rides.reduce((m, r) => Math.max(m, Number(r.distance_m)), 0);

  // jarak per minggu (8 bucket terakhir dalam rentang)
  const weekly = buildWeekly(rides, period.days);

  // distribusi hari dalam seminggu
  const byWeekday: BarDatum[] = WEEKDAYS.map((label, index) => ({
    label,
    value:
      rides
        .filter((r) => new Date(r.started_at).getDay() === index)
        .reduce((sum, r) => sum + Number(r.distance_m), 0) / 1000,
  }));

  // distribusi jam mulai
  const buckets = [
    { label: "05–09", from: 5, to: 9 },
    { label: "09–12", from: 9, to: 12 },
    { label: "12–15", from: 12, to: 15 },
    { label: "15–19", from: 15, to: 19 },
    { label: "19–23", from: 19, to: 23 },
    { label: "23–05", from: 23, to: 29 },
  ];
  const byHour: BarDatum[] = buckets.map((b) => ({
    label: b.label,
    value: rides.filter((r) => {
      const h = new Date(r.started_at).getHours();
      const shifted = h < 5 ? h + 24 : h;
      return shifted >= b.from && shifted < b.to;
    }).length,
  }));

  const favouriteDay =
    byWeekday.reduce(
      (best, d, i) => (d.value > byWeekday[best].value ? i : best),
      0
    );

  return (
    <div className="mx-auto max-w-6xl space-y-5 py-4">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
            <MapIcon className="h-6 w-6 text-lime-400" />
            Analytics &amp; Maps
          </h1>
          <p className="mt-1 text-sm text-mist-500">
            Rekap performa dan rute favoritmu.
          </p>
        </div>

        <nav className="flex gap-1.5 rounded-xl border border-ink-700 bg-ink-850 p-1.5">
          {PERIODS.map((item) => (
            <Link
              key={item.key}
              href={`/analytics?period=${item.key}`}
              className={`rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
                period.key === item.key
                  ? "bg-lime-400/10 font-medium text-lime-300"
                  : "text-mist-500 hover:bg-ink-800 hover:text-mist-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {rides.length === 0 ? (
        <Card className="px-5 py-20 text-center">
          <Activity className="mx-auto h-8 w-8 text-mist-600" />
          <p className="mt-3 text-mist-300">
            Belum ada data pada rentang {period.label.toLowerCase()}.
          </p>
        </Card>
      ) : (
        <>
          {/* ---------------- KPI ---------------- */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi
              icon={<Route className="h-4 w-4" />}
              label="Total jarak"
              value={formatKm(totals.distance, 1)}
              unit="km"
              accent
            />
            <Kpi
              icon={<Bike className="h-4 w-4" />}
              label="Jumlah ride"
              value={formatNumber(rides.length)}
            />
            <Kpi
              icon={<Clock className="h-4 w-4" />}
              label="Waktu gowes"
              value={formatDurationShort(totals.moving)}
            />
            <Kpi
              icon={<Leaf className="h-4 w-4" />}
              label="CO₂ dihemat"
              value={totals.co2.toFixed(1)}
              unit="kg"
              accent
            />
            <Kpi
              icon={<Gauge className="h-4 w-4" />}
              label="Kecepatan rata-rata"
              value={avgSpeed.toFixed(1)}
              unit="km/j"
            />
            <Kpi
              icon={<Mountain className="h-4 w-4" />}
              label="Total elevasi"
              value={formatNumber(totals.elev)}
              unit="m"
            />
            <Kpi
              icon={<Flame className="h-4 w-4" />}
              label="Kalori terbakar"
              value={formatNumber(totals.calories)}
              unit="kkal"
            />
            <Kpi
              icon={<Trophy className="h-4 w-4" />}
              label="Poin diperoleh"
              value={formatNumber(totals.points)}
              unit="PTS"
              accent
            />
          </div>

          {/* ---------------- Grafik ---------------- */}
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader
                icon={<CalendarDays className="h-[18px] w-[18px]" />}
                title="Jarak per minggu"
              />
              <div className="border-t border-ink-700 p-5">
                <SimpleBarChart data={weekly} unit="km" />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<Activity className="h-[18px] w-[18px]" />}
                title="Jarak per hari dalam seminggu"
                action={
                  <span className="text-xs text-mist-500">
                    Favorit: {WEEKDAYS[favouriteDay]}
                  </span>
                }
              />
              <div className="border-t border-ink-700 p-5">
                <SimpleBarChart data={byWeekday} unit="km" />
              </div>
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <Card>
              <CardHeader
                icon={<Sunrise className="h-[18px] w-[18px]" />}
                title="Jam favorit gowes"
              />
              <div className="border-t border-ink-700 p-5">
                <SimpleBarChart
                  data={byHour}
                  unit="ride"
                  height={200}
                  decimals={0}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<MapIcon className="h-[18px] w-[18px]" />}
                title="Peta rute favorit"
                action={
                  <span className="text-xs text-mist-500">
                    {routes.length} rute terakhir
                  </span>
                }
              />
              <div className="h-[320px] border-t border-ink-700">
                <HeatMap routes={routes} />
              </div>
            </Card>
          </div>

          {/* ---------------- Rekor ---------------- */}
          <Card>
            <CardHeader
              icon={<Trophy className="h-[18px] w-[18px]" />}
              title="Rekor pada rentang ini"
            />
            <div className="grid gap-4 border-t border-ink-700 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <Record label="Ride terjauh" value={`${formatKm(longest, 2)} km`} />
              <Record
                label="Kecepatan tertinggi"
                value={`${maxSpeed.toFixed(1)} km/j`}
              />
              <Record
                label="Setara pohon"
                value={`${treesFromCo2(totals.co2).toFixed(1)} pohon`}
              />
              <Record
                label="BBM dihemat"
                value={`${fuelLitersFromCo2(totals.co2).toFixed(1)} liter`}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/** Membagi ride ke dalam bucket mingguan untuk grafik batang. */
function buildWeekly(
  rides: { started_at: string; distance_m: number }[],
  days: number
): BarDatum[] {
  const weeks = Math.min(12, Math.max(4, Math.round(days / 7)));
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  const out: BarDatum[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const value =
      rides
        .filter((r) => {
          const t = new Date(r.started_at).getTime();
          return t >= start.getTime() && t <= end.getTime();
        })
        .reduce((sum, r) => sum + Number(r.distance_m), 0) / 1000;

    out.push({
      label: new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      }).format(start),
      value: Number(value.toFixed(1)),
      highlight: i === 0,
    });
  }
  return out;
}

function Kpi({
  icon,
  label,
  value,
  unit,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="flex items-center gap-1.5 text-xs text-mist-500">
        <span className={accent ? "text-lime-400" : "text-mist-600"}>{icon}</span>
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-semibold tracking-tight ${
          accent ? "text-lime-400" : ""
        }`}
      >
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal text-mist-500">{unit}</span>
        )}
      </p>
    </Card>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-800 p-4">
      <p className="text-xs text-mist-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
