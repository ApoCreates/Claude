import type { Level } from "../curriculum";

// Mathematics — one level per school year, Year 1 through Year 10.
export const MATH_LEVELS: Level[] = [
  {
    n: 1,
    title: { en: "Numbers & Patterns", ar: "الأعداد والأنماط" },
    focus: {
      en: "The first year of mathematical thinking: counting to 100, adding and subtracting within 20, naming shapes, and spotting patterns everywhere.",
      ar: "السنة الأولى من التفكير الرياضي: العد حتى ١٠٠، والجمع والطرح ضمن ٢٠، وتسمية الأشكال، واكتشاف الأنماط في كل مكان.",
    },
    units: [
      { en: "Counting & Place Value", ar: "العد والقيمة المكانية" },
      { en: "Adding & Subtracting to 20", ar: "الجمع والطرح ضمن ٢٠" },
      { en: "Shapes Around Us", ar: "الأشكال من حولنا" },
      { en: "Patterns & Sorting", ar: "الأنماط والتصنيف" },
    ],
  },
  {
    n: 2,
    title: { en: "Bigger Numbers & Measuring", ar: "أعداد أكبر والقياس" },
    focus: {
      en: "Working confidently to 1,000: column addition and subtraction, telling time, counting money, and measuring length and weight.",
      ar: "التعامل بثقة مع الأعداد حتى ١٠٠٠: الجمع والطرح العمودي، وقراءة الساعة، وعدّ النقود، وقياس الطول والوزن.",
    },
    units: [
      { en: "Numbers to 1,000", ar: "الأعداد حتى ١٠٠٠" },
      { en: "Column Addition & Subtraction", ar: "الجمع والطرح العمودي" },
      { en: "Time & Money", ar: "الوقت والنقود" },
      { en: "Measuring Length & Weight", ar: "قياس الطول والوزن" },
    ],
  },
  {
    n: 3,
    title: { en: "Multiplication & Division", ar: "الضرب والقسمة" },
    focus: {
      en: "Times tables become second nature: arrays, sharing and grouping, division with remainders, and a first look at fractions as parts of a whole.",
      ar: "تصبح جداول الضرب طبيعة ثانية: المصفوفات، والتوزيع والتجميع، والقسمة مع الباقي، ونظرة أولى إلى الكسور كأجزاء من كلّ.",
    },
    units: [
      { en: "Times Tables to 12", ar: "جداول الضرب حتى ١٢" },
      { en: "Division & Remainders", ar: "القسمة والباقي" },
      { en: "First Fractions", ar: "الكسور الأولى" },
      { en: "Word Problems", ar: "المسائل الكلامية" },
    ],
  },
  {
    n: 4,
    title: { en: "Fractions & Decimals", ar: "الكسور والأعداد العشرية" },
    focus: {
      en: "Equivalent fractions, decimals to hundredths, area and perimeter, and measuring angles — numbers between the whole numbers.",
      ar: "الكسور المتكافئة، والأعداد العشرية حتى الأجزاء من مئة، والمساحة والمحيط، وقياس الزوايا — الأعداد بين الأعداد الصحيحة.",
    },
    units: [
      { en: "Equivalent Fractions", ar: "الكسور المتكافئة" },
      { en: "Decimals & Rounding", ar: "الأعداد العشرية والتقريب" },
      { en: "Area & Perimeter", ar: "المساحة والمحيط" },
      { en: "Angles & Lines", ar: "الزوايا والمستقيمات" },
    ],
  },
  {
    n: 5,
    title: { en: "Ratios, Percentages & Geometry", ar: "النسب والنسب المئوية والهندسة" },
    focus: {
      en: "Comparing quantities with ratios and percentages, plotting coordinates, calculating volume, and reading data from real charts.",
      ar: "مقارنة الكميات بالنسب والنسب المئوية، وتحديد الإحداثيات، وحساب الحجم، وقراءة البيانات من رسوم بيانية حقيقية.",
    },
    units: [
      { en: "Ratio & Proportion", ar: "النسبة والتناسب" },
      { en: "Percentages", ar: "النسب المئوية" },
      { en: "Coordinates & Volume", ar: "الإحداثيات والحجم" },
      { en: "Data & Charts", ar: "البيانات والرسوم البيانية" },
    ],
  },
  {
    n: 6,
    title: { en: "Algebra Foundations", ar: "أسس الجبر" },
    focus: {
      en: "Letters stand for numbers: negative numbers, order of operations, simple equations, and sequences — the gateway year to abstract mathematics.",
      ar: "الحروف تمثّل الأعداد: الأعداد السالبة، وترتيب العمليات، والمعادلات البسيطة، والمتتاليات — سنة العبور إلى الرياضيات المجردة.",
    },
    units: [
      { en: "Negative Numbers", ar: "الأعداد السالبة" },
      { en: "Order of Operations", ar: "ترتيب العمليات" },
      { en: "Simple Equations", ar: "المعادلات البسيطة" },
      { en: "Sequences & Rules", ar: "المتتاليات والقواعد" },
    ],
  },
  {
    n: 7,
    title: { en: "Equations & Graphs", ar: "المعادلات والرسوم البيانية" },
    focus: {
      en: "Solving multi-step equations, plotting straight lines, working with inequalities, and a first serious look at probability.",
      ar: "حل المعادلات متعددة الخطوات، ورسم المستقيمات، والتعامل مع المتباينات، ونظرة جادّة أولى إلى الاحتمالات.",
    },
    units: [
      { en: "Multi-step Equations", ar: "المعادلات متعددة الخطوات" },
      { en: "Straight-Line Graphs", ar: "التمثيل البياني للمستقيم" },
      { en: "Inequalities", ar: "المتباينات" },
      { en: "Probability Basics", ar: "أساسيات الاحتمالات" },
    ],
  },
  {
    n: 8,
    title: { en: "Functions & Pythagoras", ar: "الدوال وفيثاغورس" },
    focus: {
      en: "Functions as machines, the theorem of Pythagoras, similar triangles, and simultaneous equations — tools engineers use daily.",
      ar: "الدوال كآلات، ونظرية فيثاغورس، وتشابه المثلثات، والمعادلات الآنية — أدوات يستخدمها المهندسون يومياً.",
    },
    units: [
      { en: "Functions & Mappings", ar: "الدوال والتطبيقات" },
      { en: "Pythagoras' Theorem", ar: "نظرية فيثاغورس" },
      { en: "Similar Triangles", ar: "تشابه المثلثات" },
      { en: "Simultaneous Equations", ar: "المعادلات الآنية" },
    ],
  },
  {
    n: 9,
    title: { en: "Quadratics & Trigonometry", ar: "الدوال التربيعية وحساب المثلثات" },
    focus: {
      en: "Factorising and solving quadratics, the sine, cosine and tangent ratios, and surds — the core of upper-secondary mathematics.",
      ar: "تحليل المعادلات التربيعية وحلها، ونسب الجيب وجيب التمام والظل، والجذور الصماء — جوهر رياضيات المرحلة الثانوية.",
    },
    units: [
      { en: "Factorising Quadratics", ar: "تحليل الدوال التربيعية" },
      { en: "Solving Quadratics", ar: "حل المعادلات التربيعية" },
      { en: "Sin, Cos & Tan", ar: "الجيب وجيب التمام والظل" },
      { en: "Surds & Indices", ar: "الجذور الصماء والأسس" },
    ],
  },
  {
    n: 10,
    title: { en: "Pre-Calculus & Modelling", ar: "ما قبل التفاضل والنمذجة" },
    focus: {
      en: "Exponential growth, sequences and series, rates of change, and building mathematical models of real situations — ready for calculus.",
      ar: "النمو الأسّي، والمتتاليات والمتسلسلات، ومعدلات التغيّر، وبناء نماذج رياضية لمواقف حقيقية — استعداداً لحساب التفاضل.",
    },
    units: [
      { en: "Exponentials & Growth", ar: "الدوال الأسية والنمو" },
      { en: "Sequences & Series", ar: "المتتاليات والمتسلسلات" },
      { en: "Rates of Change", ar: "معدلات التغيّر" },
      { en: "Mathematical Modelling", ar: "النمذجة الرياضية" },
    ],
  },
];
