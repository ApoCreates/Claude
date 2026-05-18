"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const PALETTE = ["#e11d48", "#22d3ee", "#22c55e", "#f59e0b", "#a78bfa", "#f472b6", "#38bdf8"];

export default function SharePie({ data, nameKey, valueKey, height = 260 }: {
  data: any[]; nameKey: string; valueKey: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius={55} outerRadius={85} stroke="#0b0d10">
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#11151a", border: "1px solid #1f2933", borderRadius: 8, fontSize: 12 }}
          formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "#8b97a7" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
