"use client";

import { useCallback, useRef, useState } from "react";
import { Marker, Polyline, Tooltip, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Leaf, LoaderCircle, MapPin, Route, X } from "lucide-react";
import {
  KIND_ORDER,
  LANE_STYLE,
  bboxToParam,
  containsBBox,
  padBBox,
  type BBox,
  type BikeLane,
} from "@/lib/bike-lanes";
import { formatDistance, formatDurationShort } from "@/lib/format";
import { markerIcon } from "./MapShell";

/** Di bawah zoom ini viewport mencakup terlalu banyak ruas untuk digambar. */
const MIN_ZOOM = 12;

type Point = [number, number];

type PlannedRoute = {
  polyline: Point[];
  distance_m: number;
  duration_s: number;
  ascent_m: number | null;
};

type Status = "idle" | "loading" | "ready" | "zoom" | "error";

/** Mencegah klik & scroll di panel kontrol ikut menggeser peta di baliknya. */
function useStopMapGestures() {
  return useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    L.DomEvent.disableClickPropagation(node);
    L.DomEvent.disableScrollPropagation(node);
  }, []);
}

/**
 * Green Route: menyalakan layer jalur ramah sepeda dari OpenStreetMap, dan
 * (opsional) merencanakan rute sepeda antara dua titik lewat OpenRouteService.
 *
 * Dipasang sebagai anak `MapShell` supaya bisa membaca instance peta lewat
 * `useMap` dan ikut menumpang container-nya untuk panel kontrol.
 */
