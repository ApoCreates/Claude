// All player-visible strings live here. Switching language = swapping this data.
// Arabic entries are real words with their transliteration and English meaning —
// no invented or random words anywhere in the game or the store.

export const STR = {
  title: "Dubai Kindness Quest",
  tagline: "Roam Dubai. Be kind. Get welcomed.",

  hud: {
    kindness: "Kindness",
    dirhams: "Dirhams",       // AED, the real currency of Dubai
    reputation: "Reputation",
    onFoot: "On foot",
    driving: "Driving",
    flying: "Flying",
    swimming: "Swimming",
  },

  // Real Arabic reputation tiers, lowest to highest (word — transliteration — meaning)
  ranks: [
    { ar: "ضيف",  tr: "Dayf",    en: "Guest",    at: 0 },
    { ar: "صديق", tr: "Sadeeq",  en: "Friend",   at: 8 },
    { ar: "جار",  tr: "Jaar",    en: "Neighbor", at: 20 },
    { ar: "أهل",  tr: "Ahl",     en: "Family",   at: 40 },
    { ar: "كريم", tr: "Kareem",  en: "Generous", at: 70 },
  ],

  // Real Arabic things people thank you with / greet you with
  greetings: [
    { ar: "مرحبا",            tr: "Marhaba",            en: "Hello" },
    { ar: "السلام عليكم",     tr: "As-salamu alaykum",  en: "Peace be upon you" },
    { ar: "أهلا وسهلا",       tr: "Ahlan wa sahlan",    en: "Welcome" },
  ],
  thanks: [
    { ar: "شكرا",       tr: "Shukran",        en: "Thank you" },
    { ar: "شكرا جزيلا", tr: "Shukran jazeelan", en: "Thank you so much" },
    { ar: "بارك الله فيك", tr: "Barak Allahu feek", en: "Bless you" },
  ],

  // What a citizen needs — all gentle, kindness-based, never aggressive
  needs: [
    { en: "is lost and needs directions", icon: "?" },
    { en: "is thirsty in the heat",       icon: "~" },
    { en: "dropped their shopping",       icon: "!" },
    { en: "wants a friendly hello",       icon: "♡" },
    { en: "is looking for the metro",     icon: "M" },
  ],

  // The store — every item is a real Arabic word with its meaning.
  store: {
    title: "المتجر",          // "Al-Matjar" = The Store
    titleTr: "Al-Matjar (The Store)",
    hint: "Buy a gift, then give it to someone who needs help for more kindness.",
    buy: "Buy",
    owned: "Owned",
    close: "Close",
    cantAfford: "Not enough dirhams",
    items: [
      { id: "maa",      ar: "ماء",     tr: "Maa'",     en: "Water",     price: 10, kind: 1, kind_gift: true },
      { id: "qahwa",    ar: "قهوة",    tr: "Qahwa",    en: "Coffee",    price: 15, kind: 2, kind_gift: true },
      { id: "tamr",     ar: "تمر",     tr: "Tamr",     en: "Dates",     price: 20, kind: 2, kind_gift: true },
      { id: "khubz",    ar: "خبز",     tr: "Khubz",    en: "Bread",     price: 18, kind: 2, kind_gift: true },
      { id: "ward",     ar: "ورد",     tr: "Ward",     en: "Flowers",   price: 28, kind: 3, kind_gift: true },
      { id: "hadiya",   ar: "هدية",    tr: "Hadiya",   en: "Gift",      price: 45, kind: 4, kind_gift: true },
      { id: "khareeta", ar: "خريطة",   tr: "Khareeta", en: "Map",       price: 50, util: "map",   desc: "Shows everyone who needs help" },
      { id: "hidhaa",   ar: "حذاء",    tr: "Hidhaa'",  en: "Shoes",     price: 60, util: "speed", desc: "Walk a little faster" },
    ],
  },

  prompts: {
    help: "Press SPACE to help",
    give: "Press SPACE to give",
    shop: "Press SPACE to open the store",
    ride: "Press E to drive",
    fly: "Press E to fly",
    exit: "Press E to get out",
  },

  intro: {
    line1: "You are a new expat in Dubai.",
    line2: "Walk, drive, fly and swim across the city.",
    line3: "Help the people you meet — kindness is your only goal.",
    start: "Press SPACE / tap to begin",
  },

  rankUp: "New reputation: ",
  gaveGift: "You gave ",
  kindWord: "You shared a kind word",
};
