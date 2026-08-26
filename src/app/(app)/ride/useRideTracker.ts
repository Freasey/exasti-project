"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  calcPoints,
  co2FromKm,
  computeRideStats,
  estimateCalories,
  haversine,
} from "@/lib/metrics";
import { LIVE_PING_INTERVAL_MS } from "@/lib/constants";
import type { TrackPoint } from "@/lib/types";

export type Phase = "idle" | "starting" | "recording" | "paused" | "saving";

const STORAGE_KEY = "ecocycle:active-ride";
/** Titik baru diabaikan kalau terlalu rapat — hemat memori & mengurangi jitter. */
const MIN_MOVE_M = 3;
const MIN_GAP_MS = 1500;
/** Sampel dengan akurasi lebih buruk dari ini dibuang. */
const MAX_ACCURACY_M = 60;

type Backup = { rideId: string; track: TrackPoint[]; title: string };

function loadBackup(rideId: string | null): Backup | null {
  if (typeof window === "undefined" || !rideId) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Backup;
    return parsed.rideId === rideId ? parsed : null;
  } catch {
    return null;
  }
}

function saveBackup(backup: Backup) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(backup));
  } catch {
    // storage penuh / mode privat — abaikan, ride tetap jalan di memori
  }
}

function clearBackup() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function defaultRideTitle(date = new Date()): string {
  const h = date.getHours();
  if (h < 10) return "Gowes Pagi";
  if (h < 15) return "Gowes Siang";
  if (h < 19) return "Gowes Sore";
  return "Night Ride";
}

export type RideTrackerState = ReturnType<typeof useRideTracker>;

