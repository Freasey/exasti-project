"use client";

import dynamic from "next/dynamic";
import { Map as MapIcon } from "lucide-react";

/**
 * Leaflet menyentuh `window` saat modul dimuat, jadi semua peta di-import
 * dinamis tanpa SSR lewat berkas ini.
 */

function MapSkeleton() {
  return (
    <div className="grid h-full w-full place-items-center bg-ink-850">
      <div className="flex flex-col items-center gap-2 text-mist-600">
        <MapIcon className="h-6 w-6 animate-pulse" />
        <span className="text-xs">Memuat peta...</span>
      </div>
    </div>
  );
}

export const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: MapSkeleton,
});

export const LiveMap = dynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: MapSkeleton,
});

export const RidersMap = dynamic(() => import("./RidersMap"), {
  ssr: false,
  loading: MapSkeleton,
});

export const HeatMap = dynamic(() => import("./HeatMap"), {
  ssr: false,
  loading: MapSkeleton,
});

export type { RiderPin } from "./RidersMap";
