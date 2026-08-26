"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ImpactPoint, ImpactRange } from "@/lib/queries";

const RANGE_LABEL: Record<ImpactRange, string> = {
  week: "7 Hari Terakhir",
  month: "30 Hari Terakhir",
  year: "12 Bulan Terakhir",
};

export function RangeSelect({ value }: { value: ImpactRange }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        next.set("range", event.target.value);
        startTransition(() => router.push(`${pathname}?${next}` as never));
      }}
      className="h-9 cursor-pointer rounded-lg border border-ink-700 bg-ink-800 px-3 text-sm text-mist-300 transition-colors hover:border-ink-600 focus:outline-none focus:ring-2 focus:ring-lime-400/30 disabled:opacity-60"
    >
      {(Object.keys(RANGE_LABEL) as ImpactRange[]).map((key) => (
        <option key={key} value={key}>
          {RANGE_LABEL[key]}
        </option>
      ))}
    </select>
  );
}

/** Grafik area CO₂ kumulatif sepanjang rentang yang dipilih. */
export function ImpactChart({ data }: { data: ImpactPoint[] }) {
  const peak = data.length > 0 ? data[data.length - 1] : null;
  // Tampilkan sebagian label saja supaya sumbu X tidak berdesakan.
  const tickStep = Math.max(1, Math.ceil(data.length / 5));

  return (
    <div className="relative h-56 w-full sm:h-64">
      {peak && peak.co2 > 0 && (
        <span className="absolute right-2 top-0 z-10 rounded-md bg-lime-400 px-2 py-1 text-xs font-semibold text-ink-950">
          {peak.co2.toFixed(1)} kg
        </span>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="co2Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8be04e" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8be04e" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#1e261c"
            strokeDasharray="4 6"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={tickStep - 1}
            tick={{ fill: "#616b60", fontSize: 11 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: "#616b60", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: "#2b352a", strokeWidth: 1 }}
            contentStyle={{
              background: "#10150f",
              border: "1px solid #1e261c",
              borderRadius: 12,
              fontSize: 12,
              color: "#e9efe7",
            }}
            labelStyle={{ color: "#8a948a", marginBottom: 4 }}
            formatter={(value, name) => [
              `${Number(value).toFixed(2)} kg`,
              name === "co2" ? "Total CO₂" : "CO₂ hari itu",
            ]}
          />
          <Area
            type="monotone"
            dataKey="co2"
            stroke="#8be04e"
            strokeWidth={2.5}
            fill="url(#co2Fill)"
            dot={false}
            activeDot={{ r: 4, fill: "#8be04e", stroke: "#0a0d0a", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
