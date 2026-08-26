"use client";

import { useEffect, type ReactNode } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L, { type LatLngBoundsExpression, type LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

/** Basemap gelap gratis dari CARTO (butuh atribusi OSM + CARTO). */
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Jakarta — fallback saat rider belum punya titik apa pun. */
export const DEFAULT_CENTER: LatLngExpression = [-6.2088, 106.8456];

export function markerIcon(className: string, size = 14) {
  return L.divIcon({
    className: "",
    html: `<span class="${className}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Menyesuaikan viewport peta ke bounds tiap kali bounds berubah. */
export function FitBounds({
  bounds,
  padding = 32,
}: {
  bounds: LatLngBoundsExpression | null;
  padding?: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [padding, padding], maxZoom: 17 });
  }, [map, bounds, padding]);
  return null;
}

/** Memusatkan peta ke satu titik (dipakai saat mengikuti rider). */
export function FollowPoint({
  point,
  zoom,
  enabled = true,
}: {
  point: LatLngExpression | null;
  zoom?: number;
  enabled?: boolean;
}) {
  const map = useMap();
  useEffect(() => {
    if (!point || !enabled) return;
    map.setView(point, zoom ?? map.getZoom(), { animate: true });
  }, [map, point, zoom, enabled]);
  return null;
}

/** Leaflet perlu tahu ukurannya berubah saat container di-resize. */
export function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export function MapShell({
  children,
  center = DEFAULT_CENTER,
  zoom = 13,
  interactive = true,
  className = "",
}: {
  children?: ReactNode;
  center?: LatLngExpression;
  zoom?: number;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={false}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      attributionControl
      className={`h-full w-full ${className}`}
    >
      <TileLayer url={TILE_URL} attribution={ATTRIBUTION} maxZoom={19} />
      <InvalidateOnResize />
      {children}
    </MapContainer>
  );
}

export { L };
