import { mulberry32, pick, range, jitter } from "./seed";

export type Region = "Northeast" | "Midwest" | "South" | "West" | "Mountain";
export type Channel = "Hypermarket" | "Supermarket" | "Convenience" | "HORECA" | "E-commerce";

export type Outlet = {
  id: string;
  name: string;
  region: Region;
  city: string;
  channel: Channel;
  banner: string;
  doors: number;
  weeklyVolume: number;
  performance: "above" | "on" | "below";
};

const cities: Record<Region, string[]> = {
  Northeast: ["Boston", "New York", "Philadelphia", "Pittsburgh", "Newark"],
  Midwest:   ["Chicago", "Detroit", "Minneapolis", "Indianapolis", "Cleveland"],
  South:     ["Atlanta", "Miami", "Houston", "Dallas", "Charlotte"],
  West:      ["Los Angeles", "San Francisco", "Seattle", "Portland", "San Diego"],
  Mountain:  ["Denver", "Salt Lake City", "Phoenix", "Albuquerque", "Boise"],
};

const banners: Record<Channel, string[]> = {
  Hypermarket: ["MegaMart", "GrandFresh", "ValuPlus"],
  Supermarket: ["FreshLane", "GreenBasket", "CityFoods"],
  Convenience: ["QuickStop", "CornerCo", "GoMart"],
  HORECA:      ["The Brass Tap", "Harbor Bistro", "Sunset Grill", "Riverside Hotel"],
  "E-commerce": ["MegaMart Online", "FreshLane Direct", "Pantry+"],
};

const channels: Channel[] = ["Hypermarket", "Supermarket", "Convenience", "HORECA", "E-commerce"];
const regions: Region[] = ["Northeast", "Midwest", "South", "West", "Mountain"];

export const OUTLETS: Outlet[] = range(48).map((i) => {
  const rng = mulberry32(2000 + i);
  const region = pick(rng, regions);
  const channel = pick(rng, channels);
  const banner = pick(rng, banners[channel]);
  const city = pick(rng, cities[region]);
  const doors = channel === "HORECA" ? 1 : Math.floor(jitter(rng, channel === "Hypermarket" ? 24 : channel === "Supermarket" ? 12 : 4, 0.5));
  const weeklyVolume = Math.floor(jitter(rng, doors * (channel === "HORECA" ? 80 : 420), 0.4));
  const perfRoll = rng();
  const performance: Outlet["performance"] = perfRoll < 0.25 ? "below" : perfRoll < 0.75 ? "on" : "above";
  return {
    id: `OUT-${(1000 + i).toString()}`,
    name: `${banner} — ${city}`,
    region,
    city,
    channel,
    banner,
    doors,
    weeklyVolume,
    performance,
  };
});

export function outletById(id: string) {
  return OUTLETS.find((o) => o.id === id);
}

export const REGIONS = regions;
export const CHANNELS = channels;
