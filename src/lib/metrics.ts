import type { ProfilePoint, TrackPoint } from "./types";

/* ------------------------------------------------------------------ *
 * Konstanta dampak lingkungan
 * ------------------------------------------------------------------ */

/** Emisi rata-rata mobil penumpang bensin (kg CO2 per km) yang dihindari. */
export const CO2_KG_PER_KM = 0.192;
/** Pembakaran 1 liter bensin melepas ~2.44 kg CO2. */
export const CO2_KG_PER_LITER = 2.44;
/** Satu pohon dewasa menyerap ~14.25 kg CO2 per tahun. */
export const CO2_KG_PER_TREE = 14.25;

export const co2FromKm = (km: number) => km * CO2_KG_PER_KM;
export const fuelLitersFromCo2 = (co2Kg: number) => co2Kg / CO2_KG_PER_LITER;
export const treesFromCo2 = (co2Kg: number) => co2Kg / CO2_KG_PER_TREE;

/* ------------------------------------------------------------------ *
 * Geo
 * ------------------------------------------------------------------ */

const R = 6_371_000; // radius bumi (m)
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Jarak great-circle antara dua koordinat, dalam meter. */
export function haversine(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ------------------------------------------------------------------ *
 * Statistik ride — dihitung ulang di server dari track mentah,
 * jadi angka dari client tidak bisa dipakai untuk curang.
 * ------------------------------------------------------------------ */

export type RideStats = {
  distanceM: number;
  durationS: number;
  movingS: number;
  avgSpeed: number; // km/h (berbasis moving time)
  maxSpeed: number; // km/h
  elevGain: number; // meter
};

/** Lompatan tak masuk akal (> 40 m/s ~ 144 km/h) dianggap noise GPS. */
const MAX_PLAUSIBLE_MPS = 40;
/** Di bawah kecepatan ini rider dianggap berhenti (tidak dihitung moving time). */
const MOVING_THRESHOLD_MPS = 0.8;
/** Kenaikan minimal yang dihitung sebagai tanjakan (meter). */
const ELEV_THRESHOLD_M = 3;

/** Rata-rata bergerak untuk meredam noise altimeter GPS (±1-3 m). */
function smoothAltitudes(track: TrackPoint[], window = 5): (number | null)[] {
  const raw = track.map((p) => (typeof p.alt === "number" ? p.alt : null));
  const half = Math.floor(window / 2);
  return raw.map((value, i) => {
    if (value === null) return null;
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(raw.length - 1, i + half); j++) {
      const v = raw[j];
      if (v !== null) {
        sum += v;
        count++;
      }
    }
    return count > 0 ? sum / count : null;
  });
}

/**
 * Total tanjakan dengan histeresis: naik-turun kecil akibat noise diabaikan,
 * hanya kenaikan bersih >= ELEV_THRESHOLD_M yang dihitung.
 */
function elevationGain(track: TrackPoint[]): number {
  const alts = smoothAltitudes(track);
  let gain = 0;
  let reference: number | null = null;

  for (const alt of alts) {
    if (alt === null) continue;
    if (reference === null) {
      reference = alt;
      continue;
    }
    if (alt >= reference + ELEV_THRESHOLD_M) {
      gain += alt - reference;
      reference = alt;
    } else if (alt < reference) {
      reference = alt;
    }
  }
  return gain;
}

export function computeRideStats(track: TrackPoint[]): RideStats {
  if (track.length < 2) {
    return {
      distanceM: 0,
      durationS: 0,
      movingS: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      elevGain: 0,
    };
  }

  let distanceM = 0;
  let movingMs = 0;
  let maxMps = 0;

  for (let i = 1; i < track.length; i++) {
    const prev = track[i - 1];
    const cur = track[i];
    const dt = (cur.t - prev.t) / 1000;
    if (dt <= 0) continue;

    const d = haversine(prev.lat, prev.lng, cur.lat, cur.lng);
    const mps = d / dt;
    if (mps > MAX_PLAUSIBLE_MPS) continue; // buang lompatan GPS

    distanceM += d;
    if (mps > maxMps) maxMps = mps;
    if (mps >= MOVING_THRESHOLD_MPS) movingMs += dt * 1000;
  }

  const durationS = Math.max(
    0,
    Math.round((track[track.length - 1].t - track[0].t) / 1000)
  );
  const movingS = Math.round(movingMs / 1000);
  const avgSpeed = movingS > 0 ? (distanceM / movingS) * 3.6 : 0;

  return {
    distanceM,
    durationS,
    movingS,
    avgSpeed,
    maxSpeed: maxMps * 3.6,
    elevGain: elevationGain(track),
  };
}

/* ------------------------------------------------------------------ *
 * Kalori — pendekatan MET sederhana (asumsi berat rider 70 kg)
 * ------------------------------------------------------------------ */

const RIDER_WEIGHT_KG = 70;

function metFromSpeed(kmh: number): number {
  if (kmh < 16) return 4;
  if (kmh < 19) return 6.8;
  if (kmh < 22) return 8;
  if (kmh < 25) return 10;
  if (kmh < 30) return 12;
  return 15.8;
}

export function estimateCalories(avgSpeedKmh: number, movingS: number): number {
  const hours = movingS / 3600;
  return Math.round(metFromSpeed(avgSpeedKmh) * RIDER_WEIGHT_KG * hours);
}

/* ------------------------------------------------------------------ *
 * Poin & level
 * ------------------------------------------------------------------ */

