// Level-scoped offline knowledge base — the DEFAULT source of answers.
//
// Every entry is tagged with the school year it belongs to. A learner on Year L
// can be served baked answers for content up to Year L; anything only baked at a
// higher year is withheld (the live AI, already age-calibrated, handles it, or a
// gentle "that's coming later" nudge). This keeps Year 1 from getting Year 7
// answers, and keeps trivial known questions off the paid API entirely.
//
// This bank is authored subject-by-subject and grows over time; the math solver
// (lib/solver.ts) covers arithmetic across all years computationally.

import type { Bi } from "./curriculum";
import { normalizeQuestion } from "./answers";

export interface KEntry {
  level: number; // the school year this answer is pitched at (1–10)
  triggers: string[]; // normalized-substring matches (EN + AR)
  answer: Bi;
}

const e = (level: number, triggers: string[], en: string, ar: string): KEntry => ({ level, triggers, answer: { en, ar } });

// key = subject slug
const BANK: Record<string, KEntry[]> = {
  math: [
    e(1, ["what is a number", "ما هو العدد", "what are numbers"], "A number tells us **how many**. We count 1, 2, 3… Each step adds one more. Show me two things and one thing — how many altogether?", "العدد يخبرنا **كم**. نعدّ ١، ٢، ٣… كل خطوة تضيف واحداً. أرِني شيئين وشيئاً — كم المجموع؟"),
    e(1, ["what is addition", "how do i add", "ما هو الجمع"], "Adding means **putting groups together** to find the total. 2 apples and 3 apples make 5. The word ‘plus’ (+) means join.", "الجمع يعني **ضمّ المجموعات** لإيجاد المجموع. تفاحتان وثلاث تفاحات = خمس. علامة (+) تعني اضمم."),
    e(3, ["what is multiplication", "what does times mean", "ما هو الضرب", "معنى الضرب"], "Multiplication is **fast adding of equal groups**. 5 × 6 means six groups of five (or five groups of six) — that's 30. It saves adding 5+5+5+5+5+5.", "الضرب هو **جمع سريع لمجموعات متساوية**. ٥ × ٦ تعني ست مجموعات من خمسة — أي ٣٠. يوفّر علينا جمع ٥+٥+٥+٥+٥+٥."),
    e(4, ["what is a fraction", "explain fraction", "ما هو الكسر", "معنى الكسر"], "A fraction is **part of a whole**. Cut a pizza into 4 equal slices; take 1 and you have **1/4**. The bottom number is how many equal parts, the top is how many you took.", "الكسر **جزء من كلٍّ**. قسّم بيتزا إلى ٤ قطع؛ خذ واحدة فلديك **١/٤**. الرقم السفلي عدد الأجزاء المتساوية، والعلوي كم أخذت."),
    e(5, ["what is a percentage", "what is percent", "ما هي النسبة المئوية", "معنى بالمئة"], "Percent means **out of 100**. 25% is 25 of every 100, the same as 1/4. To find 25% of a number, divide by 4 (or multiply by 0.25).", "بالمئة تعني **من كل ١٠٠**. ٢٥٪ هي ٢٥ من كل ١٠٠، وتساوي ١/٤. لإيجاد ٢٥٪ من عدد، اقسمه على ٤ (أو اضربه في ٠٫٢٥)."),
    e(6, ["order of operations", "bodmas", "bidmas", "pemdas", "ترتيب العمليات"], "Solve in a fixed order so everyone agrees: **Brackets, Orders (powers), Division & Multiplication, then Addition & Subtraction**. So 2 + 3 × 4 = 2 + 12 = 14.", "نحلّ بترتيب ثابت: **الأقواس، ثم الأُسُس، ثم القسمة والضرب، ثم الجمع والطرح**. لذا ٢ + ٣ × ٤ = ٢ + ١٢ = ١٤."),
    e(7, ["what is a linear equation", "solve for x", "ما المعادلة الخطية", "كيف أجد x"], "A linear equation is a balance: $ax + b = c$. Do the same to both sides until $x$ is alone: subtract $b$, then divide by $a$, giving $x = (c-b)/a$.", "المعادلة الخطية ميزان: $ax + b = c$. أجرِ العملية نفسها على الطرفين حتى ينفرد $x$: اطرح $b$ ثم اقسم على $a$، فيكون $x = (c-b)/a$."),
    e(9, ["pythagoras", "pythagorean", "فيثاغورس"], "In a right triangle, $a^2 + b^2 = c^2$: the square on the longest side (the hypotenuse) equals the sum of the squares on the other two.", "في المثلث القائم، $a^2 + b^2 = c^2$: مربّع الوتر يساوي مجموع مربّعي الضلعين الآخرين."),
  ],
  physics: [
    e(1, ["float or sink", "why do things float", "لماذا تطفو", "الطفو والغرق"], "Things float when they are **lighter than the water they push aside**. A heavy stone sinks; a light, hollow boat floats. Try it with a spoon and a leaf!", "تطفو الأشياء حين تكون **أخفّ من الماء الذي تزيحه**. الحجر الثقيل يغرق والقارب المجوّف يطفو. جرّب بملعقة وورقة!"),
    e(2, ["what is friction", "ما هو الاحتكاك"], "Friction is the **grip between two surfaces that rub**. It slows things down and lets you walk without slipping. Rough surfaces have more; ice has very little.", "الاحتكاك هو **تماسك بين سطحين يحتكّان**. يبطئ الأشياء ويتيح لك المشي دون انزلاق. الأسطح الخشنة أكثر احتكاكاً، والجليد قليل جداً."),
    e(5, ["what is energy", "explain energy", "ما هي الطاقة"], "Energy is the **ability to make something happen** — move, heat, light. It never disappears; it only **changes form**, like a lifted ball turning stored energy into motion as it falls.", "الطاقة هي **القدرة على إحداث تغيير** — حركة أو حرارة أو ضوء. لا تفنى بل **تتحوّل**، كالكرة المرفوعة تحوّل طاقتها المخزّنة إلى حركة عند السقوط."),
    e(6, ["what is speed", "speed distance time", "ما هي السرعة"], "Speed is **how far you go in a given time**: speed = distance ÷ time. Travel 100 m in 20 s and your speed is 5 m/s.", "السرعة هي **المسافة المقطوعة في زمن معيّن**: السرعة = المسافة ÷ الزمن. تقطع ١٠٠ م في ٢٠ ث فسرعتك ٥ م/ث."),
    e(7, ["what is gravity", "explain gravity", "ما هي الجاذبية"], "Gravity is the **pull every mass has on every other mass**. Earth's pull speeds a falling object up by about 9.8 m/s each second, and gives you your weight.", "الجاذبية **قوة الجذب بين الكتل**. جذب الأرض يزيد سرعة الجسم الساقط بنحو ٩٫٨ م/ث كل ثانية، ويمنحك وزنك."),
    e(8, ["ohms law", "what is resistance", "قانون أوم", "ما هي المقاومة"], "Ohm's Law links them: $V = IR$ — voltage equals current times resistance. More resistance means less current flows for the same voltage.", "قانون أوم يربطها: $V = IR$ — الجهد يساوي التيار في المقاومة. مقاومة أكبر تعني تياراً أقل عند الجهد نفسه."),
    e(10, ["what is momentum", "explain momentum", "ما هو الزخم"], "Momentum $p = mv$ is how much motion a body carries. Force is the rate of change of momentum; when mass is constant that becomes $F = ma$.", "الزخم $p = mv$ مقدار الحركة التي يحملها الجسم. القوة معدّل تغيّر الزخم، وعند ثبات الكتلة تصبح $F = ma$."),
  ],
  geography: [
    e(2, ["what is a map", "ما هي الخريطة"], "A map is a **drawing of a place seen from above**, shrunk to fit paper. It uses symbols and a key so you can find your way.", "الخريطة **رسم لمكانٍ من الأعلى**، مصغّر ليناسب الورقة. تستخدم رموزاً ومفتاحاً لتهتدي بها."),
    e(4, ["what causes seasons", "why do we have seasons", "لماذا الفصول", "سبب الفصول"], "Seasons come from Earth's **tilt** as it orbits the Sun. The half tilted toward the Sun gets direct rays — longer, warmer days (summer); the other half leans away (winter).", "تنشأ الفصول من **ميل** الأرض وهي تدور حول الشمس. النصف المائل نحو الشمس يتلقّى أشعة مباشرة — أيام أطول وأدفأ (صيف)، والآخر يميل بعيداً (شتاء)."),
    // Year 4 is "Water & Weather" in the curriculum, so the water cycle and its
    // stages are baked at Year 4 — not above it.
    e(4, ["what is the water cycle", "دورة الماء", "دورة المياه"], "Water **evaporates** from seas, **condenses** into clouds, **falls** as rain or snow, and **flows** back to the sea — a loop powered by the Sun. Earth never makes new water; it moves the same water forever.", "الماء **يتبخّر** من البحار، و**يتكاثف** غيوماً، و**يهطل** مطراً أو ثلجاً، و**يجري** عائداً للبحر — دورة تحرّكها الشمس. الأرض لا تصنع ماءً جديداً، بل تُحرّك الماء نفسه إلى الأبد."),
    e(4, ["what is evaporation", "ما هو التبخر", "التبخر"], "Evaporation is water turning from **liquid into invisible vapour** when it warms up. That's why a puddle disappears on a hot day — it didn't vanish, it floated up into the air.", "التبخّر هو تحوّل الماء من **سائل إلى بخار غير مرئي** عند تسخينه. لذا تختفي بركة الماء في يوم حارّ — لم تفنَ، بل صعدت إلى الهواء."),
    e(4, ["what is condensation", "ما هو التكاثف", "التكاثف"], "Condensation is vapour cooling back into **tiny droplets**. You see it as mist on a cold glass — and high in the sky those droplets gather into clouds.", "التكاثف هو تبرّد البخار ليعود **قطرات صغيرة**. تراه ضباباً على كوب بارد — وفي أعالي السماء تتجمّع تلك القطرات غيوماً."),
    e(5, ["why is water precious", "water scarcity", "لماذا الماء ثمين", "شح المياه"], "Most of Earth's water is salty sea water; only a tiny share is fresh and reachable. In the Gulf and the Levant rain is rare, so people rely on groundwater, dams and desalination — every litre is worth saving.", "معظم ماء الأرض مالح، ونصيب صغير جداً منه عذب ويمكن الوصول إليه. وفي الخليج وبلاد الشام المطر نادر، لذا يعتمد الناس على المياه الجوفية والسدود والتحلية — وكل لتر يستحقّ التوفير."),
    e(7, ["what is groundwater", "what is an aquifer", "المياه الجوفية", "الخزان الجوفي"], "Groundwater is rain that soaked down and is stored in the spaces inside rock, in a layer called an **aquifer**. Wells reach it — but if we pump faster than rain refills it, the aquifer runs down.", "المياه الجوفية مطرٌ تسرّب إلى الأسفل واختزن في مسامات الصخر، في طبقة تُسمّى **الخزان الجوفي**. تصل إليه الآبار — لكن إن ضخخنا أسرع مما يُعيده المطر، ينضب الخزان."),
    e(8, ["what is climate", "climate vs weather", "ما هو المناخ", "الفرق بين المناخ والطقس"], "Weather is what's happening **today**; climate is the **average pattern over many years**. The Gulf has a hot desert climate; the Levant has hot summers and mild, wet winters.", "الطقس ما يحدث **اليوم**؛ والمناخ **النمط المتوسّط عبر سنوات**. للخليج مناخ صحراوي حارّ، ولبلاد الشام صيف حارّ وشتاء معتدل ممطر."),
  ],
  ai: [
    e(1, ["is it smart", "what makes something smart", "ما الذكاء"], "Something seems ‘smart’ when it can **notice, decide and get better with practice**. A calculator follows fixed rules; a smart helper learns from examples.", "يبدو الشيء «ذكياً» حين **يلاحظ ويقرّر ويتحسّن بالممارسة**. الآلة الحاسبة تتبع قواعد ثابتة، أما المساعد الذكي فيتعلّم من الأمثلة."),
    // Levels below follow lib/levels/ai.ts: Y1 Smart or Not · Y2 Giving
    // Instructions · Y3 Data All Around · Y4 Patterns & Predictions ·
    // Y5 How Machines Learn · Y6 Language & Vision · Y7 Prompting & AI Tools ·
    // Y9 Ethics & Safety.
    e(2, ["what is artificial intelligence", "what is ai", "ما هو الذكاء الاصطناعي"], "AI is teaching a computer to do things that usually need thinking — like telling a cat from a dog, or understanding what you said. It isn't magic, and it isn't alive.", "الذكاء الاصطناعي هو تعليم الحاسوب أداء مهام تحتاج تفكيراً عادةً — كتمييز قطة عن كلب، أو فهم ما قلته. ليس سحراً، وليس كائناً حيّاً."),
    e(3, ["what is data", "ما هي البيانات"], "Data is **information we can collect and count** — temperatures, photos, scores, clicks. AI needs lots of it, because it learns from examples rather than rules.", "البيانات **معلومات يمكن جمعها وعدّها** — درجات حرارة، صور، نتائج، نقرات. ويحتاج الذكاء الاصطناعي كثيراً منها لأنه يتعلّم من الأمثلة لا من القواعد."),
    e(5, ["what is machine learning", "how do machines learn", "تعلم الالة", "كيف تتعلم الالات"], "Instead of writing every rule, we **show the computer thousands of examples** and it works out the pattern itself. With labels that's *supervised* learning; without labels it groups things on its own (*unsupervised*); learning from rewards is *reinforcement*.", "بدل كتابة كل قاعدة، **نعرض على الحاسوب آلاف الأمثلة** فيستنتج النمط بنفسه. مع العناوين يُسمّى تعلّماً *موجّهاً*؛ وبلا عناوين يجمّع الأشياء ذاتياً (*غير موجّه*)؛ والتعلّم من المكافآت هو *التعزيز*."),
    e(5, ["what is training data", "بيانات التدريب"], "Training data is the set of examples a model learns from. If the examples are narrow or biased, the model will be too — which is why variety matters more than volume.", "بيانات التدريب هي مجموعة الأمثلة التي يتعلّم منها النموذج. وإن كانت ضيّقة أو منحازة، سيكون النموذج كذلك — لذا التنوّع أهم من الكمّ."),
    e(6, ["what is a neural network", "ما هي الشبكة العصبية"], "A neural network is layers of simple ‘neurons’ that pass signals forward. Training nudges the connections until the whole network maps inputs to the right outputs.", "الشبكة العصبية طبقات من «خلايا» بسيطة تمرّر الإشارات. يعدّل التدريب الوصلات حتى تربط الشبكة المدخلات بالمخرجات الصحيحة."),
    e(6, ["why do models hallucinate", "what is hallucination", "لماذا تهلوس النماذج", "الهلوسة"], "A language model predicts the **next likely word**, not the truth. When it has no good information it can still produce fluent, confident text that is simply wrong — that's a hallucination, and it's why you always check sources.", "نموذج اللغة يتنبّأ بـ**الكلمة التالية الأرجح**، لا بالحقيقة. وحين تنقصه المعلومة قد ينتج نصاً سلساً واثقاً لكنه خاطئ — وهذه هي الهلوسة، ولذا تتحقّق دائماً من المصادر."),
    e(7, ["what is a prompt", "how to write a good prompt", "ما هو الموجه", "كيف اكتب موجها"], "A prompt is the instruction you give an AI. Good ones say **who it should be, what you want, and in what form** — vague in, vague out.", "الموجّه هو التعليمة التي تعطيها للذكاء الاصطناعي. والجيّد منها يحدّد **من يكون، وماذا تريد، وبأي صيغة** — الغموض يورث غموضاً."),
    e(9, ["what is ai bias", "is ai fair", "تحيز الذكاء الاصطناعي"], "AI bias means the model learned an unfair pattern from unfair examples — like a system trained mostly on one group working badly for another. Fixing it starts with the data, not the code.", "تحيّز الذكاء الاصطناعي يعني أن النموذج تعلّم نمطاً غير عادل من أمثلة غير عادلة — كنظام دُرّب على فئة واحدة فأخطأ مع غيرها. وعلاجه يبدأ من البيانات لا من الشيفرة."),
  ],
  gaming: [
    // Levels follow lib/levels/gaming.ts: Y1 Play & Rules · Y2 Board & Story
    // Games · Y3 What Makes Games Fun · Y4 Level & World Design · Y5 Story &
    // Characters · Y6 Art & Sound · Y7 First Steps in Engines · Y8 Scripting
    // & Logic · Y9 Playtesting & Balance · Y10 Ship Your First Game.
    e(1, ["what makes a game fair", "why do we need rules", "ما الذي يجعل اللعبة عادلة", "لماذا نحتاج قواعد"], "A game is fair when **everyone knows the rules before you start and the same rule applies to all**. If a rule can be changed by whoever is winning, it stopped being a game.", "تكون اللعبة عادلة حين **يعرف الجميع القواعد قبل البدء وتُطبَّق القاعدة نفسها على الكل**. وإن كان من يفوز يستطيع تغيير القاعدة، فقد كفّت عن كونها لعبة."),
    e(2, ["how to write game rules", "what is a rulebook", "كيف أكتب قواعد لعبة", "دليل القواعد"], "Good rules answer four things in order: **how you win, how a turn works, what you may not do, and how the game ends**. The test: a friend plays correctly from your page alone, with you silent.", "القواعد الجيدة تجيب أربعة أمور بالترتيب: **كيف تفوز، وكيف يجري الدور، وما الممنوع، ومتى تنتهي اللعبة**. والاختبار: أن يلعب صديقك بشكل صحيح من ورقتك وحدها وأنت صامت."),
    e(3, ["what makes a game fun", "ما الذي يجعل اللعبة ممتعة"], "A game is fun when it has a **clear goal, fair rules, and choices that matter**, with quick feedback so you learn as you play.", "تكون اللعبة ممتعة حين يكون لها **هدف واضح وقواعد عادلة وخيارات مؤثّرة**، مع تغذية راجعة سريعة تتعلّم منها أثناء اللعب."),
    e(3, ["what is a meaningful choice", "ما هو الخيار ذو المعنى", "الخيارات المؤثرة"], "A choice is meaningful only when the options are **different and you can't have both** — speed or armour, gold or safety. If one option is always better, it isn't a choice, it's a trap.", "يكون الخيار ذا معنى فقط حين تكون البدائل **مختلفة ولا يمكنك الجمع بينها** — سرعة أو درع، ذهب أو أمان. وإن كان أحد البدائل أفضل دائماً، فهذا ليس خياراً بل فخّ."),
    e(4, ["what is a difficulty curve", "منحنى الصعوبة", "كيف تزداد صعوبة اللعبة"], "The difficulty curve is how hard the game gets from level 1 to the last. Raise it in **even steps** — step = (last − first) ÷ (levels − 1) — and put an easy level after each big fight so players can breathe.", "منحنى الصعوبة هو ازدياد صعوبة اللعبة من المرحلة الأولى إلى الأخيرة. ارفعه بـ**خطوات متساوية** — الخطوة = (الأخيرة − الأولى) ÷ (عدد المراحل − ١) — وضع مرحلة سهلة بعد كل معركة كبيرة ليلتقط اللاعبون أنفاسهم."),
    e(4, ["how do games teach without words", "كيف تعلّم الألعاب دون كلمات"], "By **shaping the space**: one safe room with one exit, a harmless first enemy, light or colour on the way out. The player learns the control because they needed it — not because a box told them.", "بـ**تشكيل المكان**: غرفة آمنة لها مخرج واحد، وعدوّ أول غير مؤذٍ، وضوء أو لون عند المخرج. يتعلّم اللاعب التحكّم لأنه احتاجه، لا لأن صندوقاً أخبره."),
    e(5, ["what is a branching story", "what are branching choices", "القصة المتفرعة", "الخيارات المتفرعة"], "In a branching story the player's choice changes what happens next. Keep branches few and let them **rejoin** — three real branches that meet again beat thirty you never finish writing.", "في القصة المتفرّعة يغيّر اختيار اللاعب ما يحدث بعده. أبقِ الفروع قليلة ودَعها **تلتقي ثانية** — ثلاثة فروع حقيقية تلتقي أفضل من ثلاثين لن تكمل كتابتها."),
    e(6, ["how does colour change a game", "what is art direction", "الإخراج الفني", "كيف يغيّر اللون اللعبة"], "Art direction is the **agreement** that keeps a game looking like one world: a small colour palette, one shape language, one sound family. Two games with identical rules feel completely different when the palette changes.", "الإخراج الفني هو **الاتفاق** الذي يُبقي اللعبة عالماً واحداً: لوحة ألوان صغيرة، ولغة أشكال واحدة، وعائلة أصوات واحدة. لعبتان بالقواعد نفسها تختلفان تماماً بتغيّر لوحة الألوان."),
    e(7, ["what is a game loop", "how do games work", "كيف تعمل الالعاب", "حلقة اللعبة"], "Games run a **loop** many times a second: **Input** (read the player) → **Update** (move things, check collisions, score) → **Draw** (show the frame). Fast enough, it looks like smooth motion.", "تدور الألعاب في **حلقة** عشرات المرّات في الثانية: **إدخال** (اقرأ اللاعب) ← **تحديث** (حرّك، افحص التصادم، النقاط) ← **رسم** (اعرض الإطار). بسرعة كافية تبدو حركة سلسة."),
    e(8, ["what is a variable in a game", "how does score work", "ما هو المتغير في اللعبة", "كيف تعمل النقاط"], "A variable is a **labelled box the game can change while it runs** — score, health, lives. The rule is separate from the box: ‘when the coin is touched, score = score + 1’.", "المتغيّر **صندوق مُعنوَن تستطيع اللعبة تغييره أثناء تشغيلها** — النقاط والصحة والأرواح. والقاعدة منفصلة عن الصندوق: «عند لمس العملة، النقاط = النقاط + ١»."),
    e(9, ["how do you playtest a game", "what is playtesting", "كيف أختبر لعبتي", "اختبار اللاعبين"], "Give a player your game and **say nothing**. Every time you want to explain, write that moment down — that's a design bug, not a player mistake. Watch where they hesitate; ask questions only after they finish.", "أعطِ لاعباً لعبتك و**لا تقل شيئاً**. وكلما رغبت في الشرح، دوّن تلك اللحظة — فهي خلل في التصميم لا خطأ من اللاعب. راقب أين يتردّد، ولا تسأل إلا بعد أن ينتهي."),
  ],
  entrepreneurship: [
    // Levels follow lib/levels/entrepreneurship.ts: Y1 Wants/Needs/Ideas ·
    // Y2 Money Basics · Y3 Spotting Problems · Y4 From Idea to Plan ·
    // Y5 Customers & Value · Y6 Business Models · Y7 MVP · Y8 Pitching ·
    // Y9 Growth & Marketing · Y10 Launch.
    e(1, ["what is a want", "want or need", "الرغبة والحاجة", "الفرق بين الرغبة والحاجة"], "A **need** is something you must have to live — water, food, shelter. A **want** is something you'd enjoy. Good business ideas usually solve a real need, or a want people feel strongly.", "**الحاجة** ما لا تعيش بدونه — ماء وطعام ومأوى. و**الرغبة** ما تستمتع به. والأفكار التجارية الجيدة تلبّي حاجة حقيقية أو رغبة قوية."),
    e(2, ["what is money for", "why do we use money", "لماذا نستخدم المال"], "Money is a **fair way to trade**. Instead of swapping a goat for bread, we agree on a price in money, so everyone can buy and sell easily.", "المال **طريقة عادلة للمقايضة**. بدل مبادلة ماعز بخبز، نتّفق على سعر بالمال، فيسهل على الجميع البيع والشراء."),
    // Profit belongs to Y2 "Money Basics", not Y5.
    e(2, ["what is profit", "ما هو الربح"], "Profit is what's left after costs: **Profit = Sales − Costs**. Sell lemonade for 10 and it costs you 6, your profit is 4 per cup. If costs beat sales, that's a loss.", "الربح ما يتبقّى بعد التكاليف: **الربح = المبيعات − التكاليف**. تبيع العصير بـ١٠ ويكلّفك ٦، فربحك ٤ للكوب. وإن زادت التكاليف فتلك خسارة."),
    // "From Idea to Plan" is Y4, so the business-plan answer belongs there.
    e(4, ["what is a business plan", "ما هي خطة العمل"], "A business plan answers four questions: **who's the customer, what problem you solve, how you make money, and what it costs to start**. It's a map before you spend.", "خطة العمل تجيب أربعة أسئلة: **من العميل، وأي مشكلة تحلّ، وكيف تربح، وكم تكلفة البدء**. إنها خريطة قبل الإنفاق."),
    e(5, ["who is the customer", "what is a customer segment", "من هو العميل", "الشريحة"], "A customer segment is a group of people who ‘hire’ your product for the **same job**. Students want cheap and fast; office workers want reliable. Same tea, different promise.", "شريحة العملاء مجموعة «يوظّفون» منتجك للمهمة **نفسها**. الطلاب يريدون الرخيص والسريع، والموظفون يريدون الموثوق. الشاي نفسه ووعد مختلف."),
    e(5, ["what is value", "value proposition", "ما هي القيمة", "وعد القيمة"], "Value is the benefit a customer gets minus what it costs them in money and effort. The best segment isn't the biggest — it's the one whose job is worth the most to them.", "القيمة هي المنفعة التي ينالها العميل مطروحاً منها ما يكلّفه من مال وجهد. وأفضل شريحة ليست الأكبر، بل من تساوي مهمتها عندهم الأكثر."),
    e(7, ["what is an mvp", "minimum viable product", "المنتج الاولي", "أبسط منتج"], "An MVP is the **smallest version you can build that still does the job** for one customer. Build it fast, show real people, and let their reaction — not your guess — decide what comes next.", "المنتج الأوّلي هو **أصغر نسخة تؤدّي المهمة** لعميل واحد. ابنِه بسرعة، واعرضه على أناس حقيقيين، ودَع ردّ فعلهم — لا تخمينك — يقرّر الخطوة التالية."),
  ],
  leadership: [
    // Levels follow lib/levels/leadership.ts: Y1 Being a Good Friend ·
    // Y2 Speaking & Listening · Y3 Working in Teams · Y4 Responsibility &
    // Trust · Y5 Decisions & Fairness · Y6 Motivating Others · Y7 Conflict
    // & Resolution · Y8 Leading Change · Y9 Ethics & Service · Y10 Your
    // Leadership Style.
    e(1, ["what is a good friend", "how to be a good friend", "كيف أكون صديقاً جيداً", "الصديق الجيد"], "A good friend **listens, is honest, and helps without being asked**. Leading starts here: people trust those who treat them well.", "الصديق الجيّد **يستمع ويصدق ويساعد دون أن يُطلب منه**. القيادة تبدأ هنا: يثق الناس بمن يعاملهم بلطف."),
    e(2, ["how to be a good listener", "what is listening", "كيف أصغي", "الإصغاء الجيد"], "Listening isn't waiting for your turn. **Look at the speaker, let them finish, then say back what you heard** — ‘so you mean…’. People follow whoever makes them feel heard.", "الإصغاء ليس انتظار دورك. **انظر إلى المتحدث، ودعه يكمل، ثم أعِد ما سمعته** — «تقصد أنّ…». يتبع الناس من يشعرهم بأنهم مسموعون."),
    e(3, ["what is teamwork", "how to work in a team", "ما هو العمل الجماعي", "العمل في فريق"], "A team works when **every person knows their one job and keeps their promise**. Divide the roles first, agree who finishes what by when, and count the win as the group's — not yours.", "ينجح الفريق حين **يعرف كل فرد مهمّته الواحدة ويفي بوعده**. وزّعوا الأدوار أولاً، واتفقوا من يُنجز ماذا ومتى، واعتبروا الفوز للمجموعة لا لك."),
    e(3, ["what is leadership", "what makes a good leader", "ما هي القيادة", "صفات القائد"], "Leadership is **helping a group reach a goal together**. Good leaders listen before deciding, share the credit, and stay calm when things go wrong.", "القيادة **مساعدة مجموعة على بلوغ هدف معاً**. القائد الجيّد يستمع قبل أن يقرّر، ويشارك الفضل، ويبقى هادئاً عند الشدائد."),
    e(4, ["what is trust", "how do you build trust", "ما هي الثقة", "كيف تُبنى الثقة"], "Trust is **earned in drops and lost in buckets**. Every small promise you keep adds a drop; one hidden mistake empties the bucket. That's why owning a mistake early costs less than covering it.", "الثقة **تُكسب قطرة قطرة وتُفقد دفعة واحدة**. كل وعد صغير تفي به يضيف قطرة، وخطأ واحد تخفيه يُفرغ الدلو. لذلك الاعتراف المبكر أرخص من التستّر."),
    e(4, ["what is responsibility", "ما هي المسؤولية"], "Responsibility means the task is **yours until it is done**, not until it gets hard. If you can't finish, you say so early enough for someone else to act — that's still responsible.", "المسؤولية أن تبقى المهمة **لك حتى تُنجز**، لا حتى تصعب. وإن عجزت عن إتمامها فأخبِر مبكراً بما يكفي ليتصرّف غيرك — وهذا مسؤولية أيضاً."),
    e(5, ["what is fairness", "what does fair mean", "ما هو العدل", "معنى الإنصاف"], "Fair does not always mean **equal**. Equal gives everyone the same; fair gives each what they need to have the same chance. A leader explains which one they chose, and why.", "العدل لا يعني دائماً **المساواة**. المساواة تعطي الجميع الشيء نفسه، والعدل يعطي كلاً ما يحتاجه ليحظى بالفرصة نفسها. والقائد يوضّح أيّهما اختار ولماذا."),
    e(5, ["what is voting", "how do groups decide", "ما هو التصويت", "كيف تقرر المجموعة"], "Groups decide three ways: **one person decides** (fast, risky), **a vote** (fair, but a losing half), or **consensus** (slow, but everyone carries it). Match the method to how much you need everyone's buy-in.", "تقرّر المجموعات بثلاث طرق: **قرار فرد** (سريع ومخاطر)، أو **تصويت** (منصف لكن يخسر نصف)، أو **توافق** (بطيء لكن يحمله الجميع). اختر الطريقة بحسب حاجتك إلى التزام الجميع."),
    e(6, ["how to motivate people", "what is motivation", "كيف أحفّز الآخرين", "ما هو التحفيز"], "You can order someone to attend; you cannot order them to care. **Praise the action, not the person** (‘you checked every row’ beats ‘you're smart’), make the goal visible, and share it — a goal split among people is a goal that moves.", "تستطيع أن تأمر أحداً بالحضور، ولا تستطيع أن تأمره بالاهتمام. **امدح الفعل لا الشخص** («راجعت كل صف» أفضل من «أنت ذكي»)، واجعل الهدف مرئياً، وقسّمه — الهدف الموزّع هدف يتحرّك."),
    e(7, ["how to solve a conflict", "what is conflict resolution", "كيف أحل خلافاً", "حل النزاع"], "Separate the **people** from the **problem**. Name the real issue out loud (‘we both want the last slot’), let each side say it once without interruption, then look for what you both actually need — that's usually smaller than what you're each demanding.", "افصل **الأشخاص** عن **المشكلة**. سمِّ القضية الحقيقية بصوت واضح («كلانا يريد الموعد الأخير»)، ودَع كل طرف يقولها مرّة دون مقاطعة، ثم ابحثا عمّا تحتاجانه فعلاً — وهو غالباً أصغر ممّا تطلبانه."),
    e(8, ["why do people resist change", "how to lead change", "لماذا يقاوم الناس التغيير", "قيادة التغيير"], "People rarely resist the change itself — they resist **losing something** (status, comfort, a routine that worked). So name the loss honestly, gather two or three allies first, and start with one **small win** people can see.", "نادراً ما يقاوم الناس التغيير ذاته، بل يقاومون **فقدان شيء** (مكانة أو راحة أو عادة كانت تنجح). فسمِّ الخسارة بصراحة، واجمع حليفين أو ثلاثة أولاً، وابدأ بـ**انتصار صغير** يراه الناس."),
    e(9, ["what is servant leadership", "ما هي القيادة الخادمة"], "Servant leadership flips the question from ‘what does the group owe me?’ to **‘what does the group need from me?’**. The test is simple: do the people you lead grow — more capable, more free — because you led them?", "تقلب القيادة الخادمة السؤال من «ماذا تدين لي المجموعة؟» إلى **«ماذا تحتاج مني المجموعة؟»**. والاختبار بسيط: هل ينمو من تقودهم — أقدر وأحرّ — لأنك قدتهم؟"),
  ],
  "problem-solving": [
    // Levels follow lib/levels/problem-solving.ts: Y1 Puzzles & Curiosity ·
    // Y2 Asking Good Questions · Y3 Step by Step · Y4 Creative Thinking ·
    // Y5 Logic & Clues · Y6 Systems & Loops · Y7 Deciding with Incomplete
    // Information · Y8 Experiments & Iteration · Y9 Solving Together ·
    // Y10 The Solver's Toolkit.
    e(2, ["what is a good question", "how to ask better questions", "السؤال الجيد", "كيف أسأل"], "A good question is **open and specific**: not ‘is this wrong?’ but ‘what exactly happens between step 2 and step 3?’ Questions that can be answered yes/no rarely teach you much.", "السؤال الجيّد **مفتوح ومحدّد**: ليس «هل هذا خطأ؟» بل «ما الذي يحدث تحديداً بين الخطوة ٢ والخطوة ٣؟». والأسئلة التي تُجاب بنعم/لا نادراً ما تعلّمك الكثير."),
    e(3, ["how do i solve a problem", "problem solving steps", "كيف احل مشكلة", "خطوات حل المشكلة"], "Four steps: **Understand** it in your own words → **Plan** a strategy → **Do** it step by step → **Check** the answer makes sense. If not, try another plan.", "أربع خطوات: **افهمها** بكلماتك ← **خطّط** لاستراتيجية ← **نفّذ** خطوة بخطوة ← **تحقّق** من منطقية الإجابة. وإن لم تكن، جرّب خطة أخرى."),
    // Decomposition belongs with "Step by Step" (Y3), not Y7.
    e(3, ["what is breaking down a problem", "decompose problem", "تجزئة المشكلة"], "Break a big problem into **smaller pieces you can solve one at a time**. Solve each piece, then combine — it turns ‘impossible’ into a list of ‘doable’.", "جزّئ المشكلة الكبيرة إلى **قطع أصغر تحلّها واحدة تلو الأخرى**. حُلّ كل قطعة ثم اجمعها — يحوّل «المستحيل» إلى قائمة «ممكن»."),
    e(6, ["what is a feedback loop", "what is a system", "حلقة التغذية الراجعة", "ما هو النظام"], "A system is parts that affect each other. In a **feedback loop** the output comes back as input — like a thermostat: too cold turns the heat on, warmth turns it off. Find the loop and you can change the behaviour.", "النظام أجزاء يؤثّر بعضها في بعض. وفي **حلقة التغذية الراجعة** يعود الناتج مُدخلاً — كمنظّم الحرارة: البرد يُشغّل التدفئة والدفء يُطفئها. اكتشف الحلقة تستطع تغيير السلوك."),
    e(7, ["what is expected value", "how do i decide without enough information", "القيمة المتوقعة", "كيف أقرر بمعلومات ناقصة"], "Weigh each outcome by **how likely** it is, not just how big: expected value = each result × its probability, all added. It's why a rare huge prize can still be a bad bet.", "زِن كل نتيجة بمقدار **احتماليتها** لا بحجمها فقط: القيمة المتوقّعة = كل نتيجة × احتمالها، ثم تُجمع. ولهذا قد تكون جائزة ضخمة نادرة رهاناً سيّئاً."),
    e(8, ["what is iteration", "trial and error", "التكرار", "التجريب"], "Iteration means trying a small version, seeing what happens, and improving — on purpose. The goal of the first attempt isn't to succeed, it's to **learn the fastest thing you didn't know**.", "التكرار أن تجرّب نسخة صغيرة، وترى ما يحدث، ثم تحسّن — عن قصد. وهدف المحاولة الأولى ليس النجاح، بل **أن تتعلّم أسرع ما كنت تجهله**."),
  ],
  "emotional-intelligence": [
    // Levels follow lib/levels/emotional-intelligence.ts: Y1 Naming Feelings ·
    // Y2 Calm & Kind · Y3 Understanding Others · Y4 Friendship Skills ·
    // Y5 Reading the Room · Y6 Stress & Resilience · Y7 Healthy Relationships ·
    // Y8 Motivation from Within · Y9 Emotional Courage · Y10 Living with Balance.
    e(1, ["what are feelings", "what is a feeling", "ما هي المشاعر"], "Feelings are **signals inside us** — happy, sad, angry, scared. Naming a feeling out loud already makes it easier to handle.", "المشاعر **إشارات بداخلنا** — فرح، حزن، غضب، خوف. مجرّد تسمية الشعور بصوت عالٍ يجعله أسهل."),
    e(2, ["how do i calm down", "what to do when angry", "كيف أهدأ", "ماذا أفعل عند الغضب"], "Anger is a wave — it rises and it falls. Slow your breath out longer than you breathe in, name what you feel (‘I'm angry because…’), and decide **after** the wave passes, not during it.", "الغضب موجة — ترتفع ثم تهبط. أطِل الزفير أكثر من الشهيق، وسمِّ شعورك («أنا غاضب لأن…»)، وقرّر **بعد** أن تمرّ الموجة لا أثناءها."),
    // "Understanding Others" is Y3, so empathy belongs there — not Y4.
    e(3, ["what is empathy", "what is emotional intelligence", "ما هو التعاطف", "الذكاء العاطفي"], "Empathy is **noticing and understanding how someone else feels**. First read the clues — face, voice, words — then imagine their feeling. It's the heart of emotional intelligence, and it doesn't mean you have to agree.", "التعاطف **ملاحظة وفهم شعور الآخر**. اقرأ الإشارات — الوجه، النبرة، الكلمات — ثم تخيّل شعوره. إنه قلب الذكاء العاطفي، ولا يعني أن توافق بالضرورة."),
    e(4, ["how do i say sorry", "what is a real apology", "كيف أعتذر", "الاعتذار الحقيقي"], "A real apology has three parts: **name what you did** (not ‘if you were hurt’), **say why it mattered**, and **ask what would help**. ‘Sorry but…’ cancels the sorry.", "الاعتذار الحقيقي ثلاثة أجزاء: **سمِّ ما فعلته** (لا «إن كنت قد جُرحت»)، و**قل لماذا كان مؤذياً**، و**اسأل ما الذي يساعد**. و«آسف لكن…» تُلغي الاعتذار."),
    e(6, ["what is stress", "how to handle stress", "ما هو التوتر", "كيف أتعامل مع التوتر"], "Stress is your body getting ready for a challenge — useful in small doses, harmful when it never switches off. Sleep, movement, and naming the worry out loud are what actually lower it.", "التوتر استعداد جسدك لتحدٍّ — مفيد بجرعات صغيرة، ضارّ حين لا ينطفئ. والنوم والحركة وتسمية القلق بصوت عالٍ هي ما يخفّضه فعلاً."),
  ],
  languages: [
    // Levels follow lib/levels/languages.ts: Y1 Sounds & First Words ·
    // Y2 Everyday Phrases · Y3 Your First 500 Words · Y4 Grammar Without Fear ·
    // Y5 Speaking with Confidence · Y6 Reading for Meaning · Y7 Writing Clearly ·
    // Y8 Culture & Expression · Y9 Thinking in a New Language · Y10 Fluency.
    e(1, ["how do i learn a language", "how to learn new language", "كيف اتعلم لغة"], "The fastest way is **a little, every day, out loud**. Listening and copying sounds comes before rules — babies learn a language years before they learn any grammar.", "أسرع طريقة هي **القليل، كل يوم، بصوت مسموع**. والاستماع وتقليد الأصوات يسبق القواعد — فالأطفال يتعلّمون اللغة قبل سنوات من تعلّم أي قاعدة."),
    // The vocabulary method (spaced repetition) is Y3 "Your First 500 Words".
    // Triggers are short distinctive SUBSTRINGS, not full phrasings — "how to
    // remember words" would miss "how do I remember words?".
    e(3, ["remember words", "memorise words", "memorize words", "learn new words", "أحفظ الكلمات", "أتعلم كلمات", "حفظ الكلمات"], "Learn words in **small groups tied to pictures**, say them **out loud**, and use each in a sentence the same day. Then review on a spacing schedule — after 1, 3, 7 and 30 days — so you revisit each word just before you'd forget it.", "تعلّم الكلمات في **مجموعات صغيرة مرتبطة بصور**، وانطقها **بصوت عالٍ**، واستخدم كلّاً في جملة في اليوم نفسه. ثم راجِع بجدول متباعد — بعد ١ و٣ و٧ و٣٠ يوماً — لتعود إلى الكلمة قبيل أن تنساها."),
    e(3, ["what are high frequency words", "الكلمات الأكثر تكرارا"], "A small core of words does most of the work: the commonest ~1000 words cover roughly **85% of everyday conversation**. Learn those first — they buy you the most understanding per word.", "نواة صغيرة من الكلمات تؤدّي معظم العمل: أشيع ١٠٠٠ كلمة تغطّي نحو **٨٥٪ من الحديث اليومي**. تعلّمها أولاً — فهي تمنحك أكبر فهم مقابل كل كلمة."),
    e(4, ["do i need grammar", "why is grammar hard", "هل أحتاج القواعد", "لماذا القواعد صعبة"], "Grammar is the **pattern behind sentences you already say**, not a list to memorise first. Learn phrases, notice the pattern, then name it — that order makes grammar feel obvious instead of frightening.", "القواعد هي **النمط خلف جمل تقولها أصلاً**، لا قائمة تُحفظ أولاً. تعلّم العبارات، ولاحظ النمط، ثم سمِّه — هذا الترتيب يجعل القواعد بديهية بدل أن تكون مخيفة."),
    e(5, ["im afraid to speak", "how to speak confidently", "أخاف أن أتحدث", "كيف أتحدث بثقة"], "Mistakes are how speaking gets built — people understand you long before your grammar is correct. Speak slowly, use the words you have, and treat every correction as a free lesson.", "الأخطاء هي ما يُبنى به التحدّث — يفهمك الناس قبل أن تصحّ قواعدك بوقت طويل. تحدّث ببطء، واستخدم ما لديك من كلمات، واعتبر كل تصحيح درساً مجانياً."),
    e(9, ["how do i think in another language", "التفكير باللغة"], "You start thinking in a language when you stop translating. Practise by naming things around you directly in the new language, and by talking to yourself about simple daily plans.", "تبدأ التفكير بلغة حين تتوقّف عن الترجمة. تدرّب بتسمية ما حولك مباشرةً باللغة الجديدة، وبالحديث مع نفسك عن خططك اليومية البسيطة."),
  ],
};

