import type { Level } from "../curriculum";

export const AI_LEVELS: Level[] = [
  {
    n: 1,
    title: { en: "Smart or Not?", ar: "ذكي أم لا؟" },
    focus: {
      en: "What does it mean for a machine to be 'smart'? Spotting the helpers around us — voice assistants, translators, recommendations — and what they can and can't do.",
      ar: "ماذا يعني أن تكون الآلة «ذكية»؟ نكتشف المساعدين من حولنا — المساعدات الصوتية والمترجمات والاقتراحات — وما تستطيع فعله وما لا تستطيع.",
    },
    units: [
      { en: "Machines That Help", ar: "آلات تساعدنا" },
      { en: "Smart vs. Programmed", ar: "ذكي أم مبرمج؟" },
      { en: "AI Around the House", ar: "الذكاء الاصطناعي في البيت" },
      { en: "What AI Can't Do", ar: "ما لا يستطيعه الذكاء الاصطناعي" },
    ],
  },
  {
    n: 2,
    title: { en: "Giving Instructions", ar: "إعطاء التعليمات" },
    focus: {
      en: "Algorithms as recipes: exact step-by-step instructions, why order matters, and debugging when the robot does exactly what you said — not what you meant.",
      ar: "الخوارزميات كوصفات طبخ: تعليمات دقيقة خطوة بخطوة، ولماذا يهم الترتيب، وتصحيح الأخطاء حين ينفّذ الروبوت ما قلته حرفياً — لا ما قصدته.",
    },
    units: [
      { en: "Recipes & Algorithms", ar: "الوصفات والخوارزميات" },
      { en: "Order Matters", ar: "الترتيب مهم" },
      { en: "Loops & Repeats", ar: "الحلقات والتكرار" },
      { en: "Finding the Bug", ar: "اكتشاف الخطأ" },
    ],
  },
  {
    n: 3,
    title: { en: "Data All Around", ar: "البيانات من حولنا" },
    focus: {
      en: "Everything can be counted: collecting data, sorting it into groups, drawing simple charts, and telling honest stories with numbers.",
      ar: "كل شيء يمكن عدّه: جمع البيانات، وتصنيفها في مجموعات، ورسم مخططات بسيطة، ورواية قصص صادقة بالأرقام.",
    },
    units: [
      { en: "Collecting Data", ar: "جمع البيانات" },
      { en: "Sorting & Grouping", ar: "التصنيف والتجميع" },
      { en: "Charts That Tell Stories", ar: "مخططات تروي قصصاً" },
      { en: "When Numbers Mislead", ar: "حين تُضلّل الأرقام" },
    ],
  },
  {
    n: 4,
    title: { en: "Patterns & Predictions", ar: "الأنماط والتنبؤات" },
    focus: {
      en: "The heart of machine learning without the math: finding patterns in examples and using them to guess what comes next — and measuring how often we're wrong.",
      ar: "جوهر تعلّم الآلة دون رياضيات معقدة: اكتشاف الأنماط في الأمثلة واستخدامها لتوقّع ما يأتي — وقياس عدد المرات التي نخطئ فيها.",
    },
    units: [
      { en: "Spotting Patterns", ar: "اكتشاف الأنماط" },
      { en: "Predicting from Examples", ar: "التنبؤ من الأمثلة" },
      { en: "Training & Testing", ar: "التدريب والاختبار" },
      { en: "How Wrong Are We?", ar: "كم نخطئ؟" },
    ],
  },
  {
    n: 5,
    title: { en: "How Machines Learn", ar: "كيف تتعلّم الآلات" },
    focus: {
      en: "Supervised, unsupervised and reinforcement learning through games and stories — teaching a computer to recognise cats without ever defining 'cat'.",
      ar: "التعلّم الموجّه وغير الموجّه والتعلّم بالتعزيز عبر الألعاب والقصص — نعلّم الحاسوب تمييز القطط دون أن نعرّف «القطة» أبداً.",
    },
    units: [
      { en: "Learning from Labels", ar: "التعلّم من العناوين" },
      { en: "Finding Groups Alone", ar: "اكتشاف المجموعات ذاتياً" },
      { en: "Learning by Reward", ar: "التعلّم بالمكافأة" },
      { en: "Features & Examples", ar: "السمات والأمثلة" },
    ],
  },
  {
    n: 6,
    title: { en: "Language & Vision", ar: "اللغة والرؤية" },
    focus: {
      en: "How models read, write and see: tokens and predictions in language models, pixels and features in computer vision — and why Arabic is a fascinating test case.",
      ar: "كيف تقرأ النماذج وتكتب وترى: الرموز والتنبؤ في نماذج اللغة، والبكسلات والسمات في الرؤية الحاسوبية — ولماذا تُعدّ العربية حالة اختبار مثيرة.",
    },
    units: [
      { en: "How Language Models Work", ar: "كيف تعمل نماذج اللغة" },
      { en: "Computer Vision", ar: "الرؤية الحاسوبية" },
      { en: "Arabic & AI", ar: "العربية والذكاء الاصطناعي" },
      { en: "When Models Hallucinate", ar: "حين تهلوس النماذج" },
    ],
  },
  {
    n: 7,
    title: { en: "Prompting & AI Tools", ar: "الموجّهات وأدوات الذكاء الاصطناعي" },
    focus: {
      en: "Working with AI as a craft: clear prompts, iteration, verification, and combining tools — using AI to study, create and build without letting it think for you.",
      ar: "العمل مع الذكاء الاصطناعي كحِرفة: موجّهات واضحة، وتكرار، وتحقّق، ودمج الأدوات — استخدامه للدراسة والإبداع والبناء دون أن يفكّر نيابة عنك.",
    },
    units: [
      { en: "Writing Clear Prompts", ar: "كتابة موجّهات واضحة" },
      { en: "Iterate & Refine", ar: "كرّر وحسّن" },
      { en: "Verify Everything", ar: "تحقّق من كل شيء" },
      { en: "AI as a Study Partner", ar: "الذكاء الاصطناعي رفيق دراسة" },
    ],
  },
  {
    n: 8,
    title: { en: "Building AI Projects", ar: "بناء مشاريع الذكاء الاصطناعي" },
    focus: {
      en: "From idea to working demo: scoping a problem, choosing data, building with APIs and no-code tools, and shipping a real AI project of your own.",
      ar: "من الفكرة إلى نموذج يعمل: تحديد المشكلة، واختيار البيانات، والبناء بواجهات برمجية وأدوات دون كود، وإطلاق مشروع ذكاء اصطناعي حقيقي خاص بك.",
    },
    units: [
      { en: "Scoping a Problem", ar: "تحديد نطاق المشكلة" },
      { en: "Data for Your Project", ar: "بيانات مشروعك" },
      { en: "APIs & No-Code Tools", ar: "الواجهات البرمجية والأدوات دون كود" },
      { en: "Ship Your Demo", ar: "أطلق نموذجك" },
    ],
  },
  {
    n: 9,
    title: { en: "Ethics & Safety", ar: "الأخلاقيات والسلامة" },
    focus: {
      en: "Bias in data, privacy, deepfakes, and jobs: the questions your generation will answer — with case studies from our region and the wider world.",
      ar: "التحيّز في البيانات، والخصوصية، والتزييف العميق، والوظائف: أسئلة سيجيب عنها جيلك — مع دراسات حالة من منطقتنا والعالم.",
    },
    units: [
      { en: "Bias & Fairness", ar: "التحيّز والإنصاف" },
      { en: "Privacy & Data Rights", ar: "الخصوصية وحقوق البيانات" },
      { en: "Deepfakes & Truth", ar: "التزييف العميق والحقيقة" },
      { en: "AI & the Future of Work", ar: "الذكاء الاصطناعي ومستقبل العمل" },
    ],
  },
  {
    n: 10,
    title: { en: "Frontier AI & Your Future", ar: "حدود الذكاء الاصطناعي ومستقبلك" },
    focus: {
      en: "Agents, reasoning models and what's next; national AI strategies in our region; and a capstone: design an AI product that serves your community.",
      ar: "الوكلاء ونماذج الاستدلال وما هو قادم؛ والاستراتيجيات الوطنية للذكاء الاصطناعي في منطقتنا؛ ومشروع ختامي: صمّم منتج ذكاء اصطناعي يخدم مجتمعك.",
    },
    units: [
      { en: "Agents & Reasoning", ar: "الوكلاء والاستدلال" },
      { en: "Our Region's AI Strategies", ar: "استراتيجيات منطقتنا" },
      { en: "Careers in AI", ar: "مسارات مهنية في الذكاء الاصطناعي" },
      { en: "Capstone: AI for Your Community", ar: "المشروع الختامي: ذكاء اصطناعي لمجتمعك" },
    ],
  },
];
