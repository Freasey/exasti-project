"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarDatum = { label: string; value: number; highlight?: boolean };

/** Bar chart ringkas dengan tema EcoCycle — dipakai di halaman Analytics. */
export function SimpleBarChart({
  data,
  unit,
  height = 220,
  decimals = 1,
}: {
  data: BarDatum[];
  unit: string;
  height?: number;
  /** Fungsi tidak bisa dikirim dari Server Component, jadi cukup jumlah desimal. */
  decimals?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#1e261c" strokeDasharray="4 6" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#616b60", fontSize: 11 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: "#616b60", fontSize: 11 }}
          />
          <Tooltip
            cursor={{ fill: "#151b14" }}
            contentStyle={{
              background: "#10150f",
              border: "1px solid #1e261c",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value) => [`${Number(value).toFixed(decimals)} ${unit}`, ""]}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.highlight || entry.value === max
                    ? "#8be04e"
                    : "#3f6f27"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