export function GreenRouteLayer({ planner = true }: { planner?: boolean }) {
  const map = useMap();
  const stopGestures = useStopMapGestures();

  const [on, setOn] = useState(false);
  const [lanes, setLanes] = useState<BikeLane[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  // bbox yang datanya sudah ada di memori - dipakai agar geser kecil tak refetch
  const loadedBox = useRef<BBox | null>(null);
  // penanda urutan permintaan; balasan yang kedaluwarsa diabaikan
  const requestId = useRef(0);
  const routeRequestId = useRef(0);

  const [picking, setPicking] = useState(false);
  const [from, setFrom] = useState<Point | null>(null);
  const [to, setTo] = useState<Point | null>(null);
  const [route, setRoute] = useState<PlannedRoute | null>(null);
  const [routing, setRouting] = useState(false);

  const loadLanes = useCallback(async () => {
    if (map.getZoom() < MIN_ZOOM) {
      setStatus("zoom");
      setLanes([]);
      loadedBox.current = null;
      return;
    }

    const bounds = map.getBounds();
    const view: BBox = {
      south: bounds.getSouth(),
      west: bounds.getWest(),
      north: bounds.getNorth(),
      east: bounds.getEast(),
    };

    if (loadedBox.current && containsBBox(loadedBox.current, view)) {
      setStatus("ready");
      return;
    }

    // Ambil area yang lebih lebar dari layar supaya geser sedikit tidak refetch.
    const padded = padBBox(view);
    const id = ++requestId.current;
    setStatus("loading");

    try {
      const response = await fetch(
        `/api/bike-lanes?bbox=${bboxToParam(padded)}`,
        { cache: "no-store" }
      );
      if (id !== requestId.current) return; // sudah ada permintaan yang lebih baru

      const data = (await response.json()) as {
        lanes?: BikeLane[];
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setError(data.error ?? "Gagal memuat jalur sepeda.");
        return;
      }

      loadedBox.current = padded;
      setLanes(data.lanes ?? []);
      setStatus("ready");
      setError("");
    } catch {
      if (id !== requestId.current) return;
      setStatus("error");
      setError("Koneksi bermasalah saat memuat jalur.");
    }
  }, [map]);

  const planRoute = useCallback(async (start: Point, end: Point) => {
    const id = ++routeRequestId.current;
    setRouting(true);
    setError("");

    try {
      const response = await fetch("/api/green-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: start, to: end }),
      });
      const data = (await response.json()) as PlannedRoute & { error?: string };
      if (id !== routeRequestId.current) return;

      if (!response.ok) {
        setRoute(null);
        setError(data.error ?? "Gagal menghitung rute.");
        return;
      }
      setRoute(data);
    } catch {
      if (id === routeRequestId.current) {
        setError("Koneksi bermasalah saat menghitung rute.");
      }
    } finally {
      if (id === routeRequestId.current) setRouting(false);
    }
  }, []);

  useMapEvents({
    moveend: () => {
      if (on) void loadLanes();
    },
    click: (event) => {
      if (!picking) return;
      const point: Point = [event.latlng.lat, event.latlng.lng];
      if (!from) {
        setFrom(point);
        return;
      }
      setTo(point);
      setPicking(false);
      void planRoute(from, point);
    },
  });

  function reset() {
    setPicking(false);
    setFrom(null);
    setTo(null);
    setRoute(null);
    setError("");
  }

  function toggle() {
    const next = !on;
    setOn(next);
    if (next) {
      void loadLanes();
    } else {
      reset();
      setLanes([]);
      loadedBox.current = null;
      setStatus("idle");
    }
  }

  const counts = KIND_ORDER.map((kind) => ({
    kind,
    total: lanes.filter((lane) => lane.kind === kind).length,
  })).filter((entry) => entry.total > 0);

  return (
    <>
      {/* ---------------- jalur sepeda ---------------- */}
      {on &&
        lanes.map((lane) => {
          const style = LANE_STYLE[lane.kind];
          return (
            <Polyline
              key={lane.osm_id}
              positions={lane.geom}
              pathOptions={{
                color: style.color,
                weight: style.weight,
                opacity: style.opacity,
                dashArray: style.dash,
                lineCap: "round",
              }}
            >
              {lane.name && (
                <Tooltip sticky>
                  <span className="font-medium">{lane.name}</span>
                  <br />
                  <span className="text-xs opacity-70">{style.label}</span>
                </Tooltip>
              )}
            </Polyline>
          );
        })}

      {/* ---------------- rute yang direncanakan ---------------- */}
      {on && route && route.polyline.length > 1 && (
        <>
          <Polyline
            positions={route.polyline}
            pathOptions={{ color: "#0a0d0a", weight: 8, opacity: 0.7 }}
          />
          <Polyline
            positions={route.polyline}
            pathOptions={{ color: "#ff7a45", weight: 4, opacity: 0.95 }}
          />
        </>
      )}
      {on && from && (
        <Marker position={from} icon={markerIcon("route-pin route-pin--start")} />
      )}
      {on && to && (
        <Marker position={to} icon={markerIcon("route-pin route-pin--end")} />
      )}

      {/* ---------------- panel kontrol ---------------- */}
      <div
        ref={stopGestures}
        className="absolute right-3 top-3 z-[600] flex w-[13.5rem] flex-col gap-2"
      >
        <button
          type="button"
          onClick={toggle}
          aria-pressed={on}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors ${
            on
              ? "border-teal-400/40 bg-ink-900/85 text-teal-300"
              : "border-ink-700 bg-ink-900/85 text-mist-500 hover:text-mist-100"
          }`}
        >
          <Leaf className="h-3.5 w-3.5" />
          Green Route
          {status === "loading" && (
            <LoaderCircle className="ml-auto h-3 w-3 animate-spin" />
          )}
        </button>

        {on && (
          <div className="rounded-xl border border-ink-700 bg-ink-900/90 p-3 text-xs backdrop-blur">
            {status === "zoom" ? (
              <p className="text-mist-500">Perbesar peta untuk melihat jalur sepeda.</p>
            ) : counts.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {counts.map(({ kind, total }) => {
                  const style = LANE_STYLE[kind];
                  return (
                    <li key={kind} className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="h-0 w-5 shrink-0 rounded-full border-t-2"
                        style={{
                          borderColor: style.color,
                          borderTopStyle: style.dash ? "dashed" : "solid",
                          opacity: style.opacity,
                        }}
                      />
                      <span className="text-mist-300">{style.label}</span>
                      <span className="ml-auto tabular-nums text-mist-600">{total}</span>
                    </li>
                  );
                })}
              </ul>
            ) : status === "ready" ? (
              <p className="text-mist-500">Belum ada jalur sepeda terpetakan di area ini.</p>
            ) : null}

            {planner && status !== "zoom" && (
              <div className="mt-3 border-t border-ink-700 pt-3">
                {route ? (
                  <div className="flex flex-col gap-1.5">
                    <p className="flex items-center gap-1.5 font-medium text-flame-400">
                      <Route className="h-3.5 w-3.5" />
                      {formatDistance(route.distance_m)}
                      <span className="text-mist-500">
                        · {formatDurationShort(Math.round(route.duration_s))}
                      </span>
                    </p>
                    {route.ascent_m !== null && (
                      <p className="text-mist-600">
                        Tanjakan {Math.round(route.ascent_m)} m
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={reset}
                      className="mt-1 inline-flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-mist-500 transition-colors hover:bg-ink-800 hover:text-mist-100"
                    >
                      <X className="h-3 w-3" />
                      Hapus rute
                    </button>
                  </div>
                ) : routing ? (
                  <p className="flex items-center gap-2 text-mist-500">
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                    Menghitung rute...
                  </p>
                ) : picking ? (
                  <p className="flex items-start gap-1.5 text-teal-300">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {from ? "Klik titik tujuan." : "Klik titik awal di peta."}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setPicking(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100"
                  >
                    <Route className="h-3.5 w-3.5" />
                    Rencanakan rute
                  </button>
                )}
              </div>
            )}

            {error && <p className="mt-2 text-flame-400">{error}</p>}

            <p className="mt-3 border-t border-ink-700 pt-2 text-[10px] leading-snug text-mist-600">
              Jalur dari OpenStreetMap (ODbL)
              {planner ? " · rute oleh OpenRouteService" : ""}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
