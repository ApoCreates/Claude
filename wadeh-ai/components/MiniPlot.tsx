"use client";

// A quiet SVG function plotter — hairlines on ink, one marigold curve.
// Used by the math lab and by the tutor when it "draws" an answer.
export function MiniPlot({
  fn,
  xMin = -10,
  xMax = 10,
  yMin = -10,
  yMax = 10,
  height = 220,
  label,
}: {
  fn: (x: number) => number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  height?: number;
  label?: string;
}) {
  const W = 320;
  const H = height;
  const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
  const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

  const pts: string[] = [];
  const steps = 160;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = fn(x);
    if (Number.isFinite(y) && y >= yMin - 5 && y <= yMax + 5) {
      pts.push(`${sx(x).toFixed(1)},${sy(Math.max(yMin, Math.min(yMax, y))).toFixed(1)}`);
    }
  }

  const gridLines: JSX.Element[] = [];
  for (let gx = Math.ceil(xMin); gx <= xMax; gx += Math.max(1, Math.round((xMax - xMin) / 10))) {
    gridLines.push(
      <line key={`vx${gx}`} x1={sx(gx)} y1={0} x2={sx(gx)} y2={H} stroke="rgba(21,20,15,0.08)" strokeWidth="1" />
    );
  }
  for (let gy = Math.ceil(yMin); gy <= yMax; gy += Math.max(1, Math.round((yMax - yMin) / 10))) {
    gridLines.push(
      <line key={`hy${gy}`} x1={0} y1={sy(gy)} x2={W} y2={sy(gy)} stroke="rgba(21,20,15,0.08)" strokeWidth="1" />
    );
  }

  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full border border-hairline bg-ink" role="img" aria-label={label ?? "graph"}>
        {gridLines}
        {/* axes */}
        {yMin <= 0 && yMax >= 0 && <line x1={0} y1={sy(0)} x2={W} y2={sy(0)} stroke="rgba(21,20,15,0.4)" strokeWidth="1" />}
        {xMin <= 0 && xMax >= 0 && <line x1={sx(0)} y1={0} x2={sx(0)} y2={H} stroke="rgba(21,20,15,0.4)" strokeWidth="1" />}
        <polyline points={pts.join(" ")} fill="none" stroke="#C4612A" strokeWidth="2.5" />
      </svg>
      {label && <p className="eyebrow mt-2">{label}</p>}
    </div>
  );
}

/**
 * Parse a tutor "PLOT" directive into a plottable function.
 * Supported: `PLOT linear m b` · `PLOT quad a b c` · `PLOT sin A k`
 */
export function parsePlotDirective(line: string): { fn: (x: number) => number; label: string } | null {
  const m = line.trim().match(/^PLOT\s+(linear|quad|sin)\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s+(-?[\d.]+))?/i);
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const a = parseFloat(m[2]);
  const b = parseFloat(m[3]);
  const c = m[4] !== undefined ? parseFloat(m[4]) : 0;
  if (kind === "linear") return { fn: (x) => a * x + b, label: `y = ${a}x ${b >= 0 ? "+" : "−"} ${Math.abs(b)}` };
  if (kind === "quad") return { fn: (x) => a * x * x + b * x + c, label: `y = ${a}x² ${b >= 0 ? "+" : "−"} ${Math.abs(b)}x ${c >= 0 ? "+" : "−"} ${Math.abs(c)}` };
  return { fn: (x) => a * Math.sin(b * x), label: `y = ${a}·sin(${b}x)` };
}
