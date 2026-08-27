import { sql, rows } from "./db";
import { APP_TIMEZONE } from "./constants";

/* ------------------------------------------------------------------ *
 * Aturan streak
 *
 * Sebuah hari dihitung "aktif" kalau total jarak ride yang selesai pada
 * hari itu (menurut zona waktu aplikasi) minimal 1 km. Streak boleh
 * diselingi satu hari libur, tapi jatah itu hanya berlaku sekali per
 * tujuh hari — kalau tidak, gowes selang-seling akan membuat streak
 * berjalan selamanya.
 * ------------------------------------------------------------------ */

/** Jarak minimal dalam sehari supaya hari itu dihitung aktif. */
export const STREAK_MIN_DISTANCE_M = 1000;
/** Jumlah hari libur yang tidak memutus streak dalam satu jendela. */
export const STREAK_REST_ALLOWANCE = 1;
/** Panjang jendela jatah libur, dalam hari. */
export const STREAK_REST_WINDOW_DAYS = 7;
/** Jumlah hari yang ditampilkan pada deretan titik di UI. */
export const STREAK_STRIP_DAYS = 7;

const DAY_MS = 86_400_000;
/** Batas telusur mundur, sekadar penjaga supaya loop tidak liar. */
const MAX_LOOKBACK_DAYS = 3650;

export type ActiveDay = { date: string; distanceM: number };

export type StreakDayState = "active" | "rest" | "missed";

export type StreakDay = {
  date: string;
  state: StreakDayState;
  distanceM: number;
  isToday: boolean;
};

export type StreakSummary = {
  /** Panjang streak yang sedang berjalan, dalam hari aktif. */
  current: number;
  /** Streak terpanjang sepanjang riwayat. */
  longest: number;
  activeToday: boolean;
  /** Streak masih hidup tapi hari ini belum gowes. */
  atRisk: boolean;
  /** Sisa jatah libur pada jendela tujuh hari terakhir. */
  restLeft: number;
  lastActiveDate: string | null;
  /** Tujuh hari terakhir, urut dari yang paling lama. */
  days: StreakDay[];
};

/* ------------------------------------------------------------------ *
 * Helper tanggal — semua tanggal berupa string "YYYY-MM-DD" dan
 * dihitung lewat UTC supaya tidak terpengaruh zona waktu server.
 * ------------------------------------------------------------------ */

/** Tanggal hari ini menurut zona waktu aplikasi. */
export function todayInAppTz(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const toMs = (date: string) => Date.parse(`${date}T00:00:00Z`);

export function shiftDay(date: string, deltaDays: number): string {
  return new Date(toMs(date) + deltaDays * DAY_MS).toISOString().slice(0, 10);
}

/** Selisih hari dari `from` ke `to`; positif kalau `to` lebih baru. */
export function daysBetween(from: string, to: string): number {
  return Math.round((toMs(to) - toMs(from)) / DAY_MS);
}

/** Nama hari singkat untuk label di UI ("Sen", "Sel", ...). */
export function weekdayLabel(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(toMs(date)));
}

/** Jatah libur masih tersedia untuk tanggal ini? */
function canRest(used: string[], date: string): boolean {
  const inWindow = used.filter(
    (d) => Math.abs(daysBetween(d, date)) < STREAK_REST_WINDOW_DAYS
  );
  return inWindow.length < STREAK_REST_ALLOWANCE;
}

/** Streak terpanjang sepanjang riwayat, ditelusuri maju. */
function longestStreak(dates: string[]): number {
  let best = 0;
  let run = 0;
  let rest: string[] = [];
  let prev: string | null = null;

  for (const date of dates) {
    if (prev === null) {
      run = 1;
      rest = [];
    } else {
      const gap = daysBetween(prev, date);
      if (gap === 0) continue; // jaga-jaga kalau ada tanggal ganda
      const restDay = shiftDay(prev, 1);
      if (gap === 1) {
        run++;
      } else if (gap === 2 && canRest(rest, restDay)) {
        rest.push(restDay);
        run++;
      } else {
        run = 1;
        rest = [];
      }
    }
    prev = date;
    if (run > best) best = run;
  }

  return best;
}

/**
 * Menghitung ringkasan streak dari daftar hari aktif (urut menaik).
 * Fungsi murni supaya gampang diuji tanpa database.
 */
export function computeStreak(
  activeDays: ActiveDay[],
  today: string = todayInAppTz()
): StreakSummary {
  const distanceByDay = new Map(activeDays.map((d) => [d.date, d.distanceM]));
  const isActive = (date: string) => distanceByDay.has(date);
  const activeToday = isActive(today);

  // Telusuri mundur dari hari ini. Kalau hari ini belum gowes, mulai dari
  // kemarin tanpa memotong jatah libur — harinya kan belum berakhir.
  const restUsed: string[] = [];
  let current = 0;
  let streakStart: string | null = null;
  let cursor = activeToday ? today : shiftDay(today, -1);

  for (let guard = 0; guard < MAX_LOOKBACK_DAYS; guard++) {
    if (isActive(cursor)) {
      current++;
      streakStart = cursor;
    } else if (canRest(restUsed, cursor)) {
      restUsed.push(cursor);
    } else {
      break;
    }
    cursor = shiftDay(cursor, -1);
  }

  // Hari libur yang tercatat sebelum streak dimulai bukan bagian streak.
  const restInStreak = restUsed.filter(
    (d) => streakStart !== null && daysBetween(streakStart, d) > 0
  );
  const restSet = new Set(restInStreak);

  const restLeft = Math.max(
    0,
    STREAK_REST_ALLOWANCE -
      restInStreak.filter((d) => daysBetween(d, today) < STREAK_REST_WINDOW_DAYS)
        .length
  );

  const days: StreakDay[] = [];
  for (let i = STREAK_STRIP_DAYS - 1; i >= 0; i--) {
    const date = shiftDay(today, -i);
    days.push({
      date,
      distanceM: distanceByDay.get(date) ?? 0,
      state: isActive(date) ? "active" : restSet.has(date) ? "rest" : "missed",
      isToday: date === today,
    });
  }

  return {
    current,
    longest: Math.max(current, longestStreak(activeDays.map((d) => d.date))),
    activeToday,
    atRisk: current > 0 && !activeToday,
    restLeft,
    lastActiveDate:
      activeDays.length > 0 ? activeDays[activeDays.length - 1].date : null,
    days,
  };
}

/**
 * Hari aktif diambil dari tabel rides, dikelompokkan menurut tanggal
 * lokal (bukan UTC) supaya ride subuh tidak jatuh ke hari sebelumnya.
 */
export async function getActiveDays(userId: string): Promise<ActiveDay[]> {
  const list = rows<{ date: string; distance_m: string | number }>(
    await sql`
      select to_char(started_at at time zone ${APP_TIMEZONE}::text, 'YYYY-MM-DD') as date,
             sum(distance_m) as distance_m
      from rides
      where user_id = ${userId} and status = 'completed'
      group by 1
      having sum(distance_m) >= ${STREAK_MIN_DISTANCE_M}::double precision
      order by 1 asc`
  );

  return list.map((r) => ({ date: r.date, distanceM: Number(r.distance_m) }));
}

export async function getStreak(
  userId: string,
  now: Date = new Date()
): Promise<StreakSummary> {
  return computeStreak(await getActiveDays(userId), todayInAppTz(now));
}
