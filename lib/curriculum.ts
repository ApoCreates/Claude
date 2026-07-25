// The wadehAI curriculum — 10 subjects, each with 10 levels where
// one level = one school year (Year 1 … Year 10), in two languages,
// with worked examples flavoured for each region (GCC / Levant).

import { MATH_LEVELS } from "./levels/math";
import { PHYSICS_LEVELS } from "./levels/physics";
import { GEOGRAPHY_LEVELS } from "./levels/geography";
import { AI_LEVELS } from "./levels/ai";
import { GAMING_LEVELS } from "./levels/gaming";
import { ENTREPRENEURSHIP_LEVELS } from "./levels/entrepreneurship";
import { LEADERSHIP_LEVELS } from "./levels/leadership";
import { PROBLEM_SOLVING_LEVELS } from "./levels/problem-solving";
import { EQ_LEVELS } from "./levels/emotional-intelligence";
import { LANGUAGES_LEVELS } from "./levels/languages";

export type Track = "education" | "life";
export type Region = "gcc" | "levant";
export type Lang = "en" | "ar";

export interface Bi {
  en: string;
  ar: string;
}

export interface Level {
  n: number; // 1–10, equals the school year
  title: Bi;
  focus: Bi; // what this school year covers
  units: Bi[]; // the year's four units
}

export interface Subject {
  slug: string;
  track: Track;
  name: Bi;
  tagline: Bi;
  regionExample: Record<Region, Bi>;
  levels: Level[];
}

