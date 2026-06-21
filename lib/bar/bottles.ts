// Built-in catalog of the most common bar bottles, each with a silhouette
// profile so we can convert a visible liquid level into an accurate volume.
//
// Coordinate system for `silhouette`:
//   y: 0 = inside bottom of the bottle, 1 = top of the cap
//   r: relative radius at that height (0..1, where 1 is the widest point)
// `fullY` is the y-height of the liquid surface in a brand-new, unopened
// bottle (the "full line" — usually at the base of the neck / shoulder).

export type ShapePoint = { y: number; r: number };

export type Category =
  | "Whiskey"
  | "Bourbon"
  | "Scotch"
  | "Vodka"
  | "Gin"
  | "Rum"
  | "Tequila"
  | "Liqueur"
  | "Cognac"
  | "Wine"
  | "Vermouth";

export type Bottle = {
  id: string;
  brand: string;
  name: string;
  category: Category;
  volumeMl: number;
  /** CSS color of the liquid, used by the fill gauge. */
  color: string;
  silhouette: ShapePoint[];
  fullY: number;
  keywords?: string[];
};

// ----- Reusable silhouette templates ---------------------------------------

const SHAPES = {
  // Square / high-shouldered (Jack Daniel's, Bordeaux-ish spirit bottles)
  squareShoulder: {
    fullY: 0.66,
    silhouette: [
      { y: 0.0, r: 0.95 },
      { y: 0.05, r: 1.0 },
      { y: 0.6, r: 1.0 },
      { y: 0.66, r: 0.96 },
      { y: 0.71, r: 0.42 },
      { y: 0.93, r: 0.3 },
      { y: 1.0, r: 0.34 },
    ] as ShapePoint[],
  },
  // Rounded shoulder — the most common spirit shape (Jameson, Bacardi…)
  roundShoulder: {
    fullY: 0.67,
    silhouette: [
      { y: 0.0, r: 0.92 },
      { y: 0.05, r: 1.0 },
      { y: 0.55, r: 1.0 },
      { y: 0.63, r: 0.96 },
      { y: 0.72, r: 0.7 },
      { y: 0.8, r: 0.42 },
      { y: 0.93, r: 0.3 },
      { y: 1.0, r: 0.34 },
    ] as ShapePoint[],
  },
  // Tall, slim cylinder (Grey Goose, Belvedere, Ketel One)
  slimCylinder: {
    fullY: 0.72,
    silhouette: [
      { y: 0.0, r: 0.82 },
      { y: 0.04, r: 0.85 },
      { y: 0.66, r: 0.85 },
      { y: 0.72, r: 0.82 },
      { y: 0.78, r: 0.55 },
      { y: 0.86, r: 0.34 },
      { y: 0.95, r: 0.28 },
      { y: 1.0, r: 0.32 },
    ] as ShapePoint[],
  },
  // Apothecary / bell — wide base tapering upward (Bombay, Hendrick's)
  bell: {
    fullY: 0.62,
    silhouette: [
      { y: 0.0, r: 1.0 },
      { y: 0.45, r: 0.86 },
      { y: 0.58, r: 0.78 },
      { y: 0.66, r: 0.58 },
      { y: 0.8, r: 0.4 },
      { y: 0.94, r: 0.3 },
      { y: 1.0, r: 0.34 },
    ] as ShapePoint[],
  },
  // Bulbous (Hennessy, Grand Marnier, Patrón-ish)
  bulb: {
    fullY: 0.6,
    silhouette: [
      { y: 0.0, r: 0.72 },
      { y: 0.18, r: 1.0 },
      { y: 0.4, r: 1.0 },
      { y: 0.55, r: 0.85 },
      { y: 0.66, r: 0.55 },
      { y: 0.84, r: 0.36 },
      { y: 1.0, r: 0.4 },
    ] as ShapePoint[],
  },
  // Wine — tall straight body, high square shoulder (Bordeaux)
  wine: {
    fullY: 0.71,
    silhouette: [
      { y: 0.0, r: 0.95 },
      { y: 0.04, r: 1.0 },
      { y: 0.63, r: 1.0 },
      { y: 0.67, r: 0.96 },
      { y: 0.71, r: 0.4 },
      { y: 0.95, r: 0.28 },
      { y: 1.0, r: 0.3 },
    ] as ShapePoint[],
  },
};

// ----- Liquid colors -------------------------------------------------------

const C = {
  clear: "#dff1f6",
  vodka: "#e6f4f8",
  whiskey: "#c8821e",
  bourbon: "#b96a17",
  scotch: "#c47a1c",
  goldRum: "#a8631f",
  spicedRum: "#8a4b1a",
  reposado: "#d9a441",
  cognac: "#7a3a12",
  amber: "#b5651d",
  cream: "#cdab74",
  coffee: "#241006",
  aperol: "#e9591a",
  campari: "#9e1b32",
  jager: "#2c1608",
  redWine: "#5e1622",
  whiteWine: "#e3dba0",
  vermouth: "#6e2417",
};

