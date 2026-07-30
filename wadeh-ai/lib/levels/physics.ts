import type { Level } from "../curriculum";

// Physics — one level per school year, from early science to pre-university mechanics.
export const PHYSICS_LEVELS: Level[] = [
  {
    n: 1,
    title: { en: "The World Around Us", ar: "العالم من حولنا" },
    focus: {
      en: "Science begins with noticing: materials and their properties, floating and sinking, pushes and pulls, hot and cold.",
      ar: "يبدأ العلم بالملاحظة: المواد وخصائصها، والطفو والغرق، والدفع والسحب، والساخن والبارد.",
    },
    units: [
      { en: "Materials & Properties", ar: "المواد وخصائصها" },
      { en: "Float or Sink?", ar: "يطفو أم يغرق؟" },
      { en: "Pushes & Pulls", ar: "الدفع والسحب" },
      { en: "Hot & Cold", ar: "الساخن والبارد" },
    ],
  },
  {
    n: 2,
    title: { en: "Forces & Movement", ar: "القوى والحركة" },
    focus: {
      en: "Why things speed up, slow down and change direction: friction, magnets, and the simple machines hiding in everyday tools.",
      ar: "لماذا تتسارع الأشياء وتتباطأ وتغيّر اتجاهها: الاحتكاك، والمغناطيس، والآلات البسيطة المختبئة في أدواتنا اليومية.",
    },
    units: [
      { en: "Making Things Move", ar: "تحريك الأشياء" },
      { en: "Friction & Surfaces", ar: "الاحتكاك والأسطح" },
      { en: "Magnets", ar: "المغناطيس" },
      { en: "Simple Machines", ar: "الآلات البسيطة" },
    ],
  },
  {
    n: 3,
    title: { en: "Light & Sound", ar: "الضوء والصوت" },
    focus: {
      en: "Shadows, mirrors and echoes: how light travels in straight lines and how vibrations become the sounds we hear.",
      ar: "الظلال والمرايا والصدى: كيف ينتقل الضوء في خطوط مستقيمة، وكيف تتحول الاهتزازات إلى الأصوات التي نسمعها.",
    },
    units: [
      { en: "Light & Shadows", ar: "الضوء والظلال" },
      { en: "Mirrors & Reflection", ar: "المرايا والانعكاس" },
      { en: "Vibrations & Sound", ar: "الاهتزازات والصوت" },
      { en: "Loud & Quiet, High & Low", ar: "العالي والمنخفض، الحاد والغليظ" },
    ],
  },
  {
    n: 4,
    title: { en: "Matter & Heat", ar: "المادة والحرارة" },
    focus: {
      en: "Solids, liquids and gases; melting, boiling and evaporation; and how thermometers measure the energy of tiny particles.",
      ar: "المواد الصلبة والسائلة والغازية؛ والانصهار والغليان والتبخر؛ وكيف تقيس موازين الحرارة طاقة الجسيمات الدقيقة.",
    },
    units: [
      { en: "States of Matter", ar: "حالات المادة" },
      { en: "Melting & Boiling", ar: "الانصهار والغليان" },
      { en: "Evaporation & the Water Cycle", ar: "التبخر ودورة الماء" },
      { en: "Measuring Temperature", ar: "قياس درجة الحرارة" },
    ],
  },
  {
    n: 5,
    title: { en: "Energy Everywhere", ar: "الطاقة في كل مكان" },
    focus: {
      en: "Energy in its many costumes — movement, heat, light, sound, stored — and the first electric circuits you build yourself.",
      ar: "الطاقة بأشكالها المتعددة — حركة وحرارة وضوء وصوت ومخزّنة — وأولى الدارات الكهربائية التي تبنيها بنفسك.",
    },
    units: [
      { en: "Forms of Energy", ar: "أشكال الطاقة" },
      { en: "Energy Changes", ar: "تحوّلات الطاقة" },
      { en: "First Circuits", ar: "الدارات الأولى" },
      { en: "Saving Energy", ar: "توفير الطاقة" },
    ],
  },
  {
    n: 6,
    title: { en: "Motion & Measurement", ar: "الحركة والقياس" },
    focus: {
      en: "Speed as distance over time, distance–time graphs, and measuring like a physicist: units, accuracy and fair tests.",
      ar: "السرعة كمسافة على زمن، ومنحنيات المسافة والزمن، والقياس كفيزيائي: الوحدات والدقة والاختبار العادل.",
    },
    units: [
      { en: "Speed = Distance ÷ Time", ar: "السرعة = المسافة ÷ الزمن" },
      { en: "Distance–Time Graphs", ar: "منحنيات المسافة والزمن" },
      { en: "Units & Accuracy", ar: "الوحدات والدقة" },
      { en: "Planning Fair Tests", ar: "تصميم الاختبارات العادلة" },
    ],
  },
  {
    n: 7,
    title: { en: "Forces, Pressure & Density", ar: "القوى والضغط والكثافة" },
    focus: {
      en: "Newton's laws in first form, pressure in liquids and gases, and density — including why the Dead Sea holds you up.",
      ar: "قوانين نيوتن في صورتها الأولى، والضغط في السوائل والغازات، والكثافة — بما في ذلك لماذا يحملك البحر الميت.",
    },
    units: [
      { en: "Balanced & Unbalanced Forces", ar: "القوى المتزنة وغير المتزنة" },
      { en: "Pressure", ar: "الضغط" },
      { en: "Density & Floating", ar: "الكثافة والطفو" },
      { en: "Gravity & Weight", ar: "الجاذبية والوزن" },
    ],
  },
  {
    n: 8,
    title: { en: "Electricity & Magnetism", ar: "الكهرباء والمغناطيسية" },
    focus: {
      en: "Current, voltage and resistance; series and parallel circuits; electromagnets and the motors they make possible.",
      ar: "التيار والجهد والمقاومة؛ ودارات التوالي والتوازي؛ والمغناطيس الكهربائي والمحركات التي يتيحها.",
    },
    units: [
      { en: "Current & Voltage", ar: "التيار والجهد" },
      { en: "Resistance & Ohm's Law", ar: "المقاومة وقانون أوم" },
      { en: "Series & Parallel", ar: "التوالي والتوازي" },
      { en: "Electromagnets & Motors", ar: "المغناطيس الكهربائي والمحركات" },
    ],
  },
  {
    n: 9,
    title: { en: "Waves & Optics", ar: "الموجات والبصريات" },
    focus: {
      en: "Wavelength, frequency and amplitude; reflection, refraction and lenses; and the electromagnetic spectrum from radio to gamma.",
      ar: "الطول الموجي والتردد والسعة؛ والانعكاس والانكسار والعدسات؛ والطيف الكهرومغناطيسي من الراديو إلى غاما.",
    },
    units: [
      { en: "Describing Waves", ar: "وصف الموجات" },
      { en: "Reflection & Refraction", ar: "الانعكاس والانكسار" },
      { en: "Lenses & Images", ar: "العدسات والصور" },
      { en: "The EM Spectrum", ar: "الطيف الكهرومغناطيسي" },
    ],
  },
  {
    n: 10,
    title: { en: "Mechanics & Modern Physics", ar: "الميكانيكا والفيزياء الحديثة" },
    focus: {
      en: "Equations of motion, momentum and energy conservation, then the doors to the modern world: atoms, radioactivity and a glimpse of relativity.",
      ar: "معادلات الحركة، والزخم وحفظ الطاقة، ثم أبواب العالم الحديث: الذرات والنشاط الإشعاعي ولمحة عن النسبية.",
    },
    units: [
      { en: "Equations of Motion", ar: "معادلات الحركة" },
      { en: "Momentum & Collisions", ar: "الزخم والتصادمات" },
      { en: "Atoms & Radioactivity", ar: "الذرات والنشاط الإشعاعي" },
      { en: "A Glimpse of Relativity", ar: "لمحة عن النسبية" },
    ],
  },
];
