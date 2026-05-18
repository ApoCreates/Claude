import { PRODUCTS } from "./products";
import { OUTLETS, REGIONS, CHANNELS, type Region, type Channel } from "./outlets";
import { mulberry32, jitter, range } from "./seed";

export type DailyPoint = { date: string; revenue: number; units: number };

export type SeriesByRegion = Record<Region, DailyPoint[]>;

const DAYS = 90;

function dateForOffset(offset: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (DAYS - 1 - offset));
  return d.toISOString().slice(0, 10);
}

// Base daily revenue per region anchored to outlet count & channel mix.
const REGION_BASE: Record<Region, number> = {
  Northeast: 184000,
  Midwest:   162000,
  South:     208000,
  West:      221000,
  Mountain:  94000,
};

export const DAILY_BY_REGION: SeriesByRegion = REGIONS.reduce((acc, r, ri) => {
  const rng = mulberry32(3000 + ri);
  acc[r] = range(DAYS).map((d) => {
    // weekly seasonality (peak Fri/Sat)
    const dow = (new Date(dateForOffset(d)).getUTCDay() + 6) % 7;
    const seasonal = 1 + (dow === 4 ? 0.18 : dow === 5 ? 0.22 : dow === 6 ? 0.12 : dow === 0 ? -0.08 : 0);
    // mild upward trend
    const trend = 1 + d * 0.0011;
    const noise = jitter(rng, 1, 0.04);
    const revenue = Math.floor(REGION_BASE[r] * seasonal * trend * noise);
    const units = Math.floor(revenue / 1.35);
    return { date: dateForOffset(d), revenue, units };
  });
  return acc;
}, {} as SeriesByRegion);

export function totalSeries(): DailyPoint[] {
  const map = new Map<string, DailyPoint>();
  for (const r of REGIONS) {
    for (const p of DAILY_BY_REGION[r]) {
      const cur = map.get(p.date) ?? { date: p.date, revenue: 0, units: 0 };
      cur.revenue += p.revenue;
      cur.units += p.units;
      map.set(p.date, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function ytdRevenue(days = DAYS) {
  return totalSeries().slice(-days).reduce((s, p) => s + p.revenue, 0);
}

export function priorPeriodRevenue(days = 30) {
  const t = totalSeries();
  const recent = t.slice(-days).reduce((s, p) => s + p.revenue, 0);
  const prior = t.slice(-(days * 2), -days).reduce((s, p) => s + p.revenue, 0);
  return { recent, prior };
}

// Revenue split by category over the period
export function revenueByCategory() {
  const total = ytdRevenue();
  const weights = { Soda: 0.34, Juice: 0.18, Water: 0.14, Energy: 0.21, Tea: 0.08, Dairy: 0.05 };
  return Object.entries(weights).map(([category, w]) => ({
    category,
    revenue: Math.floor(total * w),
    share: w,
  }));
}

// Revenue split by channel
export function revenueByChannel() {
  const total = ytdRevenue();
  const weights: Record<Channel, number> = {
    Hypermarket: 0.31,
    Supermarket: 0.34,
    Convenience: 0.16,
    HORECA: 0.11,
    "E-commerce": 0.08,
  };
  return CHANNELS.map((c) => ({
    channel: c,
    revenue: Math.floor(total * weights[c]),
    share: weights[c],
  }));
}

// Top SKUs derived from product margin & status with deterministic noise.
export function topSkus(limit = 8) {
  const total = ytdRevenue();
  const ranked = PRODUCTS.map((p, i) => {
    const rng = mulberry32(4000 + i);
    const statusWeight = p.status === "Core" ? 1.0 : p.status === "Growth" ? 0.85 : p.status === "Watch" ? 0.5 : 0.3;
    const w = statusWeight * jitter(rng, 1, 0.18);
    return { ...p, _w: w };
  });
  const sumW = ranked.reduce((s, r) => s + r._w, 0);
  return ranked
    .map((p) => ({
      sku: p.sku,
      name: p.name,
      brand: p.brand,
      category: p.category,
      revenue: Math.floor((p._w / sumW) * total * 0.78),
      growth: Number(((p.status === "Growth" ? 0.18 : p.status === "Core" ? 0.04 : p.status === "Watch" ? -0.03 : -0.12) + (mulberry32(p.sku.length * 9).call(null) - 0.5) * 0.06).toFixed(3)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

// Outlet-level rollup
export function outletPerformance() {
  return OUTLETS.map((o) => {
    const baseRev = o.weeklyVolume * 1.35;
    return {
      ...o,
      weeklyRevenue: Math.floor(baseRev),
      vsTarget:
        o.performance === "above" ? 0.08 + Math.random() * 0.06 :
        o.performance === "on"    ? -0.02 + Math.random() * 0.04 :
                                    -0.18 + Math.random() * 0.08,
    };
  });
}
