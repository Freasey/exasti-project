"use client";

import { Fragment, useMemo } from "react";
import { Polyline } from "react-leaflet";
import { FitBounds, L, MapShell } from "./MapShell";
import { GreenRouteLayer } from "./GreenRouteLayer";

/**
 * "Heatmap" rute: semua polyline digambar tipis dan transparan, sehingga
 * jalur yang sering dilewati terlihat lebih terang karena bertumpuk.
 */
export default function HeatMap({
  routes,
  className = "",
}: {
  routes: [number, number][][];
  className?: string;
}) {
  const bounds = useMemo(() => {
    const all = routes.flat();
    return all.length > 1 ? L.latLngBounds(all).pad(0.15) : null;
  }, [routes]);

  return (
    <MapShell zoom={12} interactive className={className}>
      <FitBounds bounds={bounds} padding={40} />
      <GreenRouteLayer planner={false} />
      {routes.map((route, i) =>
        route.length > 1 ? (
          <Fragment key={i}>
            <Polyline
              positions={route}
              pathOptions={{
                color: "#8be04e",
                weight: 6,
                opacity: 0.1,
                lineCap: "round",
              }}
            />
            <Polyline
              positions={route}
              pathOptions={{
                color: "#cdf5a6",
                weight: 1.6,
                opacity: 0.5,
                lineCap: "round",
              }}
            />
          </Fragment>
        ) : null
      )}
    </MapShell>
  );
}
