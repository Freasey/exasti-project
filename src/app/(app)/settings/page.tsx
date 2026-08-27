import type { Metadata } from "next";
import {
  Award,
  Bike,
  Flag,
  Flame,
  Info,
  Leaf,
  Lock,
  Map as MapIcon,
  Medal,
  Mountain,
  Repeat,
  Route as RouteIcon,
  Sparkles,
  TrendingUp,
  Trees,
  UserCog,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { ProfileForm } from "./ProfileForm";
import { requireUser } from "@/lib/auth";
import { getAchievements, getUserRank, getUserTotals } from "@/lib/queries";
import { levelFromXp } from "@/lib/metrics";
import { formatDate, formatKm, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Pengaturan" };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  repeat: Repeat,
  bike: Bike,
  route: RouteIcon,
  map: MapIcon,
  medal: Medal,
  flag: Flag,
  mountain: Mountain,
  leaf: Leaf,
  trees: Trees,
  "trending-up": TrendingUp,
  flame: Flame,
};

export default async function SettingsPage() {
  const user = await requireUser();
  const [achievements, totals, rank] = await Promise.all([
    getAchievements(user.id),
    getUserTotals(user.id),
    getUserRank(user.id),
  ]);

  const level = levelFromXp(user.lifetime_points);
  const unlockedCount = achievements.filter((a) => a.unlocked_at).length;

  return (
    <div className="mx-auto max-w-4xl space-y-5 py-4">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          <UserCog className="h-6 w-6 text-lime-400" />
          Profil &amp; Pengaturan
        </h1>
        <p className="mt-1 text-sm text-mist-500">
          Anggota sejak {formatDate(user.created_at)}
        </p>
      </header>

      {user.is_demo && (
        <p className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Ini akun demo bersama. Data yang kamu ubah di sini bisa dilihat orang
          lain yang juga memakai tombol demo.
        </p>
      )}

      {/* ---------------- Ringkasan ---------------- */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-mist-500">Level {level.level}</p>
            <p className="text-xl font-semibold text-lime-400">{level.title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-mist-500">Peringkat global</p>
            <p className="text-xl font-semibold">#{rank}</p>
          </div>
        </div>
        <Progress value={level.progress} className="mt-4" />
        <p className="mt-2 text-xs text-mist-500">
          {formatNumber(level.xpIntoLevel)} / {formatNumber(level.xpForNext)} XP
          menuju level {level.level + 1}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-ink-700 pt-5 sm:grid-cols-4">
          <Summary label="Ride" value={formatNumber(totals.ride_count)} />
          <Summary label="Jarak" value={`${formatKm(totals.distance_m, 0)} km`} />
          <Summary label="CO₂" value={`${totals.co2_kg.toFixed(1)} kg`} accent />
          <Summary label="Saldo poin" value={formatNumber(user.points_balance)} />
        </dl>
      </Card>

      {/* ---------------- Profil ---------------- */}
      <Card>
        <CardHeader
          icon={<UserCog className="h-[18px] w-[18px]" />}
          title="Informasi profil"
        />
        <div className="border-t border-ink-700 p-5">
          <ProfileForm
            name={user.name}
            username={user.username}
            email={user.email}
            city={user.city}
            bio={user.bio}
            avatarUrl={user.avatar_url}
          />
        </div>
      </Card>

      {/* ---------------- Badge ---------------- */}
      <Card>
        <CardHeader
          icon={<Award className="h-[18px] w-[18px]" />}
          title="Pencapaian"
          action={
            <span className="text-xs text-mist-500">
              {unlockedCount} / {achievements.length} terbuka
            </span>
          }
        />
        <div className="grid gap-3 border-t border-ink-700 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((badge) => {
            const Icon = ICONS[badge.icon] ?? Award;
            const unlocked = Boolean(badge.unlocked_at);
            return (
              <div
                key={badge.code}
                className={`flex items-start gap-3 rounded-xl border p-4 ${
                  unlocked
                    ? "border-lime-400/25 bg-lime-400/[0.06]"
                    : "border-ink-700 bg-ink-800"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 ${
                    unlocked
                      ? "bg-lime-400/10 text-lime-400 ring-lime-400/25"
                      : "bg-ink-850 text-mist-600 ring-ink-700"
                  }`}
                >
                  {unlocked ? (
                    <Icon className="h-5 w-5" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      unlocked ? "" : "text-mist-500"
                    }`}
                  >
                    {badge.name}
                  </p>
                  <p className="mt-0.5 text-xs text-mist-500">
                    {badge.description}
                  </p>
                  {unlocked && badge.unlocked_at && (
                    <p className="mt-1 text-[11px] text-lime-400/80">
                      {formatDate(badge.unlocked_at)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Summary({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-mist-500">{label}</dt>
      <dd
        className={`mt-0.5 text-lg font-semibold ${accent ? "text-lime-400" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
