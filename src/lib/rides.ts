import { sql, one } from "./db";
import { putTrack } from "./blob";
import { evaluateAchievements, type AchievementDef } from "./achievements";
import {
  buildProfile,
  calcPoints,
  co2FromKm,
  computeRideStats,
  estimateCalories,
  simplifyTrack,
} from "./metrics";
import type { Ride, TrackPoint } from "./types";

/** Ride aktif yang menggantung lebih dari 12 jam dianggap ditinggalkan. */
const STALE_HOURS = 12;

export async function closeStaleRides(userId: string): Promise<void> {
  await sql`
    delete from rides
    where user_id = ${userId}
      and status = 'active'
      and started_at < now() - make_interval(hours => ${STALE_HOURS})`;
}

export async function startRide(
  userId: string,
  title: string
): Promise<Ride> {
  await closeStaleRides(userId);
  // Hanya boleh ada satu sesi aktif per user.
  await sql`delete from rides
            where user_id = ${userId} and status = 'active' and distance_m = 0`;

  const ride = one<Ride>(
    await sql`
      insert into rides (user_id, title, status, started_at)
      values (${userId}, ${title}, 'active', now())
      returning *`
  );
  if (!ride) throw new Error("Gagal membuat sesi ride.");
  return ride;
}

export type LivePing = {
  lat: number;
  lng: number;
  distanceM: number;
  durationS: number;
  movingS: number;
  avgSpeed: number;
  polyline: [number, number][];
};

/**
 * Update ringan tiap beberapa detik dari browser. Angkanya hanya untuk
 * tampilan live; nilai final tetap dihitung ulang di finishRide.
 */
export async function pingRide(
  rideId: string,
  userId: string,
  ping: LivePing
): Promise<void> {
  await sql`
    update rides set
      last_lat   = ${ping.lat},
      last_lng   = ${ping.lng},
      last_ping  = now(),
      distance_m = ${ping.distanceM},
      duration_s = ${Math.round(ping.durationS)},
      moving_s   = ${Math.round(ping.movingS)},
      avg_speed  = ${ping.avgSpeed},
      polyline   = ${JSON.stringify(ping.polyline)}::jsonb
    where id = ${rideId} and user_id = ${userId} and status = 'active'`;
}

export type FinishResult = {
  ride: Ride;
  pointsEarned: number;
  unlocked: AchievementDef[];
};

/**
 * Menutup sesi ride. Statistik dihitung ulang dari track mentah di server,
 * jadi angka yang dikirim client tidak bisa dipakai untuk menambah poin.
 */
export async function finishRide(
  rideId: string,
  userId: string,
  track: TrackPoint[],
  meta: { title?: string; note?: string | null }
): Promise<FinishResult> {
  const stats = computeRideStats(track);
  const km = stats.distanceM / 1000;
  const co2 = co2FromKm(km);
  const points = calcPoints(stats.distanceM, stats.movingS);
  const calories = estimateCalories(stats.avgSpeed, stats.movingS);
  const polyline = simplifyTrack(track);
  const profile = buildProfile(track);
  // Store Blob bersifat privat, jadi yang disimpan adalah pathname-nya.
  const trackPath = track.length > 1 ? await putTrack(rideId, track) : null;

  const last = track[track.length - 1];

  const ride = one<Ride>(
    await sql`
      update rides set
        title      = coalesce(${meta.title ?? null}, title),
        note       = ${meta.note ?? null},
        status     = 'completed',
        ended_at   = now(),
        duration_s = ${stats.durationS},
        moving_s   = ${stats.movingS},
        distance_m = ${stats.distanceM},
        avg_speed  = ${stats.avgSpeed},
        max_speed  = ${stats.maxSpeed},
        elev_gain  = ${stats.elevGain},
        calories   = ${calories},
        co2_kg     = ${co2},
        points     = ${points},
        polyline   = ${JSON.stringify(polyline)}::jsonb,
        profile    = ${JSON.stringify(profile)}::jsonb,
        track_url  = ${trackPath},
        last_lat   = ${last?.lat ?? null},
        last_lng   = ${last?.lng ?? null}
      where id = ${rideId} and user_id = ${userId} and status = 'active'
      returning *`
  );

  if (!ride) throw new Error("Sesi ride tidak ditemukan atau sudah selesai.");

  if (points > 0) await awardPoints(userId, points);
  const unlocked = await evaluateAchievements(userId);

  return { ride, pointsEarned: points, unlocked };
}

export async function awardPoints(userId: string, points: number): Promise<void> {
  await sql`
    update users set
      points_balance  = points_balance + ${points},
      lifetime_points = lifetime_points + ${points}
    where id = ${userId}`;
}

export async function discardRide(
  rideId: string,
  userId: string
): Promise<void> {
  await sql`delete from rides
            where id = ${rideId} and user_id = ${userId} and status = 'active'`;
}

/**
 * Menyimpan ride yang sudah jadi (dipakai seeder & akun demo).
 * Tidak menyentuh Blob supaya seeding tetap cepat.
 */
export async function insertCompletedRide(
  userId: string,
  track: TrackPoint[],
  title: string
): Promise<{ points: number; co2: number; distanceM: number }> {
  const stats = computeRideStats(track);
  const km = stats.distanceM / 1000;
  const co2 = co2FromKm(km);
  const points = calcPoints(stats.distanceM, stats.movingS);
  const calories = estimateCalories(stats.avgSpeed, stats.movingS);
  const polyline = simplifyTrack(track);
  const profile = buildProfile(track);
  const startedAt = new Date(track[0].t).toISOString();
  const endedAt = new Date(track[track.length - 1].t).toISOString();
  const last = track[track.length - 1];

  await sql`
    insert into rides (
      user_id, title, status, started_at, ended_at, duration_s, moving_s,
      distance_m, avg_speed, max_speed, elev_gain, calories, co2_kg, points,
      polyline, profile, last_lat, last_lng
    ) values (
      ${userId}, ${title}, 'completed', ${startedAt}, ${endedAt},
      ${stats.durationS}, ${stats.movingS}, ${stats.distanceM},
      ${stats.avgSpeed}, ${stats.maxSpeed}, ${stats.elevGain},
      ${calories}, ${co2}, ${points},
      ${JSON.stringify(polyline)}::jsonb, ${JSON.stringify(profile)}::jsonb,
      ${last.lat}, ${last.lng}
    )`;

  return { points, co2, distanceM: stats.distanceM };
}