export const SUBJECTS: Subject[] = [
  {
    slug: "math",
    track: "education",
    name: { en: "Mathematics", ar: "الرياضيات" },
    tagline: {
      en: "Ten school years of maths, from counting to pre-calculus.",
      ar: "عشر سنوات دراسية من الرياضيات، من العدّ إلى ما قبل التفاضل.",
    },
    regionExample: {
      gcc: {
        en: "Model the geometry of Louvre Abu Dhabi's dome, or compound growth of a Dubai savings plan.",
        ar: "نمذجة هندسة قبة اللوفر أبوظبي، أو النمو المركّب لخطة ادخار في دبي.",
      },
      levant: {
        en: "Measure the amphitheatre of Amman like a Roman engineer, or the slope of Beirut's stairs.",
        ar: "قِس المدرج الروماني في عمّان كمهندس روماني، أو ميل أدراج بيروت.",
      },
    },
    levels: MATH_LEVELS,
  },
  {
    slug: "physics",
    track: "education",
    name: { en: "Physics", ar: "الفيزياء" },
    tagline: {
      en: "From pushes and pulls to momentum and modern physics.",
      ar: "من الدفع والسحب إلى الزخم والفيزياء الحديثة.",
    },
    regionExample: {
      gcc: {
        en: "Why does Burj Khalifa sway — and why is that a good thing? Thermodynamics of desert cooling.",
        ar: "لماذا يتمايل برج خليفة — ولماذا هذا أمر جيد؟ والديناميكا الحرارية لتبريد الصحراء.",
      },
      levant: {
        en: "Why does the Dead Sea hold you up? Buoyancy, density and pressure at the lowest point on Earth.",
        ar: "لماذا يحملك البحر الميت؟ الطفو والكثافة والضغط في أخفض نقطة على الأرض.",
      },
    },
    levels: PHYSICS_LEVELS,
  },
  {
    slug: "geography",
    track: "education",
    name: { en: "Geography", ar: "الجغرافيا" },
    tagline: {
      en: "From your front door to satellites — ten years of reading the world.",
      ar: "من باب بيتك إلى الأقمار الاصطناعية — عشر سنوات من قراءة العالم.",
    },
    regionExample: {
      gcc: {
        en: "From the Empty Quarter to artificial islands: how the Gulf reshaped its own geography.",
        ar: "من الربع الخالي إلى الجزر الاصطناعية: كيف أعاد الخليج تشكيل جغرافيته.",
      },
      levant: {
        en: "The Jordan River, the cedars of Lebanon, and why the Fertile Crescent fed the first cities.",
        ar: "نهر الأردن وأرز لبنان، ولماذا أطعم الهلال الخصيب أولى المدن.",
      },
    },
    levels: GEOGRAPHY_LEVELS,
  },
  {
    slug: "ai",
    track: "education",
    name: { en: "Artificial Intelligence", ar: "الذكاء الاصطناعي" },
    tagline: {
      en: "From 'smart or not?' to building AI for your community.",
      ar: "من «ذكي أم لا؟» إلى بناء ذكاء اصطناعي يخدم مجتمعك.",
    },
    regionExample: {
      gcc: {
        en: "How the UAE and Saudi built national AI strategies — and what a student can build today.",
        ar: "كيف بنت الإمارات والسعودية استراتيجيات وطنية للذكاء الاصطناعي — وما الذي يمكن لطالب بناؤه اليوم.",
      },
      levant: {
        en: "From Amman's startups to Beirut's engineers: building AI products with limited resources.",
        ar: "من شركات عمّان الناشئة إلى مهندسي بيروت: بناء منتجات ذكاء اصطناعي بموارد محدودة.",
      },
    },
    levels: AI_LEVELS,
  },
  {
    slug: "gaming",
    track: "education",
    name: { en: "Game Design", ar: "تصميم الألعاب" },
    tagline: {
      en: "From playground rules to shipping your first real game.",
      ar: "من قواعد الساحة إلى إطلاق لعبتك الحقيقية الأولى.",
    },
    regionExample: {
      gcc: {
        en: "The Gulf is investing billions in gaming. Design a game set in a future Gulf megacity.",
        ar: "يستثمر الخليج مليارات في قطاع الألعاب. صمّم لعبة تدور في مدينة خليجية مستقبلية.",
      },
      levant: {
        en: "Prototype a game that retells a Levantine folk tale — mechanics from your grandmother's stories.",
        ar: "صمّم نموذج لعبة يعيد سرد حكاية شعبية شامية — ميكانيكيات من حكايا جدّتك.",
      },
    },
    levels: GAMING_LEVELS,
  },
  {
    slug: "entrepreneurship",
    track: "life",
    name: { en: "Entrepreneurship", ar: "ريادة الأعمال" },
    tagline: {
      en: "From a lemonade stand to launching a real venture.",
      ar: "من بسطة الليمونادة إلى إطلاق مشروع حقيقي.",
    },
    regionExample: {
      gcc: {
        en: "Careem started in Dubai and sold for $3.1B. Trace its playbook, then draft your own.",
        ar: "بدأت كريم في دبي وبيعت بـ٣٫١ مليار دولار. تتبّع خطتها ثم ارسم خطتك.",
      },
      levant: {
        en: "From Zain to Maktoob: how Levantine founders built regional giants with scarce capital.",
        ar: "من زين إلى مكتوب: كيف بنى روّاد بلاد الشام شركات إقليمية برأس مال شحيح.",
      },
    },
    levels: ENTREPRENEURSHIP_LEVELS,
  },
  {
    slug: "leadership",
    track: "life",
    name: { en: "Leadership", ar: "القيادة" },
    tagline: {
      en: "From being a good friend to writing your leadership philosophy.",
      ar: "من أن تكون صديقاً طيباً إلى كتابة فلسفتك القيادية.",
    },
    regionExample: {
      gcc: {
        en: "Study how Gulf leaders ran generational projects — then lead a real school initiative.",
        ar: "ادرس كيف أدار قادة الخليج مشاريع الأجيال — ثم قُد مبادرة حقيقية في مدرستك.",
      },
      levant: {
        en: "Leading when resources are thin: lessons from Levantine community organisers and mayors.",
        ar: "القيادة حين تشحّ الموارد: دروس من منظّمي المجتمع ورؤساء البلديات في بلاد الشام.",
      },
    },
    levels: LEADERSHIP_LEVELS,
  },
  {
    slug: "problem-solving",
    track: "life",
    name: { en: "Problem Solving", ar: "حل المشكلات" },
    tagline: {
      en: "From puzzles and mazes to real regional challenges.",
      ar: "من الألغاز والمتاهات إلى تحديات إقليمية حقيقية.",
    },
    regionExample: {
      gcc: {
        en: "How do you cool a city in 50°C heat? Work the problem the way Gulf engineers do.",
        ar: "كيف تبرّد مدينة في حرارة ٥٠ درجة؟ عالج المشكلة كما يفعل مهندسو الخليج.",
      },
      levant: {
        en: "Water scarcity in Jordan is a masterclass in constraints. Solve a version of it yourself.",
        ar: "شحّ المياه في الأردن درس متقدّم في القيود. حُلّ نسخة منه بنفسك.",
      },
    },
    levels: PROBLEM_SOLVING_LEVELS,
  },
  {
    slug: "emotional-intelligence",
    track: "life",
    name: { en: "Emotional Intelligence", ar: "الذكاء العاطفي" },
    tagline: {
      en: "From naming feelings to a personal charter for a balanced life.",
      ar: "من تسمية المشاعر إلى ميثاق شخصي لحياة متوازنة.",
    },
    regionExample: {
      gcc: {
        en: "Majlis culture is emotional intelligence in practice — reading a room across generations.",
        ar: "ثقافة المجلس ذكاء عاطفي عملي — قراءة المكان عبر الأجيال.",
      },
      levant: {
        en: "Hospitality, grief, celebration: the Levant's social codes as a masterclass in empathy.",
        ar: "الضيافة والعزاء والأفراح: الأعراف الاجتماعية الشامية درس متقدّم في التعاطف.",
      },
    },
    levels: EQ_LEVELS,
  },
  {
    slug: "languages",
    track: "life",
    name: { en: "Learning Languages", ar: "تعلّم اللغات" },
    tagline: {
      en: "From first sounds to real-world fluency — and a method for language three.",
      ar: "من الأصوات الأولى إلى الطلاقة الحقيقية — ومنهجية للغة الثالثة.",
    },
    regionExample: {
      gcc: {
        en: "The Gulf runs on many tongues — Arabic, English, Hindi, Tagalog. Use that daily exposure.",
        ar: "يعيش الخليج بألسنة عديدة — العربية والإنجليزية والهندية والتاغالوغية. استثمر هذا المحيط اليومي.",
      },
      levant: {
        en: "Levantine Arabic, French, English, Armenian: the Levant has always been multilingual. So are you.",
        ar: "العربية الشامية والفرنسية والإنجليزية والأرمنية: بلاد الشام متعددة اللغات منذ الأزل، وأنت كذلك.",
      },
    },
    levels: LANGUAGES_LEVELS,
  },
];

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function getSubject(slug: string): Subject | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}

// Level n corresponds to school year n; typical ages are 5+n to 6+n.
export function ageRange(n: number): string {
  return `${5 + n}–${6 + n}`;
}

// Free plan unlocks levels 1–2 of every subject; paid plans unlock all ten.
export const FREE_LEVELS = 2;

// Mastery gate: score needed on a level quiz before the level counts as complete.
export const QUIZ_LENGTH = 5;
export const PASS_SCORE = 4;
