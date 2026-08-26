"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, RefreshCw } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { RidersMap } from "@/components/map";
import { buttonClass } from "@/components/ui/Button";
import { LIVE_REFRESH_MS } from "@/lib/constants";
import { formatDistance, formatDurationShort, timeAgo } from "@/lib/format";
import type { LiveRider } from "@/lib/queries";

export function LiveRiders({ initial }: { initial: LiveRider[] }) {
  const [riders, setRiders] = useState(initial);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { riders: LiveRider[] };
      setRiders(data.riders);
      setUpdatedAt(new Date());
    } catch {
      // koneksi putus sesaat — coba lagi pada interval berikutnya
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const id = setInterval(() => void load(), LIVE_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="card h-[50vh] overflow-hidden lg:h-[calc(100vh-11rem)]">
        <RidersMap riders={riders} />
      </div>

      <div className="card flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-ink-700 px-5 py-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-400" />
            </span>
            {riders.length} rider sedang gowes
          </h2>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Muat ulang"
            className="rounded-lg p-1.5 text-mist-500 transition-colors hover:bg-ink-800 hover:text-mist-100"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </header>

        {riders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <Radio className="h-8 w-8 text-mist-600" />
            <p className="text-sm text-mist-500">
              Belum ada yang gowes saat ini. Jadilah yang pertama!
            </p>
            <Link href="/ride" className={buttonClass("flame", "sm")}>
              Mulai gowes
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-ink-700 overflow-y-auto">
            {riders.map((rider) => (
              <li key={rider.ride_id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={rider.name} src={rider.avatar_url} size={40} ring />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{rider.username}</p>
                  <p className="text-[11px] text-mist-500">
                    {formatDistance(rider.distance_m)} ·{" "}
                    {formatDurationShort(rider.moving_s)} ·{" "}
                    {Number(rider.avg_speed).toFixed(1)} km/j
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-mist-600">
                  {timeAgo(rider.last_ping)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="border-t border-ink-700 px-5 py-3 text-[11px] text-mist-600">
          Diperbarui {timeAgo(updatedAt)} · otomatis tiap{" "}
          {Math.round(LIVE_REFRESH_MS / 1000)} detik
        </p>
      </div>
    </div>
  );
}
