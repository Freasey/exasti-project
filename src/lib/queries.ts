import "server-only";
import { sql, rows, one } from "./db";
import type { BBox, BikeLane } from "./bike-lanes";
import type {
  Achievement,
  Redemption,
  Reward,
  Ride,
  RideWithUser,
} from "./types";

/* ------------------------------------------------------------------ *
 * Ringkasan pribadi
 * ------------------------------------------------------------------ */

export type UserTotals = {
  ride_count: number;
  distance_m: number;
  moving_s: number;
  co2_kg: number;
  points: number;
  elev_gain: number;
  max_speed: number;
  longest_ride_m: number;
};

const ZERO_TOTALS: UserTotals = {
  ride_count: 0,
  distance_m: 0,
  moving_s: 0,
  co2_kg: 0,
  points: 0,
  elev_gain: 0,
  max_speed: 0,
  longest_ride_m: 0,
};

function numify(t: Record<string, unknown> | null): UserTotals {
  if (!t) return ZERO_TOTALS;
  return {
    ride_count: Number(t.ride_count ?? 0),
    distance_m: Number(t.distance_m ?? 0),
    moving_s: Number(t.moving_s ?? 0),
    co2_kg: Number(t.co2_kg ?? 0),
    points: Number(t.points ?? 0),
    elev_gain: Number(t.elev_gain ?? 0),
    max_speed: Number(t.max_speed ?? 0),
    longest_ride_m: Number(t.longest_ride_m ?? 0),
  };
}

export async function getUserTotals(
  userId: string,
  since?: Date,
  until?: Date
): Promise<UserTotals> {
  const result = await sql`
    select count(*)                      as ride_count,
           coalesce(sum(distance_m), 0)  as distance_m,
           coalesce(sum(moving_s), 0)    as moving_s,
           coalesce(sum(co2_kg), 0)      as co2_kg,
           coalesce(sum(points), 0)      as points,
           coalesce(sum(elev_gain), 0)   as elev_gain,
           coalesce(max(max_speed), 0)   as max_speed,
           coalesce(max(distance_m), 0)  as longest_ride_m
    from rides
    where user_id = ${userId}
      and status = 'completed'
      and started_at >= coalesce(${since?.toISOString() ?? null}::timestamptz, '-infinity')
      and started_at <  coalesce(${until?.toISOString() ?? null}::timestamptz, 'infinity')`;

  return numify(one<Record<string, unknown>>(result));
}

/** Awal bulan berjalan dan awal bulan lalu, untuk perbandingan tren. */
export function monthBounds(): { thisMonth: Date; lastMonth: Date } {
  const thisMonth = new Date();
  thisMonth.setDate(1);
  thisMonth.setHours(0, 0, 0, 0);
  const lastMonth = new Date(thisMonth);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  return { thisMonth, lastMonth };
}

/* ------------------------------------------------------------------ *
 * Deret waktu untuk grafik dampak lingkungan
 * ------------------------------------------------------------------ */

export type ImpactRange = "week" | "month" | "year";

export type ImpactPoint = {
  date: string;
  label: string;
  co2: number; // kumulatif dalam rentang
  daily: number;
  distance: number; // meter, per bucket
};

const RANGE_DAYS: Record<ImpactRange, number> = {
  week: 7,
  month: 30,
  year: 365,
};

