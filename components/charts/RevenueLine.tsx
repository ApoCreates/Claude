"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { fmtCompact } from "@/lib/utils";

export default function RevenueLine({ data, dataKey = "revenue", height = 240, color = "#22d3ee" }: {
  data: { date: string; revenue: number; units?: number }[];
  dataKey?: "revenue" | "units";
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid stroke="#1f2933" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#8b97a7", fontSize: 11 }}
          tickFormatter={(d) => d.slice(5)}
          minTickGap={28}
          stroke="#1f2933"
        />
        <YAxis
          tick={{ fill: "#8b97a7", fontSize: 11 }}
          tickFormatter={(v) => fmtCompact(v)}
          stroke="#1f2933"
          width={48}
        />
        <Tooltip
          contentStyle={{ background: "#11151a", border: "1px solid #1f2933", borderRadius: 8, fontSize: 12 }}
          formatter={(v: number) => fmtCompact(v)}
          labelStyle={{ color: "#8b97a7" }}
        />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
