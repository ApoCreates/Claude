export type Competitor = {
  id: string;
  name: string;
  hq: string;
  founded: number;
  categories: string[];
  marketSharePct: number;
  trend: "up" | "down" | "flat";
  threatLevel: "low" | "medium" | "high";
  notable: string;
};

export const COMPETITORS: Competitor[] = [
  {
    id: "cmp-cascade",
    name: "Cascade Beverages",
    hq: "Atlanta, GA",
    founded: 1948,
    categories: ["Soda", "Water", "Tea"],
    marketSharePct: 22.4,
    trend: "flat",
    threatLevel: "high",
    notable: "Just launched a zero-calorie line targeting Gen-Z; aggressive shelf pricing in hypermarkets.",
  },
  {
    id: "cmp-northwave",
    name: "Northwave Drinks Co.",
    hq: "Seattle, WA",
    founded: 2003,
    categories: ["Juice", "Tea", "Water"],
    marketSharePct: 9.1,
    trend: "up",
    threatLevel: "high",
    notable: "Premium cold-pressed juice — winning HORECA accounts in West & Northeast.",
  },
  {
    id: "cmp-solbright",
    name: "Solbright Foods",
    hq: "Dallas, TX",
    founded: 1971,
    categories: ["Dairy", "Juice"],
    marketSharePct: 14.6,
    trend: "down",
    threatLevel: "medium",
    notable: "Distribution contraction in Midwest after a recall; weakening dairy share.",
  },
  {
    id: "cmp-amperion",
    name: "Amperion Energy",
    hq: "Austin, TX",
    founded: 2014,
    categories: ["Energy"],
    marketSharePct: 6.8,
    trend: "up",
    threatLevel: "high",
    notable: "Aggressive convenience-channel expansion; influencer-led marketing eating into Volt's young-male segment.",
  },
  {
    id: "cmp-meridian",
    name: "Meridian Pure",
    hq: "Denver, CO",
    founded: 1989,
    categories: ["Water"],
    marketSharePct: 11.2,
    trend: "flat",
    threatLevel: "medium",
    notable: "Dominant in Mountain region private-label water; raising prices 4% next quarter.",
  },
];

export function competitorById(id: string) {
  return COMPETITORS.find((c) => c.id === id);
}

export type SharePoint = { brand: string; share: number };
export function categoryShare(category: string): SharePoint[] {
  // Hand-tuned shares for a believable narrative
  const map: Record<string, SharePoint[]> = {
    Soda: [
      { brand: "Cascade Beverages", share: 0.34 },
      { brand: "Aurora (us)", share: 0.27 },
      { brand: "Private label", share: 0.18 },
      { brand: "Others", share: 0.21 },
    ],
    Juice: [
      { brand: "Solbright Foods", share: 0.29 },
      { brand: "Northwave Drinks Co.", share: 0.21 },
      { brand: "Verde (us)", share: 0.24 },
      { brand: "Others", share: 0.26 },
    ],
    Water: [
      { brand: "Meridian Pure", share: 0.22 },
      { brand: "Glacio (us)", share: 0.19 },
      { brand: "Cascade Beverages", share: 0.17 },
      { brand: "Private label", share: 0.28 },
      { brand: "Others", share: 0.14 },
    ],
    Energy: [
      { brand: "Volt (us)", share: 0.31 },
      { brand: "Amperion Energy", share: 0.22 },
      { brand: "Cascade ChargeX", share: 0.19 },
      { brand: "Others", share: 0.28 },
    ],
    Tea: [
      { brand: "Northwave Drinks Co.", share: 0.26 },
      { brand: "Solace (us)", share: 0.18 },
      { brand: "Cascade Beverages", share: 0.20 },
      { brand: "Others", share: 0.36 },
    ],
    Dairy: [
      { brand: "Solbright Foods", share: 0.41 },
      { brand: "Pasture (us)", share: 0.12 },
      { brand: "Others", share: 0.47 },
    ],
  };
  return map[category] ?? [];
}