/** 10 poin / km + 1 poin / menit gowes + bonus jarak jauh. */
export function calcPoints(distanceM: number, movingS: number): number {
  const km = distanceM / 1000;
  let pts = km * 10 + (movingS / 60) * 1;
  if (km >= 10) pts += 50;
  if (km >= 25) pts += 100;
  return Math.max(0, Math.round(pts));
}

/** XP yang dibutuhkan untuk naik dari `level` ke `level + 1`. */
export const xpForLevel = (level: number) => 250 * level;

export type LevelInfo = {
  level: number;
  title: string;
  xpIntoLevel: number;
  xpForNext: number;
  progress: number; // 0..1
};

const TITLES: [number, string][] = [
  [40, "Planet Guardian"],
  [25, "Carbon Slayer"],
  [15, "Eco Champion"],
  [10, "Eco Rider"],
  [5, "Green Rider"],
  [1, "Green Rookie"],
];

export function levelTitle(level: number): string {
  return TITLES.find(([min]) => level >= min)?.[1] ?? "Green Rookie";
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp));
  while (remaining >= xpForLevel(level) && level < 999) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  const xpForNext = xpForLevel(level);
  return {
    level,
    title: levelTitle(level),
    xpIntoLevel: remaining,
    xpForNext,
    progress: xpForNext > 0 ? remaining / xpForNext : 0,
  };
}

/* ------------------------------------------------------------------ *
 * Penyederhanaan jalur (Ramer–Douglas–Peucker)
 * Track penuh disimpan di Vercel Blob; versi ringkas ini masuk Postgres
 * supaya preview peta di list/dashboard tetap cepat.
 * ------------------------------------------------------------------ */

type LatLng = [number, number];

function perpendicularDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const [x, y] = p;
  const [x1, y1] = a;
  const [x2, y2] = b;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (x1 + clamped * dx), y - (y1 + clamped * dy));
}

function rdp(points: LatLng[], epsilon: number): LatLng[] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    );
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= epsilon) return [points[0], points[points.length - 1]];
  const left = rdp(points.slice(0, index + 1), epsilon);
  const right = rdp(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

/** Kompres track jadi maksimal `maxPoints` titik untuk disimpan di DB. */
export function simplifyTrack(
  track: TrackPoint[],
  maxPoints = 300
): LatLng[] {
  const pts: LatLng[] = track.map((p) => [
    Number(p.lat.toFixed(6)),
    Number(p.lng.toFixed(6)),
  ]);
  if (pts.length <= maxPoints) return pts;

  let epsilon = 0.00002; // ~2 m
  let out = rdp(pts, epsilon);
  let guard = 0;
  while (out.length > maxPoints && guard < 20) {
    epsilon *= 1.8;
    out = rdp(pts, epsilon);
    guard++;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Profil ride untuk grafik elevasi & kecepatan
 *
 * Track penuh disimpan di Vercel Blob, tapi halaman detail butuh data
 * ringan yang selalu tersedia — jadi track diringkas jadi ~120 sampel
 * dan ikut disimpan di Postgres.
 * ------------------------------------------------------------------ */

export function buildProfile(track: TrackPoint[], samples = 120): ProfilePoint[] {
  if (track.length < 2) return [];

  // jarak kumulatif per titik (lompatan GPS diabaikan)
  const cumulative: number[] = [0];
  for (let i = 1; i < track.length; i++) {
    const dt = (track[i].t - track[i - 1].t) / 1000;
    const d = haversine(
      track[i - 1].lat,
      track[i - 1].lng,
      track[i].lat,
      track[i].lng
    );
    const jump = dt > 0 && d / dt > MAX_PLAUSIBLE_MPS;
    cumulative.push(cumulative[i - 1] + (jump ? 0 : d));
  }

  const step = Math.max(1, Math.floor(track.length / samples));
  const smoothed = smoothAltitudes(track);
  const out: ProfilePoint[] = [];

  for (let i = 0; i < track.length; i += step) {
    const from = Math.max(0, i - step);
    const dt = (track[i].t - track[from].t) / 1000;
    const dd = cumulative[i] - cumulative[from];
    out.push({
      d: Math.round(cumulative[i]),
      alt: smoothed[i] === null ? null : Number(smoothed[i]!.toFixed(1)),
      spd: dt > 0 ? Number(((dd / dt) * 3.6).toFixed(1)) : 0,
    });
  }
  return out;
}

/** Waktu tempuh tiap kilometer — tabel "splits" ala aplikasi lari/sepeda. */
export type Split = { km: number; seconds: number; speed: number };

export function buildSplits(track: TrackPoint[]): Split[] {
  if (track.length < 2) return [];

  const splits: Split[] = [];
  let distance = 0;
  let markStart = track[0].t;
  let nextMark = 1000;

  for (let i = 1; i < track.length; i++) {
    const dt = (track[i].t - track[i - 1].t) / 1000;
    if (dt <= 0) continue;
    const d = haversine(track[i - 1].lat, track[i - 1].lng, track[i].lat, track[i].lng);
    if (d / dt > MAX_PLAUSIBLE_MPS) continue;
    distance += d;

    while (distance >= nextMark) {
      const seconds = (track[i].t - markStart) / 1000;
      splits.push({
        km: nextMark / 1000,
        seconds: Math.round(seconds),
        speed: seconds > 0 ? Number((3600 / seconds).toFixed(1)) : 0,
      });
      markStart = track[i].t;
      nextMark += 1000;
    }
  }

  return splits;
}
