// The local answer engine — keeps most answers "ready inside the engine" so
// the online key is a fallback, not the default path. Two free ($0) layers:
//
//  1. A curated bilingual LIBRARY of high-frequency questions per subject.
//  2. An in-memory CACHE of past live answers, keyed by subject+level+lang+
//     normalized question — so an identical question is never paid for twice.
//
// Only when both miss do we call the paid API (and then cache the result).

export function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[ً-ٰٟ]/g, "") // strip Arabic diacritics (tashkeel)
    .replace(/[أإآ]/g, "ا") // normalize alef variants
    .replace(/["'`~!@#$%^&*()_+\-=\[\]{}\\|;:,.<>/?،؛؟…“”«»]/g, " ") // drop punctuation
    .replace(/\s+/g, " ")
    .trim();
}

interface LibraryEntry {
  subjects?: string[]; // restrict to these subject slugs; omit = any subject
  triggers: string[]; // match if the normalized question contains any of these
  reply: { en: string; ar: string };
}

// Curated, on-brand tutor answers: concrete, warm, and ending with a check
// question — the same pedagogy the live tutor uses. Math entries may carry a
// PLOT directive the app renders as a real graph.
const LIBRARY: LibraryEntry[] = [
  {
    subjects: ["math"],
    triggers: ["what is a fraction", "explain fraction", "ما هو الكسر", "اشرح الكسر", "معنى الكسر"],
    reply: {
      en: "A fraction is a way to describe **part of a whole**. Imagine one pizza cut into 4 equal slices 🍕. If you take 1 slice, you have taken **1 out of 4** parts — we write that as **1/4**.\n\n- The bottom number (4) is how many equal parts the whole was cut into.\n- The top number (1) is how many parts you took.\n\nQuick check: if the pizza were cut into 8 equal slices and you took 3, how would you write that as a fraction?",
      ar: "الكسر طريقة لوصف **جزء من كلٍّ**. تخيّل بيتزا مقسومة إلى 4 قطع متساوية 🍕. إذا أخذت قطعة واحدة، فقد أخذت **1 من 4**، ونكتبها هكذا: **1/4**.\n\n- الرقم السفلي (4) هو عدد الأجزاء المتساوية.\n- الرقم العلوي (1) هو عدد الأجزاء التي أخذتها.\n\nسؤال سريع: لو قُسمت البيتزا إلى 8 قطع وأخذت 3، كيف نكتبها ككسر؟",
    },
  },
  {
    subjects: ["math"],
    triggers: ["order of operations", "bidmas", "bodmas", "pemdas", "ترتيب العمليات", "اولوية العمليات"],
    reply: {
      en: "When an expression mixes operations, we solve them in a fixed order so everyone gets the same answer:\n\n1. **B**rackets ( )\n2. **O**rders (powers, roots)\n3. **D**ivision and **M**ultiplication (left → right)\n4. **A**ddition and **S**ubtraction (left → right)\n\nExample: 2 + 3 × 4 = 2 + 12 = **14** (we multiply before we add).\n\nYour turn: what is 10 − 2 × 3?",
      ar: "عندما تختلط العمليات، نحلّها بترتيب ثابت ليحصل الجميع على النتيجة نفسها:\n\n1. **الأقواس** ( )\n2. **الأُسُس** (القوى والجذور)\n3. **القسمة والضرب** (من اليسار إلى اليمين)\n4. **الجمع والطرح** (من اليسار إلى اليمين)\n\nمثال: 2 + 3 × 4 = 2 + 12 = **14** (نضرب قبل أن نجمع).\n\nدورك: كم يساوي 10 − 2 × 3؟",
    },
  },
  {
    subjects: ["physics"],
    triggers: ["what is gravity", "explain gravity", "ما هي الجاذبية", "اشرح الجاذبية"],
    reply: {
      en: "Gravity is the **pull every object with mass has on every other object**. Earth is huge, so its pull is strong enough to keep us on the ground and to make a dropped ball fall.\n\nNear Earth's surface, gravity speeds a falling object up by about **9.8 metres per second, every second**. That's why a ball falls faster the longer it drops.\n\nCheck: if you drop a ball and a feather in a tube with no air, which lands first?",
      ar: "الجاذبية هي **قوة الجذب التي يملكها كل جسم له كتلة تجاه الأجسام الأخرى**. الأرض ضخمة، لذا جذبها قوي بما يكفي ليبقينا على سطحها ويجعل الكرة تسقط.\n\nقرب سطح الأرض، تزيد الجاذبية سرعة الجسم الساقط بنحو **9.8 متر في الثانية كل ثانية**. لذلك تتسارع الكرة كلما طال سقوطها.\n\nتحقّق: لو أسقطت كرة وريشة داخل أنبوب خالٍ من الهواء، أيّهما يصل أولاً؟",
    },
  },
  {
    subjects: ["physics"],
    triggers: ["what is energy", "explain energy", "ما هي الطاقة", "اشرح الطاقة"],
    reply: {
      en: "Energy is **the ability to make something happen** — to move, heat, light, or change. It never disappears; it only **changes form**.\n\nWhen you lift a ball, you store *potential* energy. Let go, and it turns into *motion* (kinetic) energy as it falls. The total stays the same.\n\nQuestion: when you stretch a rubber band and release it, what form does the stored energy turn into?",
      ar: "الطاقة هي **القدرة على إحداث تغيير** — حركة أو حرارة أو ضوء. لا تفنى، بل **تتحوّل من شكل إلى آخر**.\n\nحين ترفع كرة، تخزّن طاقة *وضع*. وعند تركها تتحوّل إلى طاقة *حركة* أثناء السقوط، ويبقى المجموع ثابتًا.\n\nسؤال: عندما تشدّ مطاطًا ثم تتركه، إلى أي شكل تتحوّل الطاقة المخزّنة؟",
    },
  },
  {
    subjects: ["ai"],
    triggers: ["what is artificial intelligence", "what is ai", "what is machine learning", "ما هو الذكاء الاصطناعي", "ما هو تعلم الالة"],
    reply: {
      en: "Artificial Intelligence (AI) is teaching a computer to do things that usually need human thinking — like recognising a cat in a photo or understanding a sentence.\n\nMost modern AI **learns from examples** instead of being told every rule. Show it thousands of labelled cat and dog photos, and it discovers the patterns itself. That's called *machine learning*.\n\nCheck: if you wanted an AI to tell apples from oranges, what examples would you show it first?",
      ar: "الذكاء الاصطناعي هو تعليم الحاسوب أداء مهام تحتاج عادةً تفكيرًا بشريًا — كتمييز قطة في صورة أو فهم جملة.\n\nمعظم الذكاء الاصطناعي الحديث **يتعلّم من الأمثلة** بدل أن نلقّنه كل قاعدة. أرِه آلاف الصور المُوسّمة لقطط وكلاب، فيكتشف الأنماط بنفسه. وهذا يُسمّى *تعلّم الآلة*.\n\nتحقّق: لو أردت ذكاءً اصطناعيًا يميّز التفاح من البرتقال، ما الأمثلة التي ستعرضها عليه أولًا؟",
    },
  },
  {
    subjects: ["geography"],
    triggers: ["what causes seasons", "why do we have seasons", "لماذا لدينا فصول", "ما سبب الفصول"],
    reply: {
      en: "Seasons happen because Earth is **tilted** as it orbits the Sun. The tilt means each half of the planet leans toward the Sun for part of the year and away for another part.\n\nWhen your half leans **toward** the Sun, its rays hit more directly → longer, warmer days (summer). When it leans **away**, the rays spread out → shorter, cooler days (winter).\n\nQuestion: when it is summer in the Gulf, what season is it in Australia — and why?",
      ar: "تحدث الفصول لأن الأرض **مائلة** أثناء دورانها حول الشمس. هذا الميل يجعل كل نصف من الكوكب يميل نحو الشمس جزءًا من العام وبعيدًا عنها جزءًا آخر.\n\nحين يميل نصفك **نحو** الشمس، تسقط أشعتها مباشرة → أيام أطول وأدفأ (صيف). وحين يميل **بعيدًا**، تتوزّع الأشعة → أيام أقصر وأبرد (شتاء).\n\nسؤال: حين يكون الصيف في الخليج، أي فصل يكون في أستراليا — ولماذا؟",
    },
  },
  {
    subjects: ["entrepreneurship"],
    triggers: ["what is profit", "what is a business", "ما هو الربح", "ما هو المشروع"],
    reply: {
      en: "Profit is what's left after you **subtract your costs from your sales**.\n\n> Profit = Money in (sales) − Money out (costs)\n\nIf you sell lemonade for 10 dirhams and the lemons, sugar and cup cost you 6, your profit is **4 dirhams** per cup. If costs were higher than sales, that's a *loss*.\n\nYour turn: you sell a bracelet for 20 and it costs you 12 to make. What is your profit per bracelet?",
      ar: "الربح هو ما يتبقّى بعد أن **تطرح التكاليف من المبيعات**.\n\n> الربح = المال الداخل (المبيعات) − المال الخارج (التكاليف)\n\nإذا بعت عصير ليمون بـ10 دراهم وكلّفك الليمون والسكر والكوب 6، فربحك **4 دراهم** لكل كوب. وإذا زادت التكاليف عن المبيعات، فتلك *خسارة*.\n\nدورك: تبيع سوارًا بـ20 ويكلّفك صنعه 12. كم ربحك في كل سوار؟",
    },
  },
  {
    subjects: ["emotional-intelligence"],
    triggers: ["what is empathy", "what is emotional intelligence", "ما هو التعاطف", "ما هو الذكاء العاطفي"],
    reply: {
      en: "Empathy is **noticing and understanding how another person feels** — almost like standing in their shoes for a moment.\n\nIt has two steps: first *notice* the clues (their face, voice, words), then *imagine* what that feeling is like. It's the heart of emotional intelligence, and it makes you a better friend and teammate.\n\nCheck: a classmate is sitting alone looking down. What clues tell you how they might feel, and what could you say?",
      ar: "التعاطف هو **أن تلاحظ وتفهم شعور شخص آخر** — كأنك تقف مكانه للحظة.\n\nوله خطوتان: أولًا *لاحظ* الإشارات (وجهه، نبرته، كلماته)، ثم *تخيّل* هذا الشعور. إنه قلب الذكاء العاطفي، ويجعلك صديقًا وزميلًا أفضل.\n\nتحقّق: زميل يجلس وحده ورأسه منخفض. ما الإشارات التي تدلّك على شعوره، وماذا يمكن أن تقول له؟",
    },
  },
  {
    subjects: ["leadership"],
    triggers: ["what is leadership", "what makes a good leader", "ما هي القيادة", "ما صفات القائد"],
    reply: {
      en: "Leadership isn't about being the boss — it's about **helping a group reach a goal together**.\n\nGood leaders *listen* before they decide, *share* the credit, and *stay calm* when things go wrong. People follow them because they trust them, not because they're forced to.\n\nQuestion: think of a group task you've done. What is one thing a leader could do to help everyone do their best?",
      ar: "القيادة ليست أن تكون الرئيس، بل أن **تساعد مجموعة على بلوغ هدف معًا**.\n\nالقائد الجيّد *يستمع* قبل أن يقرّر، و*يشارك* الفضل، و*يبقى هادئًا* حين تسوء الأمور. يتبعه الناس لأنهم يثقون به، لا لأنهم مجبرون.\n\nسؤال: تذكّر مهمة جماعية قمت بها. ما شيء واحد يمكن لقائد أن يفعله ليساعد الجميع على تقديم أفضل ما لديهم؟",
    },
  },
  {
    subjects: ["problem-solving"],
    triggers: ["how do i solve a problem", "problem solving steps", "كيف احل مشكلة", "خطوات حل المشكلة"],
    reply: {
      en: "A reliable way to tackle almost any problem is four steps:\n\n1. **Understand** it — say the problem in your own words.\n2. **Plan** — think of a strategy (draw it, break it up, try a smaller version).\n3. **Do** — carry out your plan step by step.\n4. **Check** — does the answer make sense? If not, try a different plan.\n\nPick a problem you're stuck on. Can you say it back to me in your own words first (step 1)?",
      ar: "طريقة موثوقة لحلّ أي مشكلة تقريبًا هي أربع خطوات:\n\n1. **افهمها** — عبّر عن المشكلة بكلماتك.\n2. **خطّط** — فكّر في استراتيجية (ارسمها، جزّئها، جرّب نسخة أصغر).\n3. **نفّذ** — طبّق خطّتك خطوة بخطوة.\n4. **تحقّق** — هل الإجابة منطقية؟ إن لم تكن، جرّب خطة أخرى.\n\nاختر مشكلة تحيّرك. هل يمكنك أولًا أن تعيد صياغتها بكلماتك (الخطوة 1)؟",
    },
  },
  {
    subjects: ["languages"],
    triggers: ["how do i learn a language", "how to learn new language", "كيف اتعلم لغة", "كيف اتعلم لغة جديدة"],
    reply: {
      en: "The fastest way to learn a language is **a little, every day, out loud**.\n\n- Learn words in small groups (5–7), tied to pictures or real objects.\n- Say them aloud — your ears and mouth learn together.\n- Use each new word in one sentence the same day.\n- Review yesterday's words before adding new ones (that's how memory sticks).\n\nLet's start: tell me 3 words you'd most like to learn, and we'll build a sentence with one of them.",
      ar: "أسرع طريقة لتعلّم لغة هي **القليل، كل يوم، بصوتٍ مسموع**.\n\n- تعلّم الكلمات في مجموعات صغيرة (5–7)، مرتبطة بصور أو أشياء حقيقية.\n- انطقها بصوت عالٍ — تتعلّم أذنك وفمك معًا.\n- استخدم كل كلمة جديدة في جملة في اليوم نفسه.\n- راجِع كلمات الأمس قبل إضافة جديدة (هكذا تثبت في الذاكرة).\n\nلنبدأ: أخبرني بثلاث كلمات تودّ تعلّمها، ولنبنِ جملة بإحداها.",
    },
  },
  {
    subjects: ["gaming"],
    triggers: ["what is a game loop", "how are games made", "how do games work", "كيف تصنع الالعاب", "ما هي حلقة اللعبة"],
    reply: {
      en: "Almost every video game runs a **game loop** — a cycle the computer repeats many times each second:\n\n1. **Input** — read what the player does (a tap, a key).\n2. **Update** — change the world (move characters, check collisions, add score).\n3. **Draw** — show the new picture on screen.\n\nRepeat fast enough (about 60 times a second) and it looks like smooth motion.\n\nCheck: in a jumping game, which step decides whether the player landed on a platform?",
      ar: "تقريبًا كل لعبة فيديو تدور في **حلقة لعبة** — دورة يكرّرها الحاسوب عشرات المرّات في الثانية:\n\n1. **الإدخال** — اقرأ ما يفعله اللاعب (نقرة، زر).\n2. **التحديث** — غيّر العالم (حرّك الشخصيات، افحص التصادمات، أضف النقاط).\n3. **الرسم** — اعرض الصورة الجديدة على الشاشة.\n\nكرّرها بسرعة كافية (نحو 60 مرة في الثانية) فتبدو حركة سلسة.\n\nتحقّق: في لعبة قفز، أي خطوة تقرّر إن كان اللاعب قد هبط على منصّة؟",
    },
  },
];

/** Curated library lookup. Returns a ready answer or null. Cost: $0. */
export function findLocalAnswer(subject: string, lang: "en" | "ar", question: string): string | null {
  const n = normalizeQuestion(question);
  if (n.length < 3) return null;
  for (const entry of LIBRARY) {
    if (entry.subjects && !entry.subjects.includes(subject)) continue;
    if (entry.triggers.some((tr) => n.includes(normalizeQuestion(tr)))) {
      return entry.reply[lang];
    }
  }
  return null;
}

// ---- Response cache: remember past live answers so identical repeat
// questions never hit the paid API twice. Best-effort, per warm instance. ----

const CACHE_MAX = 800;
const store = globalThis as unknown as { __wadehCache?: Map<string, string> };
const cache = store.__wadehCache ?? new Map<string, string>();
store.__wadehCache = cache;

export function cacheKey(subject: string, level: number, lang: string, question: string): string {
  return `${subject}|${level}|${lang}|${normalizeQuestion(question)}`;
}

export function getCached(key: string): string | null {
  return cache.get(key) ?? null;
}

export function setCached(key: string, reply: string): void {
  if (cache.has(key)) cache.delete(key); // refresh recency
  else if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, reply);
}

export function cacheSize(): number {
  return cache.size;
}