export function useRideTracker(initialRideId: string | null) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [rideId, setRideId] = useState<string | null>(initialRideId);
  const [track, setTrack] = useState<TrackPoint[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [simulate, setSimulate] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [title, setTitle] = useState(defaultRideTitle());

  const watchIdRef = useRef<number | null>(null);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const pausedMsRef = useRef(0);
  const pauseStartedRef = useRef<number | null>(null);
  const simStateRef = useRef({ lat: -6.2088, lng: 106.8456, heading: 0.8 });

  /* ---------------- pemulihan sesi setelah refresh ---------------- */
  // localStorage tidak ada saat render di server, jadi pemulihan sesi memang
  // harus terjadi setelah mount — bukan state turunan yang bisa dihitung ulang.
  useEffect(() => {
    const backup = loadBackup(initialRideId);
    if (backup && backup.track.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrack(backup.track);
      setTitle(backup.title);
      startedAtRef.current = backup.track[0].t;
      setPhase("paused");
    }
  }, [initialRideId]);

  /* ---------------- statistik turunan ---------------- */
  const stats = useMemo(() => computeRideStats(track), [track]);
  const km = stats.distanceM / 1000;
  const derived = useMemo(
    () => ({
      ...stats,
      km,
      co2Kg: co2FromKm(km),
      points: calcPoints(stats.distanceM, stats.movingS),
      calories: estimateCalories(stats.avgSpeed, stats.movingS),
    }),
    [stats, km]
  );

  const path = useMemo(
    () => track.map((p) => [p.lat, p.lng] as [number, number]),
    [track]
  );
  const current = path.length > 0 ? path[path.length - 1] : null;

  /** Kecepatan sesaat dari beberapa sampel terakhir (lebih stabil). */
  const currentSpeed = useMemo(() => {
    const tail = track.slice(-4);
    if (tail.length < 2) return 0;
    let dist = 0;
    for (let i = 1; i < tail.length; i++) {
      dist += haversine(tail[i - 1].lat, tail[i - 1].lng, tail[i].lat, tail[i].lng);
    }
    const dt = (tail[tail.length - 1].t - tail[0].t) / 1000;
    return dt > 0 ? (dist / dt) * 3.6 : 0;
  }, [track]);

  /* ---------------- penambahan titik ---------------- */
  const pushPoint = useCallback((point: TrackPoint) => {
    setTrack((prev) => {
      const last = prev[prev.length - 1];
      if (last) {
        const gap = point.t - last.t;
        const moved = haversine(last.lat, last.lng, point.lat, point.lng);
        if (gap < MIN_GAP_MS && moved < MIN_MOVE_M) return prev;
      }
      return [...prev, point];
    });
  }, []);

  /* ---------------- sumber posisi: GPS ---------------- */
  const startWatching = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Browser ini tidak mendukung GPS. Gunakan mode simulasi.");
      return false;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setAccuracy(pos.coords.accuracy);
        if (pos.coords.accuracy > MAX_ACCURACY_M) return;
        pushPoint({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: pos.timestamp || Date.now(),
          alt: pos.coords.altitude,
          spd: pos.coords.speed,
          acc: pos.coords.accuracy,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "Akses lokasi ditolak. Izinkan lokasi di browser, atau pakai mode simulasi.",
          2: "Sinyal GPS tidak tersedia. Coba ke area terbuka.",
          3: "Pencarian GPS timeout. Mencoba lagi...",
        };
        setError(messages[err.code] ?? "Gagal membaca lokasi.");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20_000 }
    );
    return true;
  }, [pushPoint]);

  /* ---------------- sumber posisi: simulasi ---------------- */
  const startSimulation = useCallback(() => {
    const sim = simStateRef.current;
    simTimerRef.current = setInterval(() => {
      sim.heading += (Math.random() - 0.5) * 0.4;
      const speedMps = 5.5 + Math.random() * 2.5; // ~20-29 km/j
      const step = speedMps * 2; // interval 2 detik
      sim.lat += (Math.cos(sim.heading) * step) / 111_320;
      sim.lng +=
        (Math.sin(sim.heading) * step) /
        (111_320 * Math.cos((sim.lat * Math.PI) / 180));

      pushPoint({
        lat: Number(sim.lat.toFixed(6)),
        lng: Number(sim.lng.toFixed(6)),
        t: Date.now(),
        alt: 20 + Math.sin(Date.now() / 40_000) * 12,
        spd: speedMps,
        acc: 5,
      });
      setAccuracy(5);
    }, 2000);
  }, [pushPoint]);

  const stopSources = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
  }, []);

  /* ---------------- layar tetap menyala ---------------- */
  const requestWakeLock = useCallback(async () => {
    try {
      wakeLockRef.current =
        (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      // tidak didukung / ditolak — bukan masalah kritis
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    void wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  /* ---------------- timer ---------------- */
  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedMs(Date.now() - startedAtRef.current - pausedMsRef.current);
      }
    }, 500);
    return () => clearInterval(id);
  }, [phase]);

  /* ---------------- cadangan lokal ---------------- */
  useEffect(() => {
    if (!rideId || track.length === 0) return;
    saveBackup({ rideId, track, title });
  }, [rideId, track, title]);

  /* ---------------- ping ke server ---------------- */
  // Interval ping dibuat sekali per sesi, tapi harus selalu mengirim angka
  // terbaru — jadi snapshot-nya dibaca lewat ref, bukan lewat closure.
  const snapshotRef = useRef({ track, stats, path, elapsedMs });
  useEffect(() => {
    snapshotRef.current = { track, stats, path, elapsedMs };
  }, [track, stats, path, elapsedMs]);

  useEffect(() => {
    if (phase !== "recording" || !rideId) return;

    const send = () => {
      const snap = snapshotRef.current;
      const last = snap.track[snap.track.length - 1];
      if (!last) return;
      void fetch(`/api/rides/${rideId}/ping`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          lat: last.lat,
          lng: last.lng,
          distanceM: snap.stats.distanceM,
          durationS: Math.round(snap.elapsedMs / 1000),
          movingS: snap.stats.movingS,
          avgSpeed: snap.stats.avgSpeed,
          polyline: snap.path,
        }),
      }).catch(() => {
        /* offline sesaat — ride tetap direkam di perangkat */
      });
    };

    send();
    const id = setInterval(send, LIVE_PING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [phase, rideId]);

  useEffect(() => stopSources, [stopSources]);

  /* ---------------- aksi ---------------- */

  const start = useCallback(async () => {
    setPhase("starting");
    setError(null);
    try {
      let id = rideId;
      if (!id) {
        const res = await fetch("/api/rides", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title }),
        });
        const data = (await res.json()) as {
          ride?: { id: string };
          error?: string;
        };
        if (!res.ok || !data.ride) {
          setError(data.error ?? "Gagal memulai sesi.");
          setPhase("idle");
          return;
        }
        id = data.ride.id;
        setRideId(id);
      }

      startedAtRef.current = track[0]?.t ?? Date.now();
      pausedMsRef.current = 0;
      if (simulate) startSimulation();
      else startWatching();
      void requestWakeLock();
      setPhase("recording");
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setPhase("idle");
    }
  }, [rideId, title, simulate, track, startSimulation, startWatching, requestWakeLock]);

  const pause = useCallback(() => {
    stopSources();
    releaseWakeLock();
    pauseStartedRef.current = Date.now();
    setPhase("paused");
  }, [stopSources, releaseWakeLock]);

  const resume = useCallback(() => {
    if (pauseStartedRef.current) {
      pausedMsRef.current += Date.now() - pauseStartedRef.current;
      pauseStartedRef.current = null;
    } else {
      // Sesi dipulihkan dari localStorage: jeda dihitung sejak titik terakhir
      // supaya waktu saat tab tertutup tidak ikut terhitung.
      const last = track[track.length - 1];
      if (last) pausedMsRef.current += Date.now() - last.t;
    }
    if (!startedAtRef.current) startedAtRef.current = Date.now();
    if (simulate) startSimulation();
    else startWatching();
    void requestWakeLock();
    setPhase("recording");
  }, [simulate, track, startSimulation, startWatching, requestWakeLock]);

  const finish = useCallback(
    async (finalTitle: string, note: string) => {
      if (!rideId) return null;
      stopSources();
      releaseWakeLock();
      setPhase("saving");

      try {
        const res = await fetch(`/api/rides/${rideId}/finish`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ track, title: finalTitle, note }),
        });
        const data = (await res.json()) as {
          error?: string;
          redirect?: string;
          pointsEarned?: number;
        };
        if (!res.ok) {
          setError(data.error ?? "Gagal menyimpan ride.");
          setPhase("paused");
          return null;
        }
        clearBackup();
        return data;
      } catch {
        setError("Tidak bisa terhubung ke server.");
        setPhase("paused");
        return null;
      }
    },
    [rideId, track, stopSources, releaseWakeLock]
  );

  const discard = useCallback(async () => {
    stopSources();
    releaseWakeLock();
    if (rideId) {
      await fetch(`/api/rides/${rideId}`, { method: "DELETE" }).catch(() => {});
    }
    clearBackup();
    setTrack([]);
    setRideId(null);
    setElapsedMs(0);
    startedAtRef.current = null;
    pausedMsRef.current = 0;
    setPhase("idle");
  }, [rideId, stopSources, releaseWakeLock]);

  return {
    phase,
    rideId,
    track,
    path,
    current,
    accuracy,
    error,
    simulate,
    setSimulate,
    // Saat berhenti/dijeda, durasi diambil dari rentang waktu track supaya
    // tetap benar setelah halaman dimuat ulang.
    elapsedS:
      phase === "recording"
        ? Math.max(0, Math.round(elapsedMs / 1000))
        : stats.durationS,
    title,
    setTitle,
    stats: derived,
    currentSpeed,
    start,
    pause,
    resume,
    finish,
    discard,
  };
}
