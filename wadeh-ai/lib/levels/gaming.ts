import type { Level } from "../curriculum";

export const GAMING_LEVELS: Level[] = [
  {
    n: 1,
    title: { en: "Play & Rules", ar: "اللعب والقواعد" },
    focus: {
      en: "Why do we play? Exploring games old and new — from carrom and hide-and-seek to tablets — and discovering that every game is rules plus imagination.",
      ar: "لماذا نلعب؟ نستكشف الألعاب قديمها وجديدها — من الكيرم والغميضة إلى الأجهزة اللوحية — ونكتشف أن كل لعبة قواعد وخيال.",
    },
    units: [
      { en: "Games We Play", ar: "ألعاب نلعبها" },
      { en: "What Makes It Fair?", ar: "ما الذي يجعلها عادلة؟" },
      { en: "Winning & Losing Well", ar: "الفوز والخسارة بروح طيبة" },
      { en: "Invent a Playground Game", ar: "اخترع لعبة ساحة" },
    ],
  },
  {
    n: 2,
    title: { en: "Board & Story Games", ar: "ألعاب الطاولة والحكايات" },
    focus: {
      en: "Design your first complete game on paper: a board, pieces, a goal, and a rulebook a friend can follow without your help.",
      ar: "صمّم أول لعبة كاملة على الورق: لوحة وقطع وهدف وكتيّب قواعد يستطيع صديقك اتباعه دون مساعدتك.",
    },
    units: [
      { en: "Boards & Pieces", ar: "اللوحات والقطع" },
      { en: "Goals & Obstacles", ar: "الأهداف والعقبات" },
      { en: "Writing Rules", ar: "كتابة القواعد" },
      { en: "Playtest with Friends", ar: "جرّبها مع الأصدقاء" },
    ],
  },
  {
    n: 3,
    title: { en: "What Makes Games Fun", ar: "ما الذي يجعل الألعاب ممتعة" },
    focus: {
      en: "Challenge, choice, chance and reward: the four dials every designer turns — and finding them inside your favourite games.",
      ar: "التحدي والاختيار والحظ والمكافأة: الأقراص الأربعة التي يديرها كل مصمم — ونكتشفها داخل ألعابك المفضلة.",
    },
    units: [
      { en: "Challenge & Flow", ar: "التحدي والانسياب" },
      { en: "Meaningful Choices", ar: "خيارات ذات معنى" },
      { en: "Chance & Luck", ar: "الحظ والصدفة" },
      { en: "Rewards & Progress", ar: "المكافآت والتقدم" },
    ],
  },
  {
    n: 4,
    title: { en: "Level & World Design", ar: "تصميم المراحل والعوالم" },
    focus: {
      en: "Paper prototypes of real levels: teaching without words, pacing difficulty, hiding secrets, and guiding the player's eye.",
      ar: "نماذج ورقية لمراحل حقيقية: التعليم دون كلمات، وتدرّج الصعوبة، وإخفاء الأسرار، وتوجيه عين اللاعب.",
    },
    units: [
      { en: "Teaching Without Words", ar: "التعليم دون كلمات" },
      { en: "Difficulty Curves", ar: "منحنيات الصعوبة" },
      { en: "Secrets & Exploration", ar: "الأسرار والاستكشاف" },
      { en: "Guiding the Eye", ar: "توجيه العين" },
    ],
  },
  {
    n: 5,
    title: { en: "Story & Characters", ar: "القصة والشخصيات" },
    focus: {
      en: "Games tell stories differently: branching choices, characters players care about, and retelling a tale from our region as an interactive adventure.",
      ar: "تروي الألعاب القصص بطريقة مختلفة: خيارات متفرعة، وشخصيات يهتم بها اللاعبون، وإعادة سرد حكاية من منطقتنا كمغامرة تفاعلية.",
    },
    units: [
      { en: "Interactive Stories", ar: "القصص التفاعلية" },
      { en: "Branching Choices", ar: "الخيارات المتفرعة" },
      { en: "Characters & Motivation", ar: "الشخصيات والدوافع" },
      { en: "A Tale from Our Region", ar: "حكاية من منطقتنا" },
    ],
  },
  {
    n: 6,
    title: { en: "Art & Sound", ar: "الفن والصوت" },
    focus: {
      en: "The feel of a game: colour palettes and pixel art, sound effects and music, and how art direction makes two identical games feel completely different.",
      ar: "إحساس اللعبة: لوحات الألوان وفن البكسل، والمؤثرات الصوتية والموسيقى، وكيف يجعل الإخراج الفني لعبتين متطابقتين تبدوان مختلفتين تماماً.",
    },
    units: [
      { en: "Colour & Mood", ar: "اللون والمزاج" },
      { en: "Pixel Art Basics", ar: "أساسيات فن البكسل" },
      { en: "Sound Effects & Music", ar: "المؤثرات والموسيقى" },
      { en: "Art Direction", ar: "الإخراج الفني" },
    ],
  },
  {
    n: 7,
    title: { en: "First Steps in Engines", ar: "الخطوات الأولى في المحركات" },
    focus: {
      en: "From paper to screen: scenes, sprites and events in beginner engines (Scratch, Roblox Studio, GDevelop) — your first playable digital level.",
      ar: "من الورق إلى الشاشة: المشاهد والكائنات والأحداث في محركات المبتدئين (سكراتش، روبلوكس ستوديو، GDevelop) — أول مرحلة رقمية قابلة للعب تصنعها.",
    },
    units: [
      { en: "Scenes & Sprites", ar: "المشاهد والكائنات" },
      { en: "Events & Triggers", ar: "الأحداث والمحفزات" },
      { en: "Movement & Controls", ar: "الحركة والتحكم" },
      { en: "Your First Playable Level", ar: "مرحلتك الأولى القابلة للعب" },
    ],
  },
  {
    n: 8,
    title: { en: "Scripting & Logic", ar: "البرمجة والمنطق" },
    focus: {
      en: "Real code enters the game: variables for score and health, conditionals for rules, loops for spawning — the logic that makes worlds behave.",
      ar: "الكود الحقيقي يدخل اللعبة: المتغيرات للنقاط والصحة، والشروط للقواعد، والحلقات لتوليد العناصر — المنطق الذي يُحيي العوالم.",
    },
    units: [
      { en: "Variables: Score & Health", ar: "المتغيرات: النقاط والصحة" },
      { en: "If This, Then That", ar: "إذا حدث هذا، فافعل ذاك" },
      { en: "Loops & Spawning", ar: "الحلقات وتوليد العناصر" },
      { en: "Debugging Your Game", ar: "تصحيح أخطاء لعبتك" },
    ],
  },
  {
    n: 9,
    title: { en: "Playtesting & Balance", ar: "الاختبار والتوازن" },
    focus: {
      en: "Watching real players break your game: gathering feedback without defending, tuning numbers, and the art of 'easy to learn, hard to master'.",
      ar: "مشاهدة لاعبين حقيقيين يكسرون لعبتك: جمع الملاحظات دون دفاع، وضبط الأرقام، وفن «سهلة التعلّم، صعبة الإتقان».",
    },
    units: [
      { en: "Running a Playtest", ar: "إدارة جلسة اختبار" },
      { en: "Listening to Feedback", ar: "الإصغاء للملاحظات" },
      { en: "Tuning & Balance", ar: "الضبط والتوازن" },
      { en: "Easy to Learn, Hard to Master", ar: "سهلة التعلّم، صعبة الإتقان" },
    ],
  },
  {
    n: 10,
    title: { en: "Ship Your First Game", ar: "أطلق لعبتك الأولى" },
    focus: {
      en: "The capstone year: finish a small game, polish it, publish it, and present it — plus a map of the region's booming games industry and where you could fit.",
      ar: "سنة المشروع الختامي: أنهِ لعبة صغيرة، واصقلها، وانشرها، وقدّمها — مع خريطة لصناعة الألعاب المزدهرة في منطقتنا ومكانك المحتمل فيها.",
    },
    units: [
      { en: "Scope Small, Finish Big", ar: "خطّط صغيراً وأنجز كبيراً" },
      { en: "Polish & Juice", ar: "الصقل واللمسات" },
      { en: "Publishing Your Game", ar: "نشر لعبتك" },
      { en: "The Games Industry Here", ar: "صناعة الألعاب في منطقتنا" },
    ],
  },
];
