"use client";

import { Fragment, useMemo } from "react";
import { Marker, Polyline, Popup } from "react-leaflet";
import { FitBounds, L, MapShell, markerIcon } from "./MapShell";
import { GreenRouteLayer } from "./GreenRouteLayer";
import { formatDistance, formatDurationShort } from "@/lib/format";

export type RiderPin = {
  ride_id: string;
  name: string;
  username: string;
  lat: number;
  lng: number;
  distance_m: number;
  moving_s: number;
  avg_speed: number;
  polyline: [number, number][];
};

/** Peta semua rider yang sedang gowes saat ini. */
export default function RidersMap({
  riders,
  className = "",
}: {
  riders: RiderPin[];
  className?: string;
}) {
  const bounds = useMemo(() => {
    const points = riders.map((r) => [r.lat, r.lng] as [number, number]);
    return points.length > 0 ? L.latLngBounds(points).pad(0.35) : null;
  }, [riders]);

  return (
    <MapShell zoom={11} interactive className={className}>
      <FitBounds bounds={bounds} padding={48} />
      <GreenRouteLayer />

      {riders.map((rider) => (
        <Fragment key={rider.ride_id}>
          {rider.polyline?.length > 1 && (
            <Polyline
              positions={rider.polyline}
              pathOptions={{ color: "#8be04e", weight: 2.5, opacity: 0.45 }}
            />
          )}
          <Marker position={[rider.lat, rider.lng]} icon={markerIcon("rider-dot", 16)}>
            <Popup>
              <p className="font-semibold">{rider.name}</p>
              <p className="text-xs opacity-70">@{rider.username}</p>
              <p className="mt-1.5 text-xs">
                {formatDistance(rider.distance_m)} ·{" "}
                {formatDurationShort(rider.moving_s)} ·{" "}
                {rider.avg_speed.toFixed(1)} km/j
              </p>
            </Popup>
          </Marker>
        </Fragment>
      ))}
    </MapShell>
  );
}
