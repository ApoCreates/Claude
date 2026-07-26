// The wadehAI Method Engine — 150 distinct, learning-science-grounded ways to
// make a concept stick, grouped into twelve modes of learning. Each is unique
// (no near-duplicates), tagged with where it fits, and surfaced two ways:
//   • the Method Library page (/methods) shows all 150 by family;
//   • lessons pull mode-appropriate techniques into their Study Notebook so
//     every class is multi-sensory, not just read-and-quiz.
//
// Bases (why these work): retrieval practice & the testing effect (Roediger &
// Karpicke), spaced & interleaved practice (Cepeda; Rohrer), dual coding
// (Paivio; Mayer's multimedia principle), the generation & protégé effects,
// desirable difficulties (Bjork), embodied cognition, narrative transportation,
// and self-determination / mastery motivation (Deci & Ryan).

import type { Bi } from "./curriculum";

export interface Method {
  id: string;
  family: string; // family key below
  name: Bi;
  blurb: Bi; // one concrete sentence: what the learner actually does
  fit: string[]; // subject slugs it suits best, or ["all"]
}

export interface Family {
  key: string;
  title: Bi;
  idea: Bi;
  image: string; // /art/methods/<key>.webp
}

export const FAMILIES: Family[] = [
  { key: "memory", title: { en: "Retrieval & Memory", ar: "الاسترجاع والذاكرة" }, idea: { en: "Pull knowledge out, don't just push it in — testing is the study.", ar: "استخرج المعرفة بدل حشوها — الاختبار نفسه هو المذاكرة." }, image: "/art/methods/memory.webp" },
  { key: "visual", title: { en: "Visual & Spatial", ar: "البصري والمكاني" }, idea: { en: "Two channels beat one: pair every word with a picture or a place.", ar: "قناتان أفضل من واحدة: اقرن كل كلمة بصورة أو مكان." }, image: "/art/methods/visual.webp" },
  { key: "music", title: { en: "Sound & Music", ar: "الصوت والموسيقى" }, idea: { en: "Melody and rhythm carry facts memory alone can't hold.", ar: "اللحن والإيقاع يحملان حقائق تعجز الذاكرة وحدها عن حفظها." }, image: "/art/methods/music.webp" },
  { key: "movement", title: { en: "Movement & Body", ar: "الحركة والجسد" }, idea: { en: "The body is a memory device — move the idea to keep it.", ar: "الجسد أداة ذاكرة — حرّك الفكرة لتبقى." }, image: "/art/methods/movement.webp" },
  { key: "story", title: { en: "Story & Narrative", ar: "القصة والسرد" }, idea: { en: "A fact wrapped in a story is remembered up to seven times better.", ar: "الحقيقة داخل قصة تُحفظ أضعافاً." }, image: "/art/methods/story.webp" },
  { key: "play", title: { en: "Play & Games", ar: "اللعب والألعاب" }, idea: { en: "Goals, feedback and stakes turn practice into play.", ar: "الأهداف والتغذية الراجعة والرهان تحوّل التمرين إلى لعب." }, image: "/art/methods/play.webp" },
  { key: "social", title: { en: "Talk & Teach", ar: "الحوار والتعليم" }, idea: { en: "Explaining to someone else is the fastest way to understand.", ar: "الشرح لغيرك أسرع طريق للفهم." }, image: "/art/methods/social.webp" },
  { key: "reallife", title: { en: "Real Life & Relevance", ar: "الحياة والصلة" }, idea: { en: "Anchor the abstract to something the learner already lives.", ar: "اربط المجرّد بما يعيشه المتعلّم فعلاً." }, image: "/art/methods/reallife.webp" },
  { key: "senses", title: { en: "Senses & Making", ar: "الحواس والصنع" }, idea: { en: "Build it, touch it, taste it — the hand teaches the head.", ar: "ابنِه والمسه وتذوّقه — اليد تعلّم العقل." }, image: "/art/methods/senses.webp" },
  { key: "wonder", title: { en: "Emotion & Wonder", ar: "الدهشة والمشاعر" }, idea: { en: "Curiosity and awe open the door memory walks through.", ar: "الفضول والدهشة يفتحان باب الذاكرة." }, image: "/art/methods/wonder.webp" },
  { key: "meta", title: { en: "Reflect & Master", ar: "التأمّل والإتقان" }, idea: { en: "Thinking about your thinking is what turns practice into mastery.", ar: "التفكير في تفكيرك هو ما يحوّل التمرين إلى إتقان." }, image: "/art/methods/meta.webp" },
  { key: "identity", title: { en: "Trophies & Identity", ar: "الجوائز والهوية" }, idea: { en: "Keep the wins, and let the learner become the scientist.", ar: "احتفظ بالانتصارات، ودَع المتعلّم يصبح العالِم." }, image: "/art/methods/identity.webp" },
];

