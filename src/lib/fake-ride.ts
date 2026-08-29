import type { TrackPoint } from "./types";

/**
 * Generator rute sintetis untuk data demo/seed.
 *
 * Bukan sekadar garis lurus: heading berjalan acak dengan bias kembali ke
 * titik start, sehingga jalurnya terlihat seperti loop gowes betulan di peta.
 */

export type RouteSeed = {
  start: [number, number];
  distanceKm: number;
  avgSpeedKmh: number;
  startTime: Date;
};

/** PRNG deterministik (mulberry32) supaya seed bisa direproduksi. */
export function makeRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const METERS_PER_DEG_LAT = 111_320;
const SAMPLE_INTERVAL_S = 4;

export function generateTrack(
  seedValue: number,
  { start, distanceKm, avgSpeedKmh, startTime }: RouteSeed
): TrackPoint[] {
  const rand = makeRandom(seedValue);
  const totalM = distanceKm * 1000;
  const metersPerDegLng =
    METERS_PER_DEG_LAT * Math.cos((start[0] * Math.PI) / 180);

  let lat = start[0];
  let lng = start[1];
  let heading = rand() * Math.PI * 2;
  let travelled = 0;
  let t = startTime.getTime();

  // Profil elevasi: satu bukit panjang + gelombang pendek + noise altimeter.
  const baseAlt = 8 + rand() * 30;
  const hillAmp = 8 + rand() * 22;
  const hillLen = 700 + rand() * 900;
  const bumpPhase = rand() * Math.PI * 2;
  const altitudeAt = (dist: number) =>
    baseAlt +
    hillAmp * Math.sin(dist / hillLen + bumpPhase) +
    (hillAmp / 3) * Math.sin(dist / 260) +
    (rand() - 0.5) * 2;

  let alt = altitudeAt(0);

  const track: TrackPoint[] = [
    { lat, lng, t, alt: Number(alt.toFixed(1)), spd: 0, acc: 5 },
  ];

  while (travelled < totalM) {
    const progress = travelled / totalM;

    // Paruh kedua perjalanan diarahkan pulang ke titik start.
    if (progress > 0.5) {
      const backHeading = Math.atan2(
        (start[1] - lng) * metersPerDegLng,
        (start[0] - lat) * METERS_PER_DEG_LAT
      );
      let diff = backHeading - heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      heading += diff * 0.06 * (progress - 0.5) * 2;
    }
    heading += (rand() - 0.5) * 0.35;

    // Variasi kecepatan + kemungkinan berhenti di lampu merah.
    const stopped = rand() < 0.015;
    const speedKmh = stopped ? 0 : avgSpeedKmh * (0.75 + rand() * 0.5);
    const step = (speedKmh / 3.6) * SAMPLE_INTERVAL_S;

    lat += (Math.cos(heading) * step) / METERS_PER_DEG_LAT;
    lng += (Math.sin(heading) * step) / metersPerDegLng;
    travelled += step;
    alt = Math.max(0, altitudeAt(travelled));
    t += SAMPLE_INTERVAL_S * 1000;

    track.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      t,
      alt: Number(alt.toFixed(1)),
      spd: Number((speedKmh / 3.6).toFixed(2)),
      acc: Number((4 + rand() * 6).toFixed(1)),
    });

    if (track.length > 6000) break; // pengaman
  }

  return track;
}

/** Titik start populer di beberapa kota - dipakai seed & akun demo. */
export const CITY_SPOTS: Record<string, [number, number][]> = {
  Jakarta: [
    [-6.2088, 106.8456], // Bundaran HI
    [-6.1754, 106.8272], // Monas
    [-6.2297, 106.8296], // Senayan
    [-6.2615, 106.8106], // Blok M
    [-6.1478, 106.8895], // Kelapa Gading
  ],
  Bandung: [
    [-6.9147, 107.6098],
    [-6.8915, 107.6107],
  ],
  Surabaya: [
    [-7.2575, 112.7521],
    [-7.2892, 112.7345],
  ],
  Yogyakarta: [[-7.7956, 110.3695]],
  Bali: [[-8.6705, 115.2126]],
};

export const RIDE_TITLES = [
  "Gowes Pagi",
  "Commute ke Kantor",
  "Sore Santai",
  "Long Ride Akhir Pekan",
  "Interval Training",
  "Night Ride",
  "Coffee Ride",
  "Explore Kota",
  "Recovery Ride",
];

export function titleForHour(hour: number, rand: () => number): string {
  if (hour < 9) return rand() < 0.5 ? "Gowes Pagi" : "Commute ke Kantor";
  if (hour < 15) return rand() < 0.5 ? "Coffee Ride" : "Explore Kota";
  if (hour < 19) return rand() < 0.5 ? "Sore Santai" : "Interval Training";
  return "Night Ride";
}
