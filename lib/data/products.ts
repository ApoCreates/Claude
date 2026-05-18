import { mulberry32, jitter } from "./seed";

export type Product = {
  sku: string;
  name: string;
  brand: string;
  category: "Soda" | "Juice" | "Water" | "Energy" | "Tea" | "Dairy";
  pack: string;
  unitPrice: number;
  marginPct: number;
  launchedYear: number;
  status: "Core" | "Growth" | "Watch" | "Decline";
};

const seeds = [
  { name: "Aurora Cola Classic",   brand: "Aurora",   category: "Soda",   pack: "330ml can x24", price: 0.75, margin: 0.34, year: 1996, status: "Core" },
  { name: "Aurora Cola Zero",      brand: "Aurora",   category: "Soda",   pack: "330ml can x24", price: 0.78, margin: 0.36, year: 2008, status: "Growth" },
  { name: "Aurora Citrus Burst",   brand: "Aurora",   category: "Soda",   pack: "500ml PET x12", price: 1.05, margin: 0.30, year: 2014, status: "Watch" },
  { name: "Verde Orange Pure",     brand: "Verde",    category: "Juice",  pack: "1L carton x6",  price: 2.10, margin: 0.22, year: 2003, status: "Core" },
  { name: "Verde Apple Crisp",     brand: "Verde",    category: "Juice",  pack: "1L carton x6",  price: 2.05, margin: 0.21, year: 2007, status: "Core" },
  { name: "Verde Mango Sunrise",   brand: "Verde",    category: "Juice",  pack: "330ml PET x12", price: 1.25, margin: 0.28, year: 2019, status: "Growth" },
  { name: "Glacio Still",          brand: "Glacio",   category: "Water",  pack: "500ml PET x24", price: 0.45, margin: 0.18, year: 2001, status: "Core" },
  { name: "Glacio Sparkling Lime", brand: "Glacio",   category: "Water",  pack: "330ml can x24", price: 0.85, margin: 0.32, year: 2021, status: "Growth" },
  { name: "Volt Original",         brand: "Volt",     category: "Energy", pack: "250ml can x24", price: 1.85, margin: 0.42, year: 2010, status: "Core" },
  { name: "Volt Zero Sugar",       brand: "Volt",     category: "Energy", pack: "250ml can x24", price: 1.90, margin: 0.43, year: 2017, status: "Growth" },
  { name: "Volt Berry Rush",       brand: "Volt",     category: "Energy", pack: "330ml can x12", price: 2.20, margin: 0.39, year: 2022, status: "Growth" },
  { name: "Solace Green Tea",      brand: "Solace",   category: "Tea",    pack: "500ml PET x12", price: 1.40, margin: 0.26, year: 2012, status: "Watch" },
  { name: "Solace Peach Iced Tea", brand: "Solace",   category: "Tea",    pack: "500ml PET x12", price: 1.45, margin: 0.27, year: 2015, status: "Core" },
  { name: "Solace Lemon Honey",    brand: "Solace",   category: "Tea",    pack: "330ml PET x12", price: 1.30, margin: 0.24, year: 2009, status: "Decline" },
  { name: "Pasture Milk Whole",    brand: "Pasture",  category: "Dairy",  pack: "1L carton x6",  price: 1.95, margin: 0.16, year: 1999, status: "Core" },
  { name: "Pasture Choco Shake",   brand: "Pasture",  category: "Dairy",  pack: "330ml PET x12", price: 1.55, margin: 0.29, year: 2016, status: "Watch" },
];

export const PRODUCTS: Product[] = seeds.map((s, i) => {
  const rng = mulberry32(1000 + i);
  return {
    sku: `${s.brand.slice(0, 3).toUpperCase()}-${(100 + i).toString()}`,
    name: s.name,
    brand: s.brand,
    category: s.category as Product["category"],
    pack: s.pack,
    unitPrice: Number(jitter(rng, s.price, 0.02).toFixed(2)),
    marginPct: Number((s.margin + (rng() - 0.5) * 0.02).toFixed(3)),
    launchedYear: s.year,
    status: s.status as Product["status"],
  };
});

export function productBySku(sku: string) {
  return PRODUCTS.find((p) => p.sku === sku);
}

export const CATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.category)));
export const BRANDS = Array.from(new Set(PRODUCTS.map((p) => p.brand)));