function make(
  id: string,
  brand: string,
  name: string,
  category: Category,
  color: string,
  shape: { fullY: number; silhouette: ShapePoint[] },
  volumeMl = 750,
  keywords: string[] = []
): Bottle {
  return { id, brand, name, category, color, volumeMl, ...shape, keywords };
}

// ----- The catalog ---------------------------------------------------------

export const BOTTLES: Bottle[] = [
  // Whiskey / Bourbon / Scotch
  make("jack-daniels", "Jack Daniel's", "Old No. 7 Tennessee Whiskey", "Whiskey", C.whiskey, SHAPES.squareShoulder, 750, ["jd", "tennessee"]),
  make("jim-beam", "Jim Beam", "Bourbon", "Bourbon", C.bourbon, SHAPES.roundShoulder, 750),
  make("makers-mark", "Maker's Mark", "Bourbon", "Bourbon", C.bourbon, SHAPES.squareShoulder, 750, ["wax"]),
  make("bulleit", "Bulleit", "Bourbon Frontier Whiskey", "Bourbon", C.bourbon, SHAPES.roundShoulder, 750),
  make("buffalo-trace", "Buffalo Trace", "Kentucky Bourbon", "Bourbon", C.bourbon, SHAPES.roundShoulder, 750),
  make("woodford", "Woodford Reserve", "Kentucky Bourbon", "Bourbon", C.bourbon, SHAPES.bulb, 750),
  make("wild-turkey", "Wild Turkey", "101 Bourbon", "Bourbon", C.bourbon, SHAPES.roundShoulder, 750),
  make("jameson", "Jameson", "Irish Whiskey", "Whiskey", C.whiskey, SHAPES.roundShoulder, 750, ["irish"]),
  make("crown-royal", "Crown Royal", "Canadian Whisky", "Whiskey", C.whiskey, SHAPES.roundShoulder, 750, ["bag", "canadian"]),
  make("jw-black", "Johnnie Walker", "Black Label", "Scotch", C.scotch, SHAPES.squareShoulder, 750, ["jw", "scotch"]),
  make("jw-red", "Johnnie Walker", "Red Label", "Scotch", C.scotch, SHAPES.squareShoulder, 750, ["jw", "scotch"]),
  make("glenfiddich-12", "Glenfiddich", "12 Year Single Malt", "Scotch", C.scotch, SHAPES.roundShoulder, 750, ["single malt"]),
  make("macallan-12", "The Macallan", "12 Year Sherry Oak", "Scotch", C.scotch, SHAPES.roundShoulder, 750, ["single malt"]),
  make("chivas-12", "Chivas Regal", "12 Year Blended Scotch", "Scotch", C.scotch, SHAPES.roundShoulder, 750),
  make("dewars", "Dewar's", "White Label Scotch", "Scotch", C.scotch, SHAPES.roundShoulder, 750),

  // Vodka
  make("absolut", "Absolut", "Vodka", "Vodka", C.vodka, SHAPES.roundShoulder, 750, ["medicine"]),
  make("smirnoff", "Smirnoff", "No. 21 Vodka", "Vodka", C.vodka, SHAPES.slimCylinder, 750),
  make("grey-goose", "Grey Goose", "Vodka", "Vodka", C.vodka, SHAPES.slimCylinder, 750),
  make("titos", "Tito's", "Handmade Vodka", "Vodka", C.vodka, SHAPES.roundShoulder, 750),
  make("ketel-one", "Ketel One", "Vodka", "Vodka", C.vodka, SHAPES.slimCylinder, 750),
  make("belvedere", "Belvedere", "Vodka", "Vodka", C.vodka, SHAPES.slimCylinder, 750),
  make("stoli", "Stolichnaya", "Vodka", "Vodka", C.vodka, SHAPES.roundShoulder, 750, ["stoli"]),

  // Gin
  make("tanqueray", "Tanqueray", "London Dry Gin", "Gin", C.clear, SHAPES.bulb, 750),
  make("bombay", "Bombay Sapphire", "London Dry Gin", "Gin", "#bfe3ec", SHAPES.bell, 750, ["blue"]),
  make("hendricks", "Hendrick's", "Gin", "Gin", C.clear, SHAPES.bell, 750, ["apothecary", "dark bottle"]),
  make("beefeater", "Beefeater", "London Dry Gin", "Gin", C.clear, SHAPES.roundShoulder, 750),

  // Rum
  make("bacardi", "Bacardi", "Superior White Rum", "Rum", C.clear, SHAPES.roundShoulder, 750, ["white rum"]),
  make("captain-morgan", "Captain Morgan", "Original Spiced Rum", "Rum", C.spicedRum, SHAPES.roundShoulder, 750, ["spiced"]),
  make("malibu", "Malibu", "Coconut Rum", "Rum", "#f2ead9", SHAPES.slimCylinder, 750, ["coconut"]),
  make("havana-7", "Havana Club", "Añejo 7 Años", "Rum", C.goldRum, SHAPES.roundShoulder, 750),
  make("kraken", "The Kraken", "Black Spiced Rum", "Rum", C.coffee, SHAPES.bulb, 750, ["black"]),

  // Tequila
  make("cuervo", "Jose Cuervo", "Especial Gold", "Tequila", C.reposado, SHAPES.roundShoulder, 750),
  make("patron", "Patrón", "Silver", "Tequila", C.clear, SHAPES.bulb, 750, ["plata"]),
  make("don-julio", "Don Julio", "Blanco", "Tequila", C.clear, SHAPES.slimCylinder, 750),
  make("espolon", "Espolòn", "Blanco", "Tequila", C.clear, SHAPES.roundShoulder, 750),
  make("1800", "1800", "Reposado", "Tequila", C.reposado, SHAPES.squareShoulder, 750),

  // Liqueurs
  make("cointreau", "Cointreau", "Orange Liqueur", "Liqueur", "#e8b15a", SHAPES.squareShoulder, 750, ["triple sec"]),
  make("grand-marnier", "Grand Marnier", "Cordon Rouge", "Liqueur", C.amber, SHAPES.bulb, 750),
  make("baileys", "Baileys", "Irish Cream", "Liqueur", C.cream, SHAPES.roundShoulder, 750, ["cream"]),
  make("kahlua", "Kahlúa", "Coffee Liqueur", "Liqueur", C.coffee, SHAPES.roundShoulder, 750, ["coffee"]),
  make("aperol", "Aperol", "Aperitivo", "Liqueur", C.aperol, SHAPES.roundShoulder, 750, ["spritz"]),
  make("campari", "Campari", "Aperitivo", "Liqueur", C.campari, SHAPES.roundShoulder, 750),
  make("jager", "Jägermeister", "Herbal Liqueur", "Liqueur", C.jager, SHAPES.squareShoulder, 750, ["jager", "green bottle"]),
  make("disaronno", "Disaronno", "Originale Amaretto", "Liqueur", C.amber, SHAPES.squareShoulder, 750, ["amaretto"]),
  make("triple-sec", "Triple Sec", "Orange Liqueur (generic)", "Liqueur", "#e8b15a", SHAPES.roundShoulder, 750),
  make("st-germain", "St-Germain", "Elderflower Liqueur", "Liqueur", "#e7d98a", SHAPES.bulb, 750),

  // Cognac / Brandy
  make("hennessy", "Hennessy", "V.S Cognac", "Cognac", C.cognac, SHAPES.bulb, 750),
  make("remy-vsop", "Rémy Martin", "VSOP Cognac", "Cognac", C.cognac, SHAPES.bulb, 750),

  // Wine / Vermouth
  make("red-wine", "Red Wine", "Bordeaux (generic)", "Wine", C.redWine, SHAPES.wine, 750),
  make("white-wine", "White Wine", "Generic", "Wine", C.whiteWine, SHAPES.wine, 750),
  make("martini-rosso", "Martini", "Rosso Vermouth", "Vermouth", C.vermouth, SHAPES.roundShoulder, 1000),
];

