"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  Flame,
  Gauge,
  Leaf,
  MonitorSmartphone,
  Mountain,
  Pause,
  Play,
  Satellite,
  Square,
  Timer,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { LiveMap } from "@/components/map";
import { Button, Spinner } from "@/components/ui/Button";
import { formatDuration, formatNumber } from "@/lib/format";
import { useRideTracker } from "./useRideTracker";
import { FinishDialog } from "./FinishDialog";

export function RideTracker({ activeRideId }: { activeRideId: string | null }) {
  const router = useRouter();
  const tracker = useRideTracker(activeRideId);
  const [finishOpen, setFinishOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const {
    phase,
    path,
    current,
    accuracy,
    error,
    simulate,
    setSimulate,
    elapsedS,
    stats,
    currentSpeed,
  } = tracker;

  const recording = phase === "recording";
  const live = recording || phase === "paused";

  async function handleFinish(title: string, note: string) {
    const result = await tracker.finish(title, note);
    if (result?.redirect) {
      setFinishOpen(false);
      router.push(result.redirect as never);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] py-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* ---------------- Peta ---------------- */}
        <div className="card relative h-[46vh] overflow-hidden lg:h-[calc(100vh-9rem)]">
          <LiveMap path={path} current={current} follow />

          {/* status GPS */}
          <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-col gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs backdrop-blur ${
                recording
                  ? "border-lime-400/30 bg-ink-900/85 text-lime-300"
                  : "border-ink-700 bg-ink-900/85 text-mist-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  recording ? "animate-pulse bg-lime-400" : "bg-mist-600"
                }`}
              />
              {recording ? "Merekam" : phase === "paused" ? "Dijeda" : "Siap"}
            </span>

            {accuracy !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-900/85 px-3 py-1.5 text-xs text-mist-500 backdrop-blur">
                <Satellite className="h-3.5 w-3.5" />
                ±{Math.round(accuracy)} m
              </span>
            )}
          </div>

          {phase === "idle" && path.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-[400] grid place-items-center bg-ink-900/55 backdrop-blur-[1px]">
              <div className="pointer-events-auto max-w-xs rounded-2xl border border-ink-700 bg-ink-880/95 p-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lime-400/10 text-lime-400 ring-1 ring-lime-400/20">
                  <Bike className="h-7 w-7" />
                </span>
                <p className="mt-4 font-medium">Siap gowes?</p>
                <p className="mt-1 text-sm text-mist-500">
                  Tekan tombol mulai, lalu izinkan akses lokasi supaya rutenya
                  terekam.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---------------- Panel statistik ---------------- */}
        <div className="flex flex-col gap-4">
          <section className="card p-5">
            <p className="text-xs uppercase tracking-wide text-mist-500">
              Jarak tempuh
            </p>
            <p className="mt-1 flex items-baseline gap-2 font-mono text-5xl font-semibold tracking-tight text-lime-400">
              {stats.km.toFixed(2)}
              <span className="font-sans text-base font-normal text-mist-500">
                km
              </span>
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-ink-700 pt-5">
              <Metric
                icon={<Timer className="h-4 w-4" />}
                label="Durasi"
                value={formatDuration(elapsedS)}
              />
              <Metric
                icon={<Gauge className="h-4 w-4" />}
                label="Kecepatan"
                value={currentSpeed.toFixed(1)}
                unit="km/j"
              />
              <Metric
                icon={<Bike className="h-4 w-4" />}
                label="Rata-rata"
                value={stats.avgSpeed.toFixed(1)}
                unit="km/j"
              />
              <Metric
                icon={<Mountain className="h-4 w-4" />}
                label="Elevasi"
                value={Math.round(stats.elevGain).toString()}
                unit="m"
              />
              <Metric
                icon={<Flame className="h-4 w-4" />}
                label="Kalori"
                value={formatNumber(stats.calories)}
                unit="kkal"
              />
              <Metric
                icon={<Leaf className="h-4 w-4" />}
                label="CO₂ dihemat"
                value={stats.co2Kg.toFixed(2)}
                unit="kg"
                accent
              />
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-lime-400/20 bg-lime-400/[0.07] px-4 py-3">
              <span className="text-sm text-mist-300">Poin sementara</span>
              <span className="font-semibold text-lime-400">
                +{formatNumber(stats.points)} PTS
              </span>
            </div>
          </section>

          {error && (
            <p className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          {/* ---------------- Kontrol ---------------- */}
          <section className="card space-y-3 p-5">
            {phase === "idle" && (
              <>
                <Button
                  variant="flame"
                  size="lg"
                  className="w-full"
                  onClick={() => void tracker.start()}
                >
                  <Play className="h-5 w-5 fill-current" />
                  Mulai Gowes
                </Button>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-700 bg-ink-800 p-3.5">
                  <input
                    type="checkbox"
                    checked={simulate}
                    onChange={(e) => setSimulate(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-lime-400"
                  />
                  <span>
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <MonitorSmartphone className="h-4 w-4 text-mist-500" />
                      Mode simulasi
                    </span>
                    <span className="mt-0.5 block text-xs text-mist-500">
                      Untuk mencoba dari desktop tanpa GPS - posisi dibuat
                      otomatis.
                    </span>
                  </span>
                </label>
              </>
            )}

            {phase === "starting" && (
              <Button variant="flame" size="lg" className="w-full" disabled>
                <Spinner />
                Menyiapkan sesi...
              </Button>
            )}

            {recording && (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" onClick={tracker.pause}>
                  <Pause className="h-5 w-5" />
                  Jeda
                </Button>
                <Button
                  variant="flame"
                  size="lg"
                  onClick={() => setFinishOpen(true)}
                >
                  <Square className="h-4 w-4 fill-current" />
                  Selesai
                </Button>
              </div>
            )}

            {phase === "paused" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Button size="lg" onClick={tracker.resume}>
                    <Play className="h-5 w-5 fill-current" />
                    Lanjut
                  </Button>
                  <Button
                    variant="flame"
                    size="lg"
                    onClick={() => setFinishOpen(true)}
                  >
                    <Square className="h-4 w-4 fill-current" />
                    Selesai
                  </Button>
                </div>

                {confirmDiscard ? (
                  <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3.5">
                    <p className="text-sm text-red-200">
                      Buang sesi ini? Data rute tidak bisa dikembalikan.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void tracker.discard()}
                      >
                        Ya, buang
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDiscard(false)}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setConfirmDiscard(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Buang sesi
                  </Button>
                )}
              </>
            )}

            {phase === "saving" && (
              <Button size="lg" className="w-full" disabled>
                <Spinner />
                Menyimpan ride...
              </Button>
            )}

            {live && (
              <p className="text-center text-xs text-mist-600">
                {path.length} titik GPS terekam · sesi tersimpan otomatis di
                perangkat
              </p>
            )}
          </section>
        </div>
      </div>

      {finishOpen && (
        <FinishDialog
          defaultTitle={tracker.title}
          stats={{
            km: stats.km,
            durationS: elapsedS,
            co2Kg: stats.co2Kg,
            points: stats.points,
          }}
          saving={phase === "saving"}
          onCancel={() => setFinishOpen(false)}
          onConfirm={handleFinish}
        />
      )}
    </div>
  );
}

function Metric({
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
    <div>
      <p className="flex items-center gap-1.5 text-xs text-mist-500">
        <span className={accent ? "text-lime-400" : "text-mist-600"}>{icon}</span>
        {label}
      </p>
      <p
        className={`mt-1 font-mono text-xl font-semibold tracking-tight ${
          accent ? "text-lime-400" : "text-mist-100"
        }`}
      >
        {value}
        {unit && (
          <span className="ml-1 font-sans text-xs font-normal text-mist-500">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
