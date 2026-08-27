import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Droplets,
  Flame,
  Gauge,
  Leaf,
  Mountain,
  Route,
  Timer,
  TreePine,
  Zap,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { KudosButton } from "@/components/KudosButton";
import { RideTitleEditor } from "@/components/RideTitleEditor";
import { RideProfileChart } from "@/components/charts/RideProfileChart";
import { RouteMap } from "@/components/map";
import { requireUser } from "@/lib/auth";
import { getRideById } from "@/lib/queries";
import { fuelLitersFromCo2, treesFromCo2 } from "@/lib/metrics";
import {
  formatDateTime,
  formatDuration,
  formatKm,
  formatNumber,
} from "@/lib/format";

export const metadata: Metadata = { title: "Detail Aktivitas" };

export default async function RideDetailPage({
  params,
}: PageProps<"/activities/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const ride = await getRideById(id, user.id);

  if (!ride || ride.status !== "completed") notFound();

  const isOwner = ride.user_id === user.id;
  const co2 = Number(ride.co2_kg);

  return (
    <div className="mx-auto max-w-5xl space-y-5 py-4">
      <Link
        href="/activities"
        className="inline-flex items-center gap-2 text-sm text-mist-500 transition-colors hover:text-mist-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke aktivitas
      </Link>

      {/* ---------------- Header ---------------- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Avatar name={ride.user_name} src={ride.user_avatar} size={34} />
            <div>
              <p className="text-sm font-medium">{ride.user_name}</p>
              <p className="text-xs text-mist-500">
                {formatDateTime(ride.started_at)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {isOwner ? (
              <RideTitleEditor rideId={ride.id} title={ride.title} note={ride.note} />
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {ride.title}
                </h1>
                {ride.note && (
                  <p className="mt-2 max-w-2xl text-sm text-mist-300">{ride.note}</p>
                )}
              </>
            )}
          </div>
        </div>

        <KudosButton
          rideId={ride.id}
          initialCount={ride.kudos_count}
          initialGiven={ride.kudos_given}
        />
      </header>

      {/* ---------------- Peta + statistik ----------------
          Mobile: peta menumpuk di atas statistik.
          Desktop lebar: peta di kiri, statistik jadi kolom di sampingnya. */}
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="h-[340px] overflow-hidden sm:h-[420px] xl:h-auto xl:min-h-[460px]">
          <RouteMap polyline={ride.polyline} interactive />
        </Card>

        <Card className="grid grid-cols-2 content-start gap-5 p-5 sm:grid-cols-4 xl:grid-cols-2">
          <Stat
            icon={<Route className="h-4 w-4" />}
            label="Jarak"
            value={formatKm(ride.distance_m, 2)}
            unit="km"
            big
          />
          <Stat
            icon={<Timer className="h-4 w-4" />}
            label="Waktu gowes"
            value={formatDuration(ride.moving_s)}
            big
          />
          <Stat
            icon={<Gauge className="h-4 w-4" />}
            label="Kecepatan rata-rata"
            value={Number(ride.avg_speed).toFixed(1)}
            unit="km/j"
            big
          />
          <Stat
            icon={<Leaf className="h-4 w-4" />}
            label="CO₂ dihemat"
            value={co2.toFixed(2)}
            unit="kg"
            big
            accent
          />

          <Stat
            icon={<Zap className="h-4 w-4" />}
            label="Kecepatan maks"
            value={Number(ride.max_speed).toFixed(1)}
            unit="km/j"
          />
          <Stat
            icon={<Mountain className="h-4 w-4" />}
            label="Elevasi"
            value={formatNumber(ride.elev_gain)}
            unit="m"
          />
          <Stat
            icon={<Flame className="h-4 w-4" />}
            label="Kalori"
            value={formatNumber(ride.calories)}
            unit="kkal"
          />
          <Stat
            icon={<Clock className="h-4 w-4" />}
            label="Total durasi"
            value={formatDuration(ride.duration_s)}
          />
        </Card>
      </div>

      {/* ---------------- Dampak ---------------- */}
      <Card>
        <CardHeader
          icon={<Leaf className="h-[18px] w-[18px]" />}
          title="Dampak perjalanan ini"
        />
        <div className="grid gap-4 border-t border-ink-700 p-5 sm:grid-cols-3">
          <Impact
            icon={<TreePine className="h-5 w-5" />}
            value={treesFromCo2(co2).toFixed(2)}
            unit="pohon"
            caption="setara serapan karbon setahun"
          />
          <Impact
            icon={<Droplets className="h-5 w-5" />}
            value={fuelLitersFromCo2(co2).toFixed(2)}
            unit="liter"
            caption="bensin yang tidak terbakar"
          />
          <Impact
            icon={<Leaf className="h-5 w-5" />}
            value={`+${formatNumber(ride.points)}`}
            unit="poin"
            caption="masuk ke saldo rewardmu"
          />
        </div>
      </Card>

      {/* ---------------- Profil rute ---------------- */}
      <Card>
        <CardHeader
          icon={<Mountain className="h-[18px] w-[18px]" />}
          title="Profil rute"
        />
        <div className="border-t border-ink-700">
          <RideProfileChart profile={ride.profile ?? []} />
        </div>
      </Card>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  unit,
  big = false,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  big?: boolean;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-mist-500">
        <span className={accent ? "text-lime-400" : "text-mist-600"}>{icon}</span>
        {label}
      </p>
      <p
        className={`mt-1 font-semibold tracking-tight ${
          big ? "text-2xl" : "text-lg"
        } ${accent ? "text-lime-400" : ""}`}
      >
        {value}
        {unit && (
          <span className="ml-1 text-xs font-normal text-mist-500">{unit}</span>
        )}
      </p>
    </div>
  );
}

function Impact({
  icon,
  value,
  unit,
  caption,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  caption: string;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-ink-700 bg-ink-800 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
        {icon}
      </span>
      <div>
        <p className="text-lg font-semibold">
          {value} <span className="text-xs font-normal text-mist-500">{unit}</span>
        </p>
        <p className="mt-0.5 text-[11px] text-mist-500">{caption}</p>
      </div>
    </div>
  );
}