const m = (id: string, family: string, en: string, ar: string, ben: string, bar: string, fit: string[] = ["all"]): Method => ({
  id,
  family,
  name: { en, ar },
  blurb: { en: ben, ar: bar },
  fit,
});

export const METHODS: Method[] = [
  // ---- 1. Retrieval & Memory ----
  m("free-recall", "memory", "Blank-Page Brain Dump", "التفريغ على ورقة بيضاء", "Close everything and write all you remember before checking.", "أغلق كل شيء واكتب كل ما تذكره قبل المراجعة."),
  m("low-stakes-quiz", "memory", "Two-Minute Check", "اختبار الدقيقتين", "A tiny no-grade quiz right after learning locks it in.", "اختبار صغير بلا درجة بعد التعلّم مباشرة يثبّت المعلومة."),
  m("spacing", "memory", "Spaced Comebacks", "المراجعة المتباعدة", "Revisit a fact after 1, 3 and 7 days, not all at once.", "عُد للحقيقة بعد يوم وثلاثة وسبعة، لا دفعة واحدة."),
  m("interleaving", "memory", "Shuffle the Deck", "خلط أنواع المسائل", "Mix problem types so the brain must choose the method.", "اخلط أنواع المسائل ليختار الدماغ الطريقة المناسبة."),
  m("pretest", "memory", "Guess-First Pretest", "التخمين قبل التعلّم", "Try to answer before the lesson — wrong guesses prime memory.", "حاول الإجابة قبل الدرس — حتى الخطأ يهيّئ الذاكرة."),
  m("cued-recall", "memory", "Fill-the-Gap Cues", "تلميحات ملء الفراغ", "Hide key words and recall them from a small hint.", "أخفِ الكلمات المفتاحية واسترجعها من تلميح صغير."),
  m("teach-empty-room", "memory", "Explain to the Wall", "اشرح للجدار", "Say the idea aloud to an empty room, no notes.", "قل الفكرة بصوت عالٍ لغرفة فارغة دون ملاحظات."),
  m("memory-palace", "memory", "Memory Palace", "قصر الذاكرة", "Place facts along a familiar walk through your home.", "ضع الحقائق على طول مسار مألوف في بيتك."),
  m("chunking", "memory", "Chunk It", "التقطيع إلى وحدات", "Group long lists into 3–4 meaningful bundles.", "اجمع القوائم الطويلة في حزم قليلة ذات معنى."),
  m("acrostic", "memory", "First-Letter Trick", "حيلة الأحرف الأولى", "Build a silly sentence from each item's first letter.", "كوّن جملة طريفة من الأحرف الأولى للعناصر."),
  m("peg-system", "memory", "Number-Shape Pegs", "معالق الأرقام والأشكال", "Hook numbers to shapes (2 = swan) to fix a sequence.", "اربط الأرقام بأشكال (٢ = بجعة) لتثبيت التسلسل."),
  m("yesterday-first", "memory", "Yesterday First", "ابدأ بالأمس", "Open each class by recalling last class from memory.", "ابدأ كل حصة باسترجاع الحصة السابقة من الذاكرة."),

  // ---- 2. Visual & Spatial ----
  m("dual-coding", "visual", "Word + Picture", "كلمة وصورة", "Draw a quick icon beside every new term.", "ارسم أيقونة سريعة بجانب كل مصطلح جديد."),
  m("mind-map", "visual", "Mind Map", "الخريطة الذهنية", "Branch ideas out from one center to show links.", "فرّع الأفكار من مركز واحد لإظهار الروابط."),
  m("sketchnote", "visual", "Sketchnotes", "الرسم التدويني", "Take notes as tiny drawings, arrows and boxes.", "دوّن ملاحظاتك رسومات صغيرة وأسهماً وصناديق."),
  m("flowchart", "visual", "Flowchart the Steps", "مخطّط الخطوات", "Turn a process into boxes joined by arrows.", "حوّل العملية إلى صناديق تربطها الأسهم."),
  m("concept-map", "visual", "Linked Concept Map", "خريطة المفاهيم", "Connect ideas with labelled 'because/leads to' arrows.", "اربط الأفكار بأسهم موسومة «لأنّ/يؤدّي إلى»."),
  m("timeline", "visual", "Timeline It", "الخط الزمني", "Lay events or steps on a left-to-right line.", "رتّب الأحداث أو الخطوات على خط زمني."),
  m("color-code", "visual", "Colour-Code", "الترميز اللوني", "Give each category its own colour across the topic.", "امنح كل فئة لوناً خاصاً عبر الموضوع."),
  m("comic-strip", "visual", "Comic Strip", "الشريط المصوّر", "Retell the idea in six drawn panels.", "أعد سرد الفكرة في ست لوحات مرسومة."),
  m("before-after", "visual", "Before / After", "قبل / بعد", "Draw the state before and after a change side by side.", "ارسم الحالة قبل التغيّر وبعده جنباً إلى جنب."),
  m("graph-the-idea", "visual", "Graph the Idea", "ارسم الفكرة بيانياً", "Plot the relationship to see its shape.", "ارسم العلاقة بيانياً لترى شكلها.", ["math", "physics", "entrepreneurship"]),
  m("icon-summary", "visual", "One-Icon Summary", "خلاصة بأيقونة", "Compress the whole lesson into a single symbol.", "اختصر الدرس كله في رمز واحد."),
  m("zoom-scale", "visual", "Zoom In, Zoom Out", "تقريب وتبعيد", "See the idea at atom-scale and at world-scale.", "انظر للفكرة بحجم الذرّة وبحجم العالم."),

  // ---- 3. Sound & Music ----
  m("melody-mnemonic", "music", "Set It to a Tune", "لحّنها", "Sing facts to a melody you already know.", "غنِّ الحقائق على لحن تعرفه مسبقاً."),
  m("rhythm-chant", "music", "Rhythm Chant", "الترديد الإيقاعي", "Clap a steady beat while chanting a rule.", "صفّق بإيقاع ثابت وأنت ترددّ قاعدة."),
  m("rap-the-rule", "music", "Rap the Rule", "راب القاعدة", "Write four rhyming lines that hold the key steps.", "اكتب أربعة أبيات مقفّاة تحمل الخطوات."),
  m("call-response", "music", "Call & Response", "النداء والجواب", "Teacher calls half a fact, learner answers the rest.", "ينادي المعلّم بنصف الحقيقة ويكمل المتعلّم."),
  m("sound-anchor", "music", "Sound Effect Anchor", "مرساة صوتية", "Tie a distinct sound to each concept.", "اربط صوتاً مميزاً بكل مفهوم."),
  m("podcast-it", "music", "Listen Like a Podcast", "استمع كبودكاست", "Hear the lesson read aloud on the move.", "استمع للدرس مقروءاً أثناء التنقّل."),
  m("jingle", "music", "Make a Jingle", "اصنع جِنغل", "A five-second hook for a formula or list.", "مقطع من خمس ثوانٍ لصيغة أو قائمة."),
  m("beat-count", "music", "Beat-Count Sequences", "عدّ إيقاعي", "Use a drumbeat to remember an ordered process.", "استخدم إيقاع طبل لتذكّر تسلسل مرتّب."),
  m("sonify-graph", "music", "Hear the Graph", "اسمع المنحنى", "Turn a rising curve into a rising pitch.", "حوّل المنحنى الصاعد إلى نغمة صاعدة.", ["math", "physics"]),
  m("lyric-swap", "music", "Swap the Lyrics", "بدّل الكلمات", "Rewrite a famous song with the lesson's words.", "أعد كتابة أغنية شهيرة بكلمات الدرس."),
  m("audio-flash", "music", "Audio Flashcards", "بطاقات صوتية", "Record question-then-answer clips to replay.", "سجّل مقاطع سؤال ثم جواب لإعادة السماع."),
  m("soundscape", "music", "Context Soundscape", "مشهد صوتي", "Play the ambience of the topic while you study.", "شغّل أجواء الموضوع الصوتية أثناء الدراسة."),
  m("silence-reset", "music", "Silence, Then Sound", "صمت ثم صوت", "A beat of quiet before a key point sharpens focus.", "لحظة صمت قبل النقطة المهمة تشحذ الانتباه."),

  // ---- 4. Movement & Body ----
  m("act-it-out", "movement", "Act It Out", "مثّلها", "Become the particle, the planet or the verb.", "كن الجسيم أو الكوكب أو الفعل."),
  m("gesture-anchor", "movement", "Gesture Anchor", "إيماءة مرساة", "Invent one hand sign per concept and reuse it.", "اخترع إشارة يد لكل مفهوم وكرّرها."),
  m("walk-recall", "movement", "Walk & Recall", "امشِ واسترجع", "Pace the room while retrieving from memory.", "تمشَّ في الغرفة وأنت تسترجع من الذاكرة."),
  m("human-number-line", "movement", "Human Number Line", "خط الأعداد البشري", "Step forward and back along a floor number line.", "تقدّم وتراجع على خط أعداد أرضي.", ["math"]),
  m("clap-syllables", "movement", "Clap the Syllables", "صفّق المقاطع", "Break a hard word by clapping each beat.", "قسّم الكلمة الصعبة بتصفيق كل مقطع.", ["languages"]),
  m("body-shapes", "movement", "Build It With Your Body", "اصنعه بجسدك", "Form angles, letters or circuits with arms.", "شكّل الزوايا أو الحروف أو الدارات بذراعيك."),
  m("tpr", "movement", "Total Physical Response", "الاستجابة الجسدية", "Act each new word so meaning lives in motion.", "مثّل كل كلمة جديدة ليعيش المعنى في الحركة.", ["languages"]),
  m("balance-remember", "movement", "Balance to Remember", "توازن لتتذكّر", "Recite while balancing to fuse focus and recall.", "ردّد وأنت تحافظ على توازنك لدمج التركيز بالاسترجاع."),
  m("dance-cycle", "movement", "Dance the Cycle", "ارقص الدورة", "Choreograph a repeating process as simple moves.", "صمّم حركات بسيطة لعملية متكررة."),
  m("toss-answer", "movement", "Toss & Answer", "ارمِ وأجب", "Pass a ball; whoever catches it answers.", "مرّر كرة؛ من يمسكها يجيب."),
  m("freeze-frame", "movement", "Freeze-Frame Tableau", "لقطة ثابتة", "Pose a still scene that captures the key moment.", "اصنع مشهداً ثابتاً يلتقط اللحظة المفتاحية."),
  m("trace-in-air", "movement", "Trace It in the Air", "ارسمها في الهواء", "Draw the shape or symbol big with your finger.", "ارسم الشكل أو الرمز كبيراً بإصبعك."),

  // ---- 5. Story & Narrative ----
  m("hero-journey", "story", "Hero's Journey Framing", "إطار رحلة البطل", "Cast the concept as a hero facing an obstacle.", "اجعل المفهوم بطلاً يواجه عقبة."),
  m("become-concept", "story", "Become the Concept", "كن المفهوم", "Tell it in first person: 'I am a fraction…'", "احكِها بضمير المتكلّم: «أنا كسر…»."),
  m("cliffhanger", "story", "Cliffhanger", "التشويق المعلّق", "End before the answer so curiosity pulls you back.", "توقّف قبل الإجابة ليجذبك الفضول."),
  m("origin-story", "story", "Origin Story", "قصة النشأة", "Learn the messy history of how the idea was found.", "تعرّف على التاريخ الحقيقي لاكتشاف الفكرة."),
  m("what-if", "story", "What-If Tale", "حكاية ماذا لو", "Explore a world where the rule is switched off.", "استكشف عالماً تُلغى فيه القاعدة."),
  m("myth-bridge", "story", "Folk-Tale Bridge", "جسر الحكاية الشعبية", "Link the concept to a story from your region.", "اربط المفهوم بحكاية من منطقتك."),
  m("object-diary", "story", "Diary of an Object", "يوميّات شيء", "Write a day in the life of an atom or a coin.", "اكتب يوماً في حياة ذرّة أو عملة."),
  m("case-story", "story", "True Case Story", "قصة واقعية", "Anchor the rule in one real person's story.", "ثبّت القاعدة في قصة شخص حقيقي."),
  m("fable-moral", "story", "Fable With a Moral", "حكاية بمغزى", "Compress the lesson into a short moral tale.", "اختصر الدرس في حكاية قصيرة ذات مغزى."),
  m("serial-episodes", "story", "Serial Episodes", "حلقات متسلسلة", "Turn a unit into a season with a story arc.", "حوّل الوحدة إلى موسم بحبكة متصلة."),
  m("spot-the-error", "story", "Unreliable Narrator", "الراوي غير الموثوق", "A character explains it wrong — find the slip.", "شخصية تشرحها خطأً — اكتشف الزلّة."),
  m("setting-swap", "story", "Same Idea, New World", "الفكرة ذاتها بعالم جديد", "Retell the concept in space, a souq, the sea.", "أعد سرد المفهوم في الفضاء أو السوق أو البحر."),

  // ---- 6. Play & Games ----
  m("quest-map", "play", "Quest Map", "خريطة المهام", "Show the topic as a path of quests to clear.", "اعرض الموضوع مساراً من المهام."),
  m("escape-room", "play", "Escape-Room Puzzle", "لغز غرفة الهروب", "Chain clues so each answer unlocks the next.", "اربط الأدلّة ليفتح كل جواب التالي."),
  m("boss-battle", "play", "Boss Battle", "معركة الزعيم", "A hard mixed challenge that proves mastery.", "تحدٍّ صعب مختلط يثبت الإتقان."),
  m("speedrun", "play", "Speedrun Sprint", "سباق السرعة", "Beat the clock on a set of quick problems.", "تغلّب على الساعة في مجموعة مسائل سريعة."),
  m("collect-set", "play", "Collect the Set", "اجمع المجموعة", "Earn a badge for each subskill until complete.", "اكسب شارة لكل مهارة فرعية حتى تكتمل."),
  m("role-play-sim", "play", "Role-Play Simulation", "محاكاة الأدوار", "Run a mini market, court or lab and play a part.", "أدِر سوقاً أو محكمة أو مختبراً مصغّراً والعب دوراً.", ["entrepreneurship", "leadership", "ai"]),
  m("board-game", "play", "Board-Game It", "حوّلها لعبة لوحية", "Design a simple board where moves test the rule.", "صمّم لوحاً بسيطاً تختبر حركاته القاعدة."),
  m("dice-problems", "play", "Dice Problems", "مسائل النرد", "Roll dice to generate endless fresh questions.", "ارمِ النرد لتوليد أسئلة جديدة بلا نهاية.", ["math", "physics"]),
  m("trivia-duel", "play", "Trivia Duel", "مبارزة معلومات", "Head-to-head rapid questions for points.", "أسئلة سريعة وجهاً لوجه من أجل النقاط."),
  m("sandbox", "play", "Sandbox Mode", "وضع الاستكشاف الحر", "Free-play with the variables and just notice.", "العب بحرية مع المتغيّرات ولاحظ فقط."),
  m("level-up", "play", "Level-Up Ladder", "سلّم الترقّي", "Each mastered skill unlocks a harder tier.", "كل مهارة مُتقنة تفتح مستوى أصعب."),
  m("easter-egg", "play", "Hidden Easter Egg", "مفاجأة مخبّأة", "Reward the curious with a secret bonus fact.", "كافئ الفضولي بحقيقة إضافية سرّية."),
  m("prediction-game", "play", "Bet & Reveal", "راهن واكشف", "Wager on an outcome, then run it to see.", "راهن على نتيجة ثم شغّلها لترى."),

  // ---- 7. Talk & Teach ----
  m("peer-teach", "social", "Teach a Friend", "علّم صديقاً", "You truly learn it when you can teach it.", "تتقنها حقاً حين تستطيع تعليمها."),
  m("think-pair-share", "social", "Think–Pair–Share", "فكّر–زاوج–شارك", "Think alone, discuss in twos, share with all.", "فكّر وحدك، ناقش ثنائياً، ثم شارك الجميع."),
  m("socratic", "social", "Socratic Questions", "الأسئلة السقراطية", "Reach the answer through a chain of questions.", "بلوغ الجواب عبر سلسلة أسئلة."),
  m("debate", "social", "Two-Sides Debate", "مناظرة الطرفين", "Argue both sides to understand the whole.", "جادِل الطرفين لفهم الصورة الكاملة.", ["leadership", "problem-solving", "entrepreneurship"]),
  m("jigsaw", "social", "Jigsaw Experts", "خبراء الأحجية", "Each learner masters one piece, then teaches it.", "يتقن كل متعلّم قطعة ثم يعلّمها."),
  m("fishbowl", "social", "Fishbowl Discussion", "نقاش حوض السمك", "A small group discusses while others observe.", "تناقش مجموعة صغيرة بينما يراقب الآخرون."),
  m("rubber-duck", "social", "Rubber-Duck Explain", "شرح البطة", "Explain step by step to a toy until it clicks.", "اشرح خطوة بخطوة للعبة حتى تتّضح."),
  m("gallery-walk", "social", "Gallery Walk", "جولة المعرض", "Post work on walls; walk, read and comment.", "علّق الأعمال؛ تجوّل واقرأ وعلّق."),
  m("interview-expert", "social", "Interview an Expert", "قابل خبيراً", "Prepare and ask a pro five sharp questions.", "حضّر خمسة أسئلة حادّة واسأل محترفاً."),
  m("teach-back", "social", "Teach-Back", "أعد التعليم", "Say it back in your own words to check understanding.", "أعِدها بكلماتك للتحقّق من الفهم."),
  m("consensus", "social", "Consensus Circle", "دائرة التوافق", "A group must agree on one best answer.", "على المجموعة الاتفاق على أفضل إجابة."),
  m("ama", "social", "Ask Me Anything", "اسألني أي شيء", "Open the floor to any question, no wrong ones.", "افتح الباب لأي سؤال بلا خطأ."),

  // ---- 8. Real Life & Relevance ----
  m("authentic-task", "reallife", "Real Deliverable", "منتج حقيقي", "Make something a real person would actually use.", "اصنع شيئاً قد يستخدمه شخص حقيقي."),
  m("project-based", "reallife", "Project-Based", "التعلّم بالمشروع", "Learn the content by building toward one project.", "تعلّم المحتوى ببناء مشروع واحد."),
  m("indirect-analogy", "reallife", "Everyday Stand-In", "بديل من الحياة", "Explain the hard idea with a kitchen or street thing.", "اشرح الفكرة الصعبة بشيء من المطبخ أو الشارع."),
  m("field-observe", "reallife", "Field Observation", "الملاحظة الميدانية", "Go find the concept out in the real world.", "اخرج لتجد المفهوم في العالم الحقيقي."),
  m("news-hook", "reallife", "News Hook", "خطّاف الأخبار", "Tie the lesson to something happening this week.", "اربط الدرس بحدث هذا الأسبوع."),
  m("career-lens", "reallife", "How a Pro Uses It", "كيف يستخدمها محترف", "See the exact job that needs this skill daily.", "شاهد المهنة التي تحتاج هذه المهارة يومياً."),
  m("local-data", "reallife", "Your Own City's Data", "بيانات مدينتك", "Run the numbers on your street, souq or team.", "طبّق الأرقام على شارعك أو سوقك أو فريقك."),
  m("fix-real-problem", "reallife", "Fix a Real Problem", "حُلّ مشكلة حقيقية", "Point the skill at a problem in your community.", "وجّه المهارة لمشكلة في مجتمعك.", ["problem-solving", "leadership"]),
  m("follow-money", "reallife", "Follow the Money", "تتبّع المال", "Trace the costs and value behind the idea.", "تتبّع التكاليف والقيمة خلف الفكرة.", ["entrepreneurship"]),
  m("reverse-engineer", "reallife", "Reverse-Engineer It", "الهندسة العكسية", "Take a finished thing apart to see the rule inside.", "فكّك شيئاً جاهزاً لترى القاعدة بداخله.", ["ai", "gaming", "physics"]),
  m("cart-math", "reallife", "Shopping-Cart Maths", "رياضيات عربة التسوّق", "Practise with real prices, discounts and change.", "تدرّب بأسعار وخصومات وباقي حقيقي.", ["math", "entrepreneurship"]),
  m("kitchen-science", "reallife", "Kitchen Science", "علوم المطبخ", "Boil, freeze and mix to see the physics happen.", "اغلِ وجمّد وامزج لترى الفيزياء تحدث.", ["physics", "geography"]),
  m("map-neighborhood", "reallife", "Map Your Streets", "ارسم خريطة حيّك", "Turn your own neighbourhood into the case study.", "اجعل حيّك حالة الدراسة.", ["geography"]),

  // ---- 9. Senses & Making ----
  m("manipulatives", "senses", "Hands-On Blocks", "مكعّبات يدوية", "Move real objects to make the abstract concrete.", "حرّك أشياء حقيقية لتجسيد المجرّد.", ["math"]),
  m("tactile-texture", "senses", "Feel the Texture", "المس الملمس", "Attach a texture to each category to sort by touch.", "اربط ملمساً بكل فئة للفرز باللمس."),
  m("smell-taste", "senses", "Taste & Smell Anchor", "مرساة التذوّق والشم", "Link a flavour or scent to a fact to fix it.", "اربط نكهة أو رائحة بحقيقة لتثبيتها."),
  m("build-model", "senses", "Build a Model", "ابنِ نموذجاً", "Construct a physical model of the system.", "اصنع نموذجاً مادياً للنظام."),
  m("clay-craft", "senses", "Clay & Craft", "الصلصال والحرف", "Shape the concept in clay you can hold.", "شكّل المفهوم بصلصال تمسكه."),
  m("origami", "senses", "Fold It (Origami)", "اطوِها (أوريغامي)", "Fold paper to reveal angles, fractions and symmetry.", "اطوِ الورق لتكشف الزوايا والكسور والتماثل.", ["math"]),
  m("draw-from-memory", "senses", "Draw From Memory", "ارسم من الذاكرة", "Redraw the diagram with the book closed.", "أعد رسم المخطّط والكتاب مغلق."),
  m("touch-diagram", "senses", "Touchable Diagram", "مخطّط يُلمس", "Build a raised diagram you can read by hand.", "اصنع مخطّطاً بارزاً يُقرأ باليد."),
  m("foldable", "senses", "Paper Foldable", "مطويّة ورقية", "Make a flap-book that hides answers under folds.", "اصنع كتيّب طيّات يخفي الأجوبة تحت الطيّات."),
  m("lego-proof", "senses", "Brick Proof", "برهان بالمكعّبات", "Prove an area or ratio with stacked bricks.", "أثبت مساحة أو نسبة بمكعّبات مرصوصة.", ["math"]),
  m("grow-it", "senses", "Grow It", "ازرعها", "Plant, water and chart change over real days.", "ازرع واسقِ وارصد التغيّر عبر أيام حقيقية.", ["geography", "physics"]),
  m("cook-concept", "senses", "Cook the Concept", "اطبخ المفهوم", "Follow a recipe that is secretly the lesson.", "اتبع وصفة هي في السرّ الدرس."),
  m("collage", "senses", "Idea Collage", "كولاج الفكرة", "Cut and paste images that define the term.", "قصّ والصق صوراً تعرّف المصطلح."),

  // ---- 10. Emotion & Wonder ----
  m("curiosity-gap", "wonder", "Open a Curiosity Gap", "افتح فجوة فضول", "Reveal just enough to make the rest itch.", "اكشف ما يكفي لإثارة الرغبة في الباقي."),
  m("awe-moment", "wonder", "Awe Moment", "لحظة رهبة", "Pause on the sheer scale or beauty of it.", "توقّف عند ضخامة الفكرة أو جمالها."),
  m("surprise-fact", "wonder", "Surprise Fact", "حقيقة مفاجئة", "Lead with the one detail that breaks expectations.", "ابدأ بالتفصيلة التي تكسر التوقّع."),
  m("personal-why", "wonder", "Why It Matters to You", "لماذا تهمّك", "Connect the idea to the learner's own life goal.", "اربط الفكرة بهدف المتعلّم الشخصي."),
  m("mystery-box", "wonder", "Mystery Box", "الصندوق الغامض", "Hide the topic behind clues to be uncovered.", "أخفِ الموضوع خلف أدلّة تُكشف."),
  m("predict-reveal", "wonder", "Predict, Then Reveal", "توقّع ثم اكشف", "Commit to a guess before the truth appears.", "التزم بتخمين قبل ظهور الحقيقة."),
  m("humor-hook", "wonder", "Humour Hook", "خطّاف الطرافة", "A joke that carries the point sticks longer.", "نكتة تحمل الفكرة تبقى أطول."),
  m("emotion-anchor", "wonder", "Tie It to a Feeling", "اربطها بشعور", "Attach the fact to a strong, real emotion.", "اربط الحقيقة بشعور قوي حقيقي."),
  m("paradox", "wonder", "Wait-What Paradox", "مفارقة «مهلاً ماذا؟»", "Present the puzzle that seems impossible at first.", "اعرض اللغز الذي يبدو مستحيلاً أول الأمر."),
  m("symmetry-beauty", "wonder", "Beauty of Symmetry", "جمال التماثل", "Point to the pattern that feels satisfying.", "أشِر إلى النمط المُرضي للعين.", ["math", "geography"]),
  m("goosebumps", "wonder", "Goosebumps Fact", "حقيقة تقشعرّ لها", "One staggering number that reframes the topic.", "رقم مذهل يعيد تأطير الموضوع."),
  m("gratitude-idea", "wonder", "Thank the Idea", "اشكر الفكرة", "Notice what this concept quietly gives you daily.", "لاحظ ما يمنحك إياه المفهوم يومياً بهدوء."),

  // ---- 11. Reflect & Master ----
  m("self-explain", "meta", "Self-Explanation", "الشرح الذاتي", "Ask 'why is this step true?' at each move.", "اسأل «لماذا هذه الخطوة صحيحة؟» عند كل حركة."),
  m("error-analysis", "meta", "Learn From the Error", "تعلّم من الخطأ", "Study a wrong answer to find the exact slip.", "ادرس إجابة خاطئة لتجد الزلّة بالضبط."),
  m("muddiest-point", "meta", "Muddiest Point", "أغمض نقطة", "Name the one thing still unclear, then attack it.", "سمِّ الشيء الغامض ثم عالجه."),
  m("exit-ticket", "meta", "Exit Ticket", "بطاقة الخروج", "Answer one question to close each class.", "أجب سؤالاً واحداً لإغلاق كل حصة."),
  m("goal-setting", "meta", "Set a Tiny Goal", "حدّد هدفاً صغيراً", "Pick one concrete target before you start.", "اختر هدفاً ملموساً واحداً قبل البدء."),
  m("fade-scaffold", "meta", "Fading Scaffolds", "سقالات متلاشية", "Solve with hints that shrink each attempt.", "حُلّ بتلميحات تتقلّص كل محاولة."),
  m("rubric-self", "meta", "Score Yourself", "قيّم نفسك", "Grade your own work against a clear rubric.", "قيّم عملك وفق معيار واضح."),
  m("think-aloud", "meta", "Think Aloud", "فكّر بصوت عالٍ", "Narrate every step of your reasoning.", "اسرد كل خطوة من تفكيرك."),
  m("confidence-rate", "meta", "Rate Your Confidence", "قيّم ثقتك", "Mark how sure you are, then check reality.", "حدّد مدى تأكّدك ثم تحقّق."),
  m("sort-example", "meta", "Concept vs Example", "المفهوم مقابل المثال", "Sort cards into 'is' and 'is not' this idea.", "افرز البطاقات إلى «هذا» و«ليس هذا»."),
  m("reflection-journal", "meta", "Reflection Journal", "يوميّات التأمّل", "Write two lines on what changed in your head today.", "اكتب سطرين عمّا تغيّر في ذهنك اليوم."),
  m("pre-mortem", "meta", "Pre-Mortem", "التشريح المسبق", "Ask what could go wrong before you begin.", "اسأل عمّا قد يفشل قبل أن تبدأ.", ["problem-solving", "leadership", "entrepreneurship"]),
  m("mastery-gate", "meta", "Mastery Gate", "بوّابة الإتقان", "Don't advance until you can score four in five.", "لا تتقدّم حتى تصيب أربعة من خمسة."),

  // ---- 12. Trophies & Identity ----
  m("take-home-trophy", "identity", "Take-Home Trophy", "جائزة تُحمل للبيت", "Keep a printed fact-card from every mastered class.", "احتفظ ببطاقة حقيقة مطبوعة من كل حصة متقنة."),
  m("streak", "identity", "Daily Streak", "سلسلة الأيام", "Protect an unbroken run of learning days.", "احمِ سلسلة أيام تعلّم متصلة."),
  m("mastery-badge", "identity", "Mastery Badge", "شارة الإتقان", "Earn a sun for each year fully mastered.", "اكسب شمساً لكل سنة أُتقنت كاملة."),
  m("progress-bar", "identity", "Visible Progress", "تقدّم مرئي", "Watch a bar fill as the topic gets conquered.", "شاهد شريطاً يمتلئ مع اجتياز الموضوع."),
  m("certificate", "identity", "Class Certificate", "شهادة الحصة", "A dated certificate for finishing a semester.", "شهادة مؤرّخة لإنهاء فصل دراسي."),
  m("highlight-reel", "identity", "Highlight Reel", "شريط الإنجازات", "A weekly recap of every win you earned.", "ملخّص أسبوعي لكل انتصار حقّقته."),
  m("name-on-it", "identity", "Put Your Name on It", "ضع اسمك عليه", "Sign the work — ownership deepens care.", "وقّع عملك — الملكية تعمّق العناية."),
  m("i-can", "identity", "'I Can' Statements", "عبارات «أستطيع»", "Turn each skill into a proud 'I can…' line.", "حوّل كل مهارة إلى سطر «أستطيع…» فخور."),
  m("portfolio", "identity", "Portfolio Piece", "قطعة معرض الأعمال", "Save the best work into a growing showcase.", "احفظ أفضل عمل في معرض متنامٍ."),
  m("unlock-next", "identity", "Unlock the Next", "افتح التالي", "Finishing here opens a door you can see ahead.", "الإنهاء هنا يفتح باباً تراه أمامك."),
  m("personal-best", "identity", "Hall of Personal Bests", "قاعة أفضل النتائج", "Beat only your own last score.", "تغلّب على نتيجتك السابقة فقط."),
  m("identity-cue", "identity", "You Are a Scientist Now", "أنت عالِم الآن", "Name the learner by the role they're practising.", "نادِ المتعلّم بالدور الذي يمارسه."),
  m("surprise-reward", "identity", "Surprise Reward", "مكافأة مفاجئة", "An occasional unexpected bonus keeps motivation alive.", "مكافأة غير متوقّعة أحياناً تُبقي الدافع حياً."),
];

// Sanity: expose the count so the UI can proudly show "150 ways".
export const METHOD_COUNT = METHODS.length;

export function methodsByFamily(key: string): Method[] {
  return METHODS.filter((x) => x.family === key);
}

// Pick the techniques that best fit a given subject, spread across families,
// so each lesson's notebook can weave in a few distinct modes.
export function methodsForSubject(subjectSlug: string, perFamily = 1): Method[] {
  const out: Method[] = [];
  for (const fam of FAMILIES) {
    const pool = methodsByFamily(fam.key).filter((x) => x.fit.includes("all") || x.fit.includes(subjectSlug));
    out.push(...pool.slice(0, perFamily));
  }
  return out;
}
