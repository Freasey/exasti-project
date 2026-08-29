"use client";

import { useEffect, useState } from "react";
import { Leaf, Save, X } from "lucide-react";
import { Button, Spinner } from "@/components/ui/Button";
import { formatDuration, formatNumber } from "@/lib/format";

export function FinishDialog({
  defaultTitle,
  stats,
  saving,
  onCancel,
  onConfirm,
}: {
  defaultTitle: string;
  stats: { km: number; durationS: number; co2Kg: number; points: number };
  saving: boolean;
  onCancel: () => void;
  onConfirm: (title: string, note: string) => void | Promise<void>;
}) {
  // Dialog di-mount ulang tiap kali dibuka, jadi judul cukup diambil
  // sebagai nilai awal state - tanpa efek sinkronisasi.
  const [title, setTitle] = useState(defaultTitle);
  const [note, setNote] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onCancel]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Simpan ride"
      className="fixed inset-0 z-[1000] grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-ink-700 bg-ink-850 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Selesaikan ride</h2>
            <p className="mt-1 text-sm text-mist-500">
              Beri nama perjalananmu sebelum disimpan.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-mist-500 hover:bg-ink-800 hover:text-mist-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-ink-700 bg-ink-800 p-4 text-center">
          <div>
            <dt className="text-[11px] text-mist-500">Jarak</dt>
            <dd className="mt-0.5 font-semibold">{stats.km.toFixed(2)} km</dd>
          </div>
          <div>
            <dt className="text-[11px] text-mist-500">Durasi</dt>
            <dd className="mt-0.5 font-semibold">
              {formatDuration(stats.durationS)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-mist-500">CO₂</dt>
            <dd className="mt-0.5 font-semibold text-lime-400">
              {stats.co2Kg.toFixed(2)} kg
            </dd>
          </div>
        </dl>

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="ride-title"
              className="mb-1.5 block text-sm text-mist-300"
            >
              Judul ride
            </label>
            <input
              id="ride-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="h-12 w-full rounded-xl border border-ink-700 bg-ink-800 px-4 text-[15px] focus:border-lime-400/70 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
            />
          </div>

          <div>
            <label
              htmlFor="ride-note"
              className="mb-1.5 block text-sm text-mist-300"
            >
              Catatan <span className="text-mist-600">(opsional)</span>
            </label>
            <textarea
              id="ride-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Cuaca cerah, rute lewat jalur sepeda Sudirman..."
              className="w-full resize-none rounded-xl border border-ink-700 bg-ink-800 px-4 py-3 text-[15px] placeholder:text-mist-600 focus:border-lime-400/70 focus:outline-none focus:ring-2 focus:ring-lime-400/15"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-lime-400/20 bg-lime-400/[0.07] px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-mist-300">
            <Leaf className="h-4 w-4 text-lime-400" />
            Poin yang didapat
          </span>
          <span className="font-semibold text-lime-400">
            +{formatNumber(stats.points)} PTS
          </span>
        </div>

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={saving}
          >
            Lanjut gowes
          </Button>
          <Button
            className="flex-1"
            disabled={saving || !title.trim()}
            onClick={() => void onConfirm(title.trim(), note.trim())}
          >
            {saving ? <Spinner /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan ride"}
          </Button>
        </div>
      </div>
    </div>
  );
}