// Filler words that carry no topic meaning — ignored when matching so that
// "how do I remember words?" still matches a "remember words" trigger.
const STOP = new Set([
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "i", "you", "we", "my", "me",
  "to", "of", "in", "on", "for", "it", "its", "this", "that", "what", "whats", "how", "why", "when",
  "can", "could", "should", "would", "please", "tell", "explain", "about", "and", "or", "some",
  "ما", "هو", "هي", "ماذا", "كيف", "لماذا", "هل", "من", "في", "على", "عن", "إلى", "الى", "أن", "ان", "لي", "لك",
]);

const contentTokens = (s: string): string[] =>
  normalizeQuestion(s).split(" ").filter((w) => w.length > 1 && !STOP.has(w));

/**
 * A trigger matches when it appears as a substring OR when all of its content
 * words are present in the question. The token path makes matching robust to
 * phrasing ("how to remember words" vs "how do I remember words?").
 */
function triggerMatches(normalizedQuestion: string, trigger: string): boolean {
  if (normalizedQuestion.includes(normalizeQuestion(trigger))) return true;
  const tt = contentTokens(trigger);
  if (tt.length === 0) return false;
  const qt = new Set(contentTokens(normalizedQuestion));
  return tt.every((t) => qt.has(t));
}

/**
 * Find a baked answer for a learner on `level`. Only returns content pitched at
 * or below their year (so Year 1 never gets a Year 7 answer). Among allowed
 * matches, the most advanced one wins. Returns null → the caller falls back to
 * the live AI.
 */
export function findKnowledge(subject: string, level: number, lang: "en" | "ar", question: string): string | null {
  const bank = BANK[subject];
  if (!bank) return null;
  const n = normalizeQuestion(question);
  if (n.length < 3) return null;
  let best: KEntry | null = null;
  for (const entry of bank) {
    if (entry.level > level) continue; // gate: above the learner's year
    if (entry.triggers.some((tr) => triggerMatches(n, tr))) {
      if (!best || entry.level > best.level) best = entry;
    }
  }
  return best ? best.answer[lang] : null;
}

/**
 * Does a baked answer exist ONLY above the learner's level? Used to give a kind
 * "that's coming later" nudge instead of a paid call, unless they insist.
 */
export function findAdvancedOnly(subject: string, level: number, question: string): number | null {
  const bank = BANK[subject];
  if (!bank) return null;
  const n = normalizeQuestion(question);
  let hi: number | null = null;
  for (const entry of bank) {
    if (entry.triggers.some((tr) => triggerMatches(n, tr))) {
      if (entry.level > level && (hi === null || entry.level < hi)) hi = entry.level;
    }
  }
  return hi;
}