export const BOTTLES_BY_ID: Record<string, Bottle> = Object.fromEntries(
  BOTTLES.map((b) => [b.id, b])
);

export function findBottle(id?: string | null): Bottle | undefined {
  if (!id) return undefined;
  return BOTTLES_BY_ID[id];
}

export function bottleLabel(b: Bottle): string {
  return `${b.brand} — ${b.name}`;
}

/** Simple typeahead: matches brand, name, category and keywords. */
export function searchBottles(query: string, limit = 8): Bottle[] {
  const q = query.trim().toLowerCase();
  if (!q) return BOTTLES.slice(0, limit);
  const terms = q.split(/\s+/);
  const scored = BOTTLES.map((b) => {
    const hay = `${b.brand} ${b.name} ${b.category} ${(b.keywords || []).join(" ")}`.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (!hay.includes(t)) return { b, score: -1 };
      // Reward prefix matches on the brand the most.
      if (b.brand.toLowerCase().startsWith(t)) score += 5;
      else if (hay.startsWith(t)) score += 3;
      else score += 1;
    }
    return { b, score };
  })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.b);
}

export const COMMON_SIZES = [
  { ml: 375, label: "375 ml (half)" },
  { ml: 700, label: "700 ml" },
  { ml: 750, label: "750 ml (standard)" },
  { ml: 1000, label: "1 L" },
  { ml: 1750, label: "1.75 L (handle)" },
];
