import { sql, rows } from "./db";

export type AchievementDef = {
  code: string;
  name: string;
  description: string;
  icon: string;
  metric:
    | "ride_count"
    | "distance_total"
    | "co2_total"
    | "ride_distance"
    | "elev_total";
  threshold: number;
};

/** Katalog badge. Dipakai saat seed dan saat evaluasi setelah ride selesai. */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    code: "first_ride",
    name: "Kayuhan Pertama",
    description: "Selesaikan ride pertamamu",
    icon: "sparkles",
    metric: "ride_count",
    threshold: 1,
  },
  {
    code: "ride_10",
    name: "Konsisten",
    description: "Selesaikan 10 ride",
    icon: "repeat",
    metric: "ride_count",
    threshold: 10,
  },
  {
    code: "ride_50",
    name: "Rider Sejati",
    description: "Selesaikan 50 ride",
    icon: "bike",
    metric: "ride_count",
    threshold: 50,
  },
  {
    code: "dist_50k",
    name: "50 Kilometer",
    description: "Total jarak 50 km",
    icon: "route",
    metric: "distance_total",
    threshold: 50_000,
  },
  {
    code: "dist_250k",
    name: "Penjelajah Kota",
    description: "Total jarak 250 km",
    icon: "map",
    metric: "distance_total",
    threshold: 250_000,
  },
  {
    code: "dist_1000k",
    name: "Seribu Kilometer",
    description: "Total jarak 1.000 km",
    icon: "medal",
    metric: "distance_total",
    threshold: 1_000_000,
  },
  {
    code: "single_20k",
    name: "Metric Half",
    description: "Satu ride sejauh 20 km",
    icon: "flag",
    metric: "ride_distance",
    threshold: 20_000,
  },
  {
    code: "single_50k",
    name: "Century Junior",
    description: "Satu ride sejauh 50 km",
    icon: "mountain",
    metric: "ride_distance",
    threshold: 50_000,
  },
  {
    code: "co2_10",
    name: "Penyelamat Udara",
    description: "Hemat 10 kg CO₂",
    icon: "leaf",
    metric: "co2_total",
    threshold: 10,
  },
  {
    code: "co2_50",
    name: "Setara Sebatang Pohon",
    description: "Hemat 50 kg CO₂",
    icon: "trees",
    metric: "co2_total",
    threshold: 50,
  },
  {
    code: "elev_1000",
    name: "Pendaki",
    description: "Total elevasi 1.000 m",
    icon: "trending-up",
    metric: "elev_total",
    threshold: 1000,
  },
];

/**
 * Cek badge yang baru terbuka untuk user, simpan, dan kembalikan definisinya.
 * Dipanggil setiap kali sebuah ride diselesaikan.
 */
export async function evaluateAchievements(
  userId: string
): Promise<AchievementDef[]> {
  const [stats] = rows<{
    ride_count: number;
    distance_total: number;
    co2_total: number;
    ride_distance: number;
    elev_total: number;
  }>(
    await sql`
      select count(*)::int                  as ride_count,
             coalesce(sum(distance_m), 0)   as distance_total,
             coalesce(sum(co2_kg), 0)       as co2_total,
             coalesce(max(distance_m), 0)   as ride_distance,
             coalesce(sum(elev_gain), 0)    as elev_total
      from rides
      where user_id = ${userId} and status = 'completed'`
  );

  const owned = new Set(
    rows<{ code: string }>(
      await sql`select code from user_achievements where user_id = ${userId}`
    ).map((r) => r.code)
  );

  const unlocked: AchievementDef[] = [];
  for (const def of ACHIEVEMENTS) {
    if (owned.has(def.code)) continue;
    const value = Number(stats?.[def.metric] ?? 0);
    if (value >= def.threshold) unlocked.push(def);
  }

  for (const def of unlocked) {
    await sql`
      insert into user_achievements (user_id, code)
      values (${userId}, ${def.code})
      on conflict do nothing`;
  }

  return unlocked;
}
