// The wadehAI curriculum — 10 subjects × 10 levels, in two languages,
// with worked examples flavoured for each region (GCC / Levant).

export type Track = "education" | "life";
export type Region = "gcc" | "levant";
export type Lang = "en" | "ar";

export interface Level {
  n: number;
  title: { en: string; ar: string };
}

export interface Subject {
  slug: string;
  track: Track;
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  regionExample: Record<Region, { en: string; ar: string }>;
  levels: Level[];
}

const L = (n: number, en: string, ar: string): Level => ({ n, title: { en, ar } });

export const SUBJECTS: Subject[] = [
  {
    slug: "math",
    track: "education",
    name: { en: "Mathematics", ar: "الرياضيات" },
    tagline: {
      en: "From counting patterns to modelling the real world.",
      ar: "من عدّ الأنماط إلى نمذجة العالم الحقيقي.",
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
    levels: [
      L(1, "Numbers & Patterns", "الأعداد والأنماط"),
      L(2, "Fractions & Ratios", "الكسور والنسب"),
      L(3, "Algebra Foundations", "أسس الجبر"),
      L(4, "Geometry & Space", "الهندسة والفراغ"),
      L(5, "Functions & Graphs", "الدوال والرسوم البيانية"),
      L(6, "Trigonometry", "حساب المثلثات"),
      L(7, "Probability & Statistics", "الاحتمالات والإحصاء"),
      L(8, "Calculus I — Change", "التفاضل — دراسة التغيّر"),
      L(9, "Calculus II — Accumulation", "التكامل — دراسة التراكم"),
      L(10, "Mathematical Modelling", "النمذجة الرياضية"),
    ],
  },
  {
    slug: "physics",
    track: "education",
    name: { en: "Physics", ar: "الفيزياء" },
    tagline: {
      en: "The rules the universe actually runs on.",
      ar: "القوانين التي يعمل بها الكون فعلاً.",
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
    levels: [
      L(1, "Measurement & Units", "القياس والوحدات"),
      L(2, "Motion", "الحركة"),
      L(3, "Forces & Newton's Laws", "القوى وقوانين نيوتن"),
      L(4, "Energy & Work", "الطاقة والشغل"),
      L(5, "Waves & Sound", "الموجات والصوت"),
      L(6, "Light & Optics", "الضوء والبصريات"),
      L(7, "Electricity", "الكهرباء"),
      L(8, "Magnetism", "المغناطيسية"),
      L(9, "Thermodynamics", "الديناميكا الحرارية"),
      L(10, "Modern Physics", "الفيزياء الحديثة"),
    ],
  },
  {
    slug: "geography",
    track: "education",
    name: { en: "Geography", ar: "الجغرافيا" },
    tagline: {
      en: "Read the land, the water, the people — and the map between them.",
      ar: "اقرأ الأرض والماء والبشر — والخريطة التي تجمعهم.",
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
    levels: [
      L(1, "Maps & Globes", "الخرائط والمجسّمات"),
      L(2, "Landforms", "التضاريس"),
      L(3, "Climate & Weather", "المناخ والطقس"),
      L(4, "Water & Rivers", "المياه والأنهار"),
      L(5, "Population & Cities", "السكان والمدن"),
      L(6, "Resources & Economy", "الموارد والاقتصاد"),
      L(7, "Our Region Up Close", "منطقتنا عن قرب"),
      L(8, "Environment & Sustainability", "البيئة والاستدامة"),
      L(9, "Geopolitics", "الجغرافيا السياسية"),
      L(10, "GIS & Modern Mapping", "نظم المعلومات الجغرافية"),
    ],
  },
  {
    slug: "ai",
    track: "education",
    name: { en: "Artificial Intelligence", ar: "الذكاء الاصطناعي" },
    tagline: {
      en: "Understand the tools that will define your generation.",
      ar: "افهم الأدوات التي ستحدّد ملامح جيلك.",
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
    levels: [
      L(1, "What Is AI?", "ما هو الذكاء الاصطناعي؟"),
      L(2, "Data & Patterns", "البيانات والأنماط"),
      L(3, "How Machines Learn", "كيف تتعلّم الآلات"),
      L(4, "Neural Networks", "الشبكات العصبية"),
      L(5, "Language Models", "نماذج اللغة"),
      L(6, "Computer Vision", "الرؤية الحاسوبية"),
      L(7, "Prompting & Tools", "الموجّهات والأدوات"),
      L(8, "Building AI Projects", "بناء مشاريع الذكاء الاصطناعي"),
      L(9, "AI Ethics & Safety", "أخلاقيات الذكاء الاصطناعي وسلامته"),
      L(10, "The Future of AI", "مستقبل الذكاء الاصطناعي"),
    ],
  },
  {
    slug: "gaming",
    track: "education",
    name: { en: "Game Design", ar: "تصميم الألعاب" },
    tagline: {
      en: "Games are systems. Learn to build worlds people want to stay in.",
      ar: "الألعاب أنظمة. تعلّم بناء عوالم يرغب الناس بالبقاء فيها.",
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
    levels: [
      L(1, "Why Games Work", "لماذا تنجح الألعاب"),
      L(2, "Genres & History", "أنواع الألعاب وتاريخها"),
      L(3, "Rules & Mechanics", "القواعد والميكانيكيات"),
      L(4, "Level Design", "تصميم المراحل"),
      L(5, "Storytelling in Games", "السرد في الألعاب"),
      L(6, "Art & Sound", "الفن والصوت"),
      L(7, "Game Engines", "محركات الألعاب"),
      L(8, "Scripting Basics", "أساسيات البرمجة"),
      L(9, "Playtesting & Balance", "الاختبار والتوازن"),
      L(10, "Ship Your First Game", "أطلق لعبتك الأولى"),
    ],
  },
  {
    slug: "entrepreneurship",
    track: "life",
    name: { en: "Entrepreneurship", ar: "ريادة الأعمال" },
    tagline: {
      en: "Find a problem worth solving, then build the thing that solves it.",
      ar: "اعثر على مشكلة تستحق الحل، ثم ابنِ ما يحلّها.",
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
    levels: [
      L(1, "The Entrepreneurial Mindset", "العقلية الريادية"),
      L(2, "Problems Worth Solving", "مشكلات تستحق الحل"),
      L(3, "From Idea to Value", "من الفكرة إلى القيمة"),
      L(4, "Customers & Markets", "العملاء والأسواق"),
      L(5, "Business Models", "نماذج الأعمال"),
      L(6, "Money Basics", "أساسيات المال"),
      L(7, "Building an MVP", "بناء المنتج الأوّلي"),
      L(8, "Pitching & Storytelling", "العرض والإقناع"),
      L(9, "Growth & Marketing", "النمو والتسويق"),
      L(10, "Launch Your Venture", "أطلق مشروعك"),
    ],
  },
  {
    slug: "leadership",
    track: "life",
    name: { en: "Leadership", ar: "القيادة" },
    tagline: {
      en: "Leadership is a craft, not a title. Start practising it now.",
      ar: "القيادة حِرفة لا لقب. ابدأ بممارستها الآن.",
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
    levels: [
      L(1, "Knowing Yourself", "معرفة الذات"),
      L(2, "Communication", "التواصل"),
      L(3, "Listening & Empathy", "الإصغاء والتعاطف"),
      L(4, "Teams & Roles", "الفرق والأدوار"),
      L(5, "Decision Making", "اتخاذ القرار"),
      L(6, "Motivating Others", "تحفيز الآخرين"),
      L(7, "Conflict & Resolution", "الخلاف وحلّه"),
      L(8, "Leading Change", "قيادة التغيير"),
      L(9, "Ethics & Responsibility", "الأخلاق والمسؤولية"),
      L(10, "Your Leadership Style", "أسلوبك القيادي"),
    ],
  },
  {
    slug: "problem-solving",
    track: "life",
    name: { en: "Problem Solving", ar: "حل المشكلات" },
    tagline: {
      en: "See clearly, break it down, test your way out.",
      ar: "انظر بوضوح، فكّك المشكلة، وجرّب طريقك نحو الحل.",
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
    levels: [
      L(1, "Seeing the Problem Clearly", "رؤية المشكلة بوضوح"),
      L(2, "Asking Better Questions", "طرح أسئلة أفضل"),
      L(3, "Breaking Problems Down", "تفكيك المشكلات"),
      L(4, "Creative Thinking", "التفكير الإبداعي"),
      L(5, "Logic & Reasoning", "المنطق والاستدلال"),
      L(6, "Systems Thinking", "التفكير المنظومي"),
      L(7, "Deciding Under Uncertainty", "القرار في ظل الغموض"),
      L(8, "Experiments & Iteration", "التجريب والتكرار"),
      L(9, "Solving Together", "الحل الجماعي"),
      L(10, "The Solver's Toolkit", "عدّة حلّال المشكلات"),
    ],
  },
  {
    slug: "emotional-intelligence",
    track: "life",
    name: { en: "Emotional Intelligence", ar: "الذكاء العاطفي" },
    tagline: {
      en: "The quiet skill behind every strong student, friend and leader.",
      ar: "المهارة الهادئة خلف كل طالب وصديق وقائد قوي.",
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
    levels: [
      L(1, "Naming Emotions", "تسمية المشاعر"),
      L(2, "Self-Awareness", "الوعي الذاتي"),
      L(3, "Managing Strong Feelings", "إدارة المشاعر القوية"),
      L(4, "Empathy", "التعاطف"),
      L(5, "Reading the Room", "قراءة المواقف"),
      L(6, "Healthy Relationships", "العلاقات الصحية"),
      L(7, "Stress & Resilience", "التوتر والمرونة"),
      L(8, "Motivation from Within", "الدافع الداخلي"),
      L(9, "Emotional Courage", "الشجاعة العاطفية"),
      L(10, "Living with Balance", "العيش بتوازن"),
    ],
  },
  {
    slug: "languages",
    track: "life",
    name: { en: "Learning Languages", ar: "تعلّم اللغات" },
    tagline: {
      en: "A method for learning any language — starting with your next one.",
      ar: "منهجية لتعلّم أي لغة — بدءاً بلغتك القادمة.",
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
    levels: [
      L(1, "How Languages Work", "كيف تعمل اللغات"),
      L(2, "Sounds & Listening", "الأصوات والاستماع"),
      L(3, "Your First 500 Words", "أول ٥٠٠ كلمة"),
      L(4, "Grammar Without Fear", "قواعد بلا خوف"),
      L(5, "Speaking with Confidence", "التحدث بثقة"),
      L(6, "Reading for Meaning", "القراءة للفهم"),
      L(7, "Writing Clearly", "الكتابة بوضوح"),
      L(8, "Culture & Expression", "الثقافة والتعبير"),
      L(9, "Thinking in a New Language", "التفكير باللغة الجديدة"),
      L(10, "Fluency in the Real World", "الطلاقة في الحياة الواقعية"),
    ],
  },
];

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export function getSubject(slug: string): Subject | undefined {
  return SUBJECTS.find((s) => s.slug === slug);
}

// Free plan unlocks levels 1–2 of every subject; paid plans unlock all ten.
export const FREE_LEVELS = 2;
