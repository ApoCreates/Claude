"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { fmtCompact } from "@/lib/utils";

const PALETTE = ["#e11d48", "#22d3ee", "#22c55e", "#f59e0b", "#a78bfa", "#f472b6"];

export default function CategoryBar({ data, xKey, yKey, height = 240 }: {
  data: any[]; xKey: string; yKey: string; height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <XAxis dataKey={xKey} tick={{ fill: "#8b97a7", fontSize: 11 }} stroke="#1f2933" />
        <YAxis tick={{ fill: "#8b97a7", fontSize: 11 }} tickFormatter={(v) => fmtCompact(v)} stroke="#1f2933" width={48} />
        <Tooltip
          contentStyle={{ background: "#11151a", border: "1px solid #1f2933", borderRadius: 8, fontSize: 12 }}
          formatter={(v: number) => fmtCompact(v)}
          labelStyle={{ color: "#8b97a7" }}
        />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
