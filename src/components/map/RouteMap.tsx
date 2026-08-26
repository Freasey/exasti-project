"use client";

import { useMemo } from "react";
import { Marker, Polyline } from "react-leaflet";
import { FitBounds, L, MapShell, markerIcon } from "./MapShell";

export type RouteMapProps = {
  polyline: [number, number][];
  interactive?: boolean;
  showEndpoints?: boolean;
  className?: string;
};

/** Peta statis satu rute: garis + penanda start/finish. */
export default function RouteMap({
  polyline,
  interactive = false,
  showEndpoints = true,
  className = "",
}: RouteMapProps) {
  const bounds = useMemo(
    () => (polyline.length > 1 ? L.latLngBounds(polyline) : null),
    [polyline]
  );

  const start = polyline[0];
  const end = polyline[polyline.length - 1];

  return (
    <MapShell
      center={start ?? undefined}
      zoom={14}
      interactive={interactive}
      className={className}
    >
      <FitBounds bounds={bounds} />
      {polyline.length > 1 && (
        <>
          {/* garis bawah gelap supaya rute tetap terbaca di atas peta */}
          <Polyline
            positions={polyline}
            pathOptions={{ color: "#0a0d0a", weight: 7, opacity: 0.7 }}
          />
          <Polyline
            positions={polyline}
            pathOptions={{ color: "#8be04e", weight: 3.5, opacity: 0.95 }}
          />
        </>
      )}

      {showEndpoints && start && (
        <Marker position={start} icon={markerIcon("route-pin route-pin--start")} />
      )}
      {showEndpoints && end && polyline.length > 1 && (
        <Marker position={end} icon={markerIcon("route-pin route-pin--end")} />
      )}
    </MapShell>
  );
}
