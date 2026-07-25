import type { Level } from "../curriculum";

export const LANGUAGES_LEVELS: Level[] = [
  {
    n: 1,
    title: { en: "Sounds & First Words", ar: "الأصوات والكلمات الأولى" },
    focus: {
      en: "Every language is first a music: playing with sounds, greetings in five languages, and the joy of being understood for the first time.",
      ar: "كل لغة موسيقى قبل أي شيء: اللعب بالأصوات، والتحيات بخمس لغات، وفرحة أن يفهمك أحد للمرة الأولى.",
    },
    units: [
      { en: "Playing with Sounds", ar: "اللعب بالأصوات" },
      { en: "Hello in Five Languages", ar: "مرحباً بخمس لغات" },
      { en: "My First Words", ar: "كلماتي الأولى" },
      { en: "Songs & Rhymes", ar: "الأغاني والأناشيد" },
    ],
  },
  {
    n: 2,
    title: { en: "Everyday Phrases", ar: "عبارات الحياة اليومية" },
    focus: {
      en: "Language you can use today: family, food, school and play — short phrases practised in games until they come out by themselves.",
      ar: "لغة تستخدمها اليوم: العائلة والطعام والمدرسة واللعب — عبارات قصيرة نتدرب عليها باللعب حتى تخرج من تلقاء نفسها.",
    },
    units: [
      { en: "Family & Home", ar: "العائلة والبيت" },
      { en: "Food & Ordering", ar: "الطعام والطلب" },
      { en: "School & Play", ar: "المدرسة واللعب" },
      { en: "Phrase Games", ar: "ألعاب العبارات" },
    ],
  },
  {
    n: 3,
    title: { en: "Your First 500 Words", ar: "أول ٥٠٠ كلمة" },
    focus: {
      en: "The vocabulary engine starts: high-frequency words, spaced repetition as a habit, word families, and tricks memory champions use.",
      ar: "محرك المفردات ينطلق: الكلمات عالية التكرار، والمراجعة المتباعدة كعادة، وعائلات الكلمات، وحيل أبطال الذاكرة.",
    },
    units: [
      { en: "High-Frequency Words", ar: "الكلمات الأكثر تكراراً" },
      { en: "Spaced Repetition", ar: "المراجعة المتباعدة" },
      { en: "Word Families", ar: "عائلات الكلمات" },
      { en: "Memory Tricks", ar: "حيل الذاكرة" },
    ],
  },
  {
    n: 4,
    title: { en: "Grammar Without Fear", ar: "قواعد بلا خوف" },
    focus: {
      en: "Grammar as patterns, not punishments: discovering rules from examples, the most useful tenses first, and making beautiful mistakes on purpose.",
      ar: "القواعد أنماط لا عقوبات: اكتشاف القاعدة من الأمثلة، والأزمنة الأكثر فائدة أولاً، وارتكاب أخطاء جميلة عن قصد.",
    },
    units: [
      { en: "Rules from Examples", ar: "القاعدة من الأمثلة" },
      { en: "The Useful Tenses", ar: "الأزمنة المفيدة" },
      { en: "Sentence Building", ar: "بناء الجمل" },
      { en: "Beautiful Mistakes", ar: "أخطاء جميلة" },
    ],
  },
  {
    n: 5,
    title: { en: "Speaking with Confidence", ar: "التحدث بثقة" },
    focus: {
      en: "The year of the tongue: shadowing native speakers, role-plays, surviving real conversations, and making friends with your accent.",
      ar: "سنة اللسان: محاكاة الناطقين الأصليين، ولعب الأدوار، والنجاة في محادثات حقيقية، ومصالحة لهجتك الخاصة.",
    },
    units: [
      { en: "Shadowing Practice", ar: "تمارين المحاكاة" },
      { en: "Role-Plays", ar: "لعب الأدوار" },
      { en: "Real Conversations", ar: "محادثات حقيقية" },
      { en: "Your Accent Is Yours", ar: "لهجتك ملكك" },
    ],
  },
  {
    n: 6,
    title: { en: "Reading for Meaning", ar: "القراءة للفهم" },
    focus: {
      en: "From decoding to devouring: guessing words from context, graded readers, skimming and scanning, and your first whole book in the new language.",
      ar: "من فك الرموز إلى الالتهام: تخمين الكلمات من السياق، والقراءات المتدرجة، والقراءة السريعة والمسحية، وأول كتاب كامل باللغة الجديدة.",
    },
    units: [
      { en: "Guessing from Context", ar: "التخمين من السياق" },
      { en: "Graded Readers", ar: "القراءات المتدرجة" },
      { en: "Skim & Scan", ar: "القراءة السريعة والمسحية" },
      { en: "Your First Whole Book", ar: "أول كتاب كامل" },
    ],
  },
  {
    n: 7,
    title: { en: "Writing Clearly", ar: "الكتابة بوضوح" },
    focus: {
      en: "Writing as thinking made visible: messages, short essays, editing your own work, and the discipline of saying more with fewer words.",
      ar: "الكتابة تفكيرٌ مرئي: الرسائل والمقالات القصيرة، وتحرير نصوصك بنفسك، وانضباط قول الكثير بكلمات أقل.",
    },
    units: [
      { en: "Messages & Emails", ar: "الرسائل والبريد" },
      { en: "Short Essays", ar: "المقالات القصيرة" },
      { en: "Edit Your Own Work", ar: "حرّر نصك بنفسك" },
      { en: "Fewer, Better Words", ar: "كلمات أقل وأفضل" },
    ],
  },
  {
    n: 8,
    title: { en: "Culture & Expression", ar: "الثقافة والتعبير" },
    focus: {
      en: "A language is a people: idioms and humour, poetry and song, film and food — and what our region's languages carry that others can't translate.",
      ar: "اللغة شعبٌ كامل: الأمثال والفكاهة، والشعر والغناء، والسينما والمطبخ — وما تحمله لغات منطقتنا مما لا يُترجم.",
    },
    units: [
      { en: "Idioms & Humour", ar: "الأمثال والفكاهة" },
      { en: "Poetry & Song", ar: "الشعر والغناء" },
      { en: "Film & Food", ar: "السينما والمطبخ" },
      { en: "The Untranslatable", ar: "ما لا يُترجم" },
    ],
  },
  {
    n: 9,
    title: { en: "Thinking in a New Language", ar: "التفكير باللغة الجديدة" },
    focus: {
      en: "The switch flips: inner monologue practice, dreaming and joking in the language, debating real topics, and code-switching like the region does daily.",
      ar: "اللحظة الفارقة: تمرين الحوار الداخلي، والحلم والمزاح باللغة، ومناقشة قضايا حقيقية، والتنقل بين اللغات كما تفعل منطقتنا يومياً.",
    },
    units: [
      { en: "Inner Monologue", ar: "الحوار الداخلي" },
      { en: "Jokes & Dreams", ar: "المزاح والأحلام" },
      { en: "Debating Real Topics", ar: "مناقشة قضايا حقيقية" },
      { en: "Code-Switching", ar: "التنقل بين اللغات" },
    ],
  },
  {
    n: 10,
    title: { en: "Fluency in the Real World", ar: "الطلاقة في العالم الحقيقي" },
    focus: {
      en: "The capstone: an interview, a presentation and a written portfolio in your new language — plus the method to teach yourself language number three.",
      ar: "الختام: مقابلة وعرض تقديمي وملف كتابي بلغتك الجديدة — ومعها منهجية تعلّم اللغة الثالثة بنفسك.",
    },
    units: [
      { en: "The Interview", ar: "المقابلة" },
      { en: "The Presentation", ar: "العرض التقديمي" },
      { en: "Your Written Portfolio", ar: "ملفك الكتابي" },
      { en: "Language Number Three", ar: "اللغة الثالثة" },
    ],
  },
];
