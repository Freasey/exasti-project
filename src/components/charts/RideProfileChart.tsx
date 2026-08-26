"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProfilePoint } from "@/lib/types";

type Metric = "alt" | "spd";

const META: Record<Metric, { label: string; unit: string; color: string }> = {
  alt: { label: "Elevasi", unit: "m", color: "#8be04e" },
  spd: { label: "Kecepatan", unit: "km/j", color: "#f4562a" },
};

/** Grafik elevasi / kecepatan sepanjang jarak tempuh satu ride. */
export function RideProfileChart({ profile }: { profile: ProfilePoint[] }) {
  const [metric, setMetric] = useState<Metric>("alt");
  const hasAltitude = profile.some((p) => p.alt !== null);
  // Ride pendek lebih enak dibaca dalam meter daripada "0,0 km".
  const totalDistance = profile.length > 0 ? profile[profile.length - 1].d : 0;
  const inMeters = totalDistance < 2000;
  const active = hasAltitude ? metric : "spd";
  const meta = META[active];

  if (profile.length < 2) {
    return (
      <p className="px-5 py-10 text-center text-sm text-mist-500">
        Data profil rute tidak tersedia untuk ride ini.
      </p>
    );
  }

  return (
    <div className="p-5 pt-2">
      {hasAltitude && (
        <div className="mb-3 flex gap-1.5">
          {(Object.keys(META) as Metric[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setMetric(key)}
              className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                active === key
                  ? "bg-ink-700 text-mist-100"
                  : "text-mist-500 hover:bg-ink-800 hover:text-mist-300"
              }`}
            >
              {META[key].label}
            </button>
          ))}
        </div>
      )}

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={profile} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={`fill-${active}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={meta.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={meta.color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e261c" strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="d"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#616b60", fontSize: 11 }}
              tickFormatter={(v: number) =>
                inMeters ? `${Math.round(v)}` : `${(v / 1000).toFixed(1)}`
              }
              minTickGap={28}
              dy={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={46}
              tick={{ fill: "#616b60", fontSize: 11 }}
            />
            <Tooltip
              cursor={{ stroke: "#2b352a" }}
              contentStyle={{
                background: "#10150f",
                border: "1px solid #1e261c",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={(v) =>
                inMeters
                  ? `${Math.round(Number(v))} m`
                  : `km ${(Number(v) / 1000).toFixed(2)}`
              }
              formatter={(value) => [`${Number(value).toFixed(1)} ${meta.unit}`, meta.label]}
            />
            <Area
              type="monotone"
              dataKey={active}
              stroke={meta.color}
              strokeWidth={2}
              fill={`url(#fill-${active})`}
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-[11px] text-mist-600">
        jarak ({inMeters ? "m" : "km"})
      </p>
    </div>
  );
}