export async function getImpactSeries(
  userId: string,
  range: ImpactRange
): Promise<ImpactPoint[]> {
  const days = RANGE_DAYS[range];
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const list = rows<{ started_at: string; co2_kg: number; distance_m: number }>(
    await sql`
      select started_at, co2_kg, distance_m
      from rides
      where user_id = ${userId} and status = 'completed'
        and started_at >= ${since.toISOString()}
      order by started_at asc`
  );

  const monthly = range === "year";
  const buckets = new Map<string, { co2: number; distance: number }>();

  const keyOf = (d: Date) =>
    monthly
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;

  // Siapkan bucket kosong lebih dulu supaya garis grafik tetap kontinu.
  if (monthly) {
    const cursor = new Date();
    cursor.setDate(1);
    cursor.setMonth(cursor.getMonth() - 11);
    for (let i = 0; i < 12; i++) {
      buckets.set(keyOf(cursor), { co2: 0, distance: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = new Date(since);
    for (let i = 0; i < days; i++) {
      buckets.set(keyOf(cursor), { co2: 0, distance: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  for (const ride of list) {
    const bucket = buckets.get(keyOf(new Date(ride.started_at)));
    if (!bucket) continue;
    bucket.co2 += Number(ride.co2_kg);
    bucket.distance += Number(ride.distance_m);
  }

  const fmtDay = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  });
  const fmtMonth = new Intl.DateTimeFormat("id-ID", { month: "short" });

  let cumulative = 0;
  return [...buckets.entries()].map(([key, value]) => {
    cumulative += value.co2;
    const date = monthly ? new Date(`${key}-01`) : new Date(key);
    return {
      date: key,
      label: monthly ? fmtMonth.format(date) : fmtDay.format(date),
      co2: Number(cumulative.toFixed(2)),
      daily: Number(value.co2.toFixed(2)),
      distance: Math.round(value.distance),
    };
  });
}

/* ------------------------------------------------------------------ *
 * Ride
 * ------------------------------------------------------------------ */

export async function getRecentRides(userId: string, limit = 5): Promise<Ride[]> {
  return rows<Ride>(
    await sql`
      select * from rides
      where user_id = ${userId} and status = 'completed'
      order by started_at desc
      limit ${limit}`
  );
}

export async function getRidesPage(
  userId: string,
  limit: number,
  offset: number
): Promise<{ items: Ride[]; total: number }> {
  const items = rows<Ride>(
    await sql`
      select * from rides
      where user_id = ${userId} and status = 'completed'
      order by started_at desc
      limit ${limit} offset ${offset}`
  );
  const count = one<{ count: number }>(
    await sql`select count(*)::int as count from rides
              where user_id = ${userId} and status = 'completed'`
  );
  return { items, total: Number(count?.count ?? 0) };
}

export async function getRideById(
  rideId: string,
  viewerId: string
): Promise<RideWithUser | null> {
  return one<RideWithUser>(
    await sql`
      select r.*,
             u.name       as user_name,
             u.username   as username,
             u.avatar_url as user_avatar,
             (select count(*)::int from kudos k where k.ride_id = r.id) as kudos_count,
             exists(select 1 from kudos k
                    where k.ride_id = r.id and k.user_id = ${viewerId}) as kudos_given
      from rides r
      join users u on u.id = r.user_id
      where r.id = ${rideId}
      limit 1`
  );
}

/** Ride yang belum diselesaikan milik user (untuk melanjutkan sesi). */
export async function getActiveRide(userId: string): Promise<Ride | null> {
  return one<Ride>(
    await sql`
      select * from rides
      where user_id = ${userId} and status = 'active'
      order by started_at desc
      limit 1`
  );
}

/** Feed komunitas: ride terbaru dari semua rider. */
export async function getFeed(viewerId: string, limit = 12): Promise<RideWithUser[]> {
  return rows<RideWithUser>(
    await sql`
      select r.*,
             u.name       as user_name,
             u.username   as username,
             u.avatar_url as user_avatar,
             (select count(*)::int from kudos k where k.ride_id = r.id) as kudos_count,
             exists(select 1 from kudos k
                    where k.ride_id = r.id and k.user_id = ${viewerId}) as kudos_given
      from rides r
      join users u on u.id = r.user_id
      where r.status = 'completed' and r.distance_m > 0
      order by r.started_at desc
      limit ${limit}`
  );
}

/* ------------------------------------------------------------------ *
 * Analytics
 * ------------------------------------------------------------------ */

export type AnalyticsRide = {
  started_at: string;
  distance_m: number;
  moving_s: number;
  co2_kg: number;
  elev_gain: number;
  avg_speed: number;
  max_speed: number;
  points: number;
  calories: number;
};

export async function getAnalyticsRides(
  userId: string,
  since: Date
): Promise<AnalyticsRide[]> {
  return rows<AnalyticsRide>(
    await sql`
      select started_at, distance_m, moving_s, co2_kg, elev_gain,
             avg_speed, max_speed, points, calories
      from rides
      where user_id = ${userId} and status = 'completed'
        and started_at >= ${since.toISOString()}
      order by started_at asc`
  );
}

/** Polyline untuk heatmap rute - dibatasi agar payload tetap kecil. */
export async function getRoutePolylines(
  userId: string,
  since: Date,
  limit = 60
): Promise<[number, number][][]> {
  const result = rows<{ polyline: [number, number][] }>(
    await sql`
      select polyline from rides
      where user_id = ${userId} and status = 'completed'
        and started_at >= ${since.toISOString()}
        and jsonb_array_length(polyline) > 1
      order by started_at desc
      limit ${limit}`
  );

  // Ambil tiap titik ke-3 saja: bentuk rute tetap terbaca, payload jauh ringan.
  return result.map((r) => r.polyline.filter((_, i) => i % 3 === 0));
}

/* ------------------------------------------------------------------ *
 * Live riders
 * ------------------------------------------------------------------ */

export type LiveRider = {
  ride_id: string;
  user_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  lat: number;
  lng: number;
  distance_m: number;
  moving_s: number;
  avg_speed: number;
  started_at: string;
  last_ping: string;
  polyline: [number, number][];
};

/** Rider dengan ping < 5 menit terakhir dianggap sedang gowes. */
export async function getLiveRiders(limit = 50): Promise<LiveRider[]> {
  return rows<LiveRider>(
    await sql`
      select r.id as ride_id, r.user_id, u.name, u.username, u.avatar_url,
             r.last_lat as lat, r.last_lng as lng,
             r.distance_m, r.moving_s, r.avg_speed,
             r.started_at, r.last_ping, r.polyline
      from rides r
      join users u on u.id = r.user_id
      where r.status = 'active'
        and r.last_lat is not null
        and r.last_ping > now() - interval '5 minutes'
      order by r.last_ping desc
      limit ${limit}`
  );
}

/* ------------------------------------------------------------------ *
 * Leaderboard
 * ------------------------------------------------------------------ */

export type LeaderboardRow = {
  user_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  distance_m: number;
  co2_kg: number;
  ride_count: number;
};

export type LeaderboardPeriod = "week" | "month" | "all";

export async function getLeaderboard(
  period: LeaderboardPeriod,
  limit = 20
): Promise<LeaderboardRow[]> {
  if (period === "all") {
    return rows<LeaderboardRow>(
      await sql`
        select u.id as user_id, u.name, u.username, u.avatar_url,
               u.lifetime_points as points,
               coalesce(sum(r.distance_m), 0) as distance_m,
               coalesce(sum(r.co2_kg), 0)     as co2_kg,
               count(r.id)::int               as ride_count
        from users u
        left join rides r on r.user_id = u.id and r.status = 'completed'
        group by u.id
        order by u.lifetime_points desc, distance_m desc
        limit ${limit}`
    );
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (period === "week" ? 7 : 30));

  return rows<LeaderboardRow>(
    await sql`
      select u.id as user_id, u.name, u.username, u.avatar_url,
             coalesce(sum(r.points), 0)::int as points,
             coalesce(sum(r.distance_m), 0)  as distance_m,
             coalesce(sum(r.co2_kg), 0)      as co2_kg,
             count(r.id)::int                as ride_count
      from users u
      left join rides r
        on r.user_id = u.id
       and r.status = 'completed'
       and r.started_at >= ${since.toISOString()}
      group by u.id
      having coalesce(sum(r.points), 0) > 0
      order by points desc, distance_m desc
      limit ${limit}`
  );
}

/** Posisi user di leaderboard all-time (1-based). */
export async function getUserRank(userId: string): Promise<number> {
  const row = one<{ rank: number }>(
    await sql`
      select count(*)::int + 1 as rank
      from users
      where lifetime_points > (select lifetime_points from users where id = ${userId})`
  );
  return Number(row?.rank ?? 1);
}

/* ------------------------------------------------------------------ *
 * Rewards
 * ------------------------------------------------------------------ */

export async function getRewards(): Promise<Reward[]> {
  return rows<Reward>(
    await sql`select * from rewards where active = true
              order by sort_order asc, points_cost asc`
  );
}

export async function getRedemptions(userId: string): Promise<Redemption[]> {
  return rows<Redemption>(
    await sql`
      select rd.*, rw.brand, rw.title, rw.value_label, rw.accent
      from redemptions rd
      join rewards rw on rw.id = rd.reward_id
      where rd.user_id = ${userId}
      order by rd.created_at desc
      limit 50`
  );
}

/* ------------------------------------------------------------------ *
 * Achievements
 * ------------------------------------------------------------------ */

export async function getAchievements(userId: string): Promise<Achievement[]> {
  return rows<Achievement>(
    await sql`
      select a.*, ua.unlocked_at
      from achievements a
      left join user_achievements ua
        on ua.code = a.code and ua.user_id = ${userId}
      order by a.sort_order asc`
  );
}

/* ------------------------------------------------------------------ *
 * Green Route - jalur ramah sepeda (OpenStreetMap, ODbL)
 * ------------------------------------------------------------------ */

/**
 * Jalur sepeda yang bersinggungan dengan viewport peta.
 *
 * Dua bbox bersinggungan bila saling tumpang tindih di kedua sumbu - itulah
 * bentuk perbandingan di bawah, dan alasan indeks `bike_lanes_bbox_idx`
 * mencakup keempat kolom sekaligus. Saat hasil melebihi `limit`, jalur yang
 * paling terlindung didahulukan supaya yang terpotong adalah yang paling
 * tidak informatif.
 */
export async function getBikeLanes(
  box: BBox,
  limit = 1_200
): Promise<BikeLane[]> {
  return rows<BikeLane>(
    await sql`
      select osm_id, name, kind, surface, geom
      from bike_lanes
      where min_lat <= ${box.north} and max_lat >= ${box.south}
        and min_lng <= ${box.east}  and max_lng >= ${box.west}
      order by case kind
                 when 'protected' then 0
                 when 'lane'      then 1
                 else 2
               end,
               osm_id
      limit ${limit}`
  );
}
