"use client";

import { Marker, Polyline } from "react-leaflet";
import { DEFAULT_CENTER, FollowPoint, MapShell, markerIcon } from "./MapShell";

export type LiveMapProps = {
  path: [number, number][];
  current: [number, number] | null;
  follow?: boolean;
  className?: string;
};

/** Peta yang mengikuti posisi rider selama sesi live tracking. */
export default function LiveMap({
  path,
  current,
  follow = true,
  className = "",
}: LiveMapProps) {
  return (
    <MapShell
      center={current ?? path[0] ?? DEFAULT_CENTER}
      zoom={17}
      interactive
      className={className}
    >
      <FollowPoint point={current} enabled={follow} />

      {path.length > 1 && (
        <>
          <Polyline
            positions={path}
            pathOptions={{ color: "#0a0d0a", weight: 9, opacity: 0.65 }}
          />
          <Polyline
            positions={path}
            pathOptions={{ color: "#8be04e", weight: 5, opacity: 0.95 }}
          />
        </>
      )}

      {path[0] && (
        <Marker position={path[0]} icon={markerIcon("route-pin route-pin--start")} />
      )}
      {current && <Marker position={current} icon={markerIcon("rider-dot", 18)} />}
    </MapShell>
  );
}
