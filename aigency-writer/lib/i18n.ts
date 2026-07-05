/** UI strings — the interface itself is bilingual with full RTL support. */

export type UILang = "en" | "ar";

export const STRINGS = {
  appName: { en: "Qalam", ar: "قَلَم" },
  appTagline: {
    en: "The Aigency bilingual writer — Arabic-native, English-native, always learning.",
    ar: "كاتب Aigency ثنائي اللغة — عربي الأصل، إنجليزي الطلاقة، يتعلّم كل يوم.",
  },
  tabTasks: { en: "Tasks", ar: "المهام" },
  tabStudio: { en: "Studio", ar: "الاستوديو" },
  tabTraining: { en: "Daily Practice", ar: "التمرين اليومي" },
  tabBrain: { en: "Agent Brain", ar: "عقل الوكيل" },
  tabProfile: { en: "Client Profiles", ar: "ملفات العملاء" },
  liveAI: { en: "Live AI", ar: "ذكاء حي" },
  demoAI: { en: "Demo AI", ar: "وضع تجريبي" },
  modeLabel: { en: "Expert mode", ar: "وضع الخبرة" },
  outputLang: { en: "Output language", ar: "لغة المخرجات" },
  arabicOnly: { en: "Arabic", ar: "العربية" },
  englishOnly: { en: "English", ar: "الإنجليزية" },
  bothLangs: { en: "Both", ar: "اللغتان" },
  dialect: { en: "Arabic register", ar: "السجل العربي" },
  write: { en: "Write", ar: "اكتب" },
  writing: { en: "Writing…", ar: "يكتب…" },
  stop: { en: "Stop", ar: "إيقاف" },
  copy: { en: "Copy", ar: "نسخ" },
  copied: { en: "Copied", ar: "نُسخ" },
  feedbackPrompt: {
    en: "Rate this — your feedback becomes a permanent lesson.",
    ar: "قيّم هذا العمل — ملاحظتك تتحول إلى درس دائم.",
  },
  feedbackPlaceholder: {
    en: "What should change? e.g. 'Too formal for social — loosen the Arabic.'",
    ar: "ما الذي يجب أن يتغير؟ مثال: «النبرة رسمية زيادة على السوشيال — خفّف الفصحى.»",
  },
  sendFeedback: { en: "Teach the agent", ar: "علّم الوكيل" },
  feedbackSaved: {
    en: "Lesson learned and added to the brain.",
    ar: "تم استخلاص الدرس وإضافته إلى العقل.",
  },
  trainingTitle: { en: "Today's practice session", ar: "جلسة اليوم التدريبية" },
  trainingIntro: {
    en: "Six real-life drills · ~30 minutes · 3 in Arabic, 3 in English, all different tasks. Run each drill, review the work, and coach the agent — your corrections are baked into its brain.",
    ar: "ستة تمارين واقعية · حوالي ٣٠ دقيقة · ٣ بالعربية و٣ بالإنجليزية بمهام مختلفة. شغّل كل تمرين، راجع العمل، ودرّب الوكيل — تصحيحاتك تُحفر في عقله.",
  },
  runDrill: { en: "Run drill", ar: "شغّل التمرين" },
  running: { en: "Running…", ar: "قيد التنفيذ…" },
  coachPlaceholder: {
    en: "Coach's correction… e.g. 'The Gulf dialect slipped into Egyptian in line 2.'",
    ar: "تصحيح المدرب… مثال: «اللهجة الخليجية انزلقت إلى المصرية في السطر الثاني.»",
  },
  approve: { en: "Approve", ar: "اعتماد" },
  correct: { en: "Correct & teach", ar: "صحّح وعلّم" },
  minutes: { en: "min", ar: "د" },
  brainTitle: { en: "Inside the agent's brain", ar: "داخل عقل الوكيل" },
  brainIntro: {
    en: "Everything the agent has learned: baked-in coaching, distilled feedback, training corrections, and its own daily research. Export the brain as code to make runtime learnings permanent.",
    ar: "كل ما تعلّمه الوكيل: تدريب مُدمج، ودروس مستخلصة من الملاحظات، وتصحيحات التمارين، وأبحاثه اليومية. صدّر العقل ككود لتثبيت ما تعلّمه.",
  },
  lessons: { en: "Learned lessons", ar: "الدروس المكتسبة" },
  insights: { en: "Research insights", ar: "خلاصات البحث" },
  runResearch: { en: "Run research now", ar: "ابدأ البحث الآن" },
  researching: { en: "Researching…", ar: "يبحث…" },
  exportBrain: { en: "Export brain as code", ar: "تصدير العقل ككود" },
  lastResearch: { en: "Last research", ar: "آخر بحث" },
  never: { en: "never (runs daily at 06:00 UTC)", ar: "لم يجرِ بعد (يعمل يوميًا ٠٦:٠٠ UTC)" },
  profileTitle: { en: "Client brand profile", ar: "الملف الصوتي للعميل" },
  profileIntro: {
    en: "Tailor the agent per client: voice, dialect, locked glossary, red lines. The active profile shapes every word the agent writes.",
    ar: "خصّص الوكيل لكل عميل: النبرة، اللهجة، المعجم المعتمد، الخطوط الحمراء. الملف النشط يشكّل كل كلمة يكتبها الوكيل.",
  },
  save: { en: "Save profile", ar: "حفظ الملف" },
  saved: { en: "Saved", ar: "تم الحفظ" },
  tasksTitle: { en: "Agent task board", ar: "لوحة مهام الوكيل" },
  tasksIntro: {
    en: "Delegate work like you would to a writer on staff: assign a task, the agent executes it, you review — approve it or send it back with notes. Every change request also becomes a permanent lesson in its brain.",
    ar: "فوّض العمل كما تفوّضه لكاتب في فريقك: أسند المهمة، ينفّذها الوكيل، وتراجعها أنت — اعتمدها أو أعدها بملاحظات. وكل طلب تعديل يتحول أيضًا إلى درس دائم في عقله.",
  },
  newTask: { en: "Assign a new task", ar: "إسناد مهمة جديدة" },
  taskTitleLabel: { en: "Task title (optional)", ar: "عنوان المهمة (اختياري)" },
  taskBriefLabel: { en: "The brief", ar: "موجز المهمة" },
  taskBriefPlaceholder: {
    en: "What do you need? Audience, goal, format, length, anything the writer should know…",
    ar: "ما المطلوب؟ الجمهور، الهدف، الصيغة، الطول، وأي شيء يجب أن يعرفه الكاتب…",
  },
  priorityLabel: { en: "Priority", ar: "الأولوية" },
  priorityLow: { en: "Low", ar: "منخفضة" },
  priorityNormal: { en: "Normal", ar: "عادية" },
  priorityHigh: { en: "High", ar: "عالية" },
  dueLabel: { en: "Due date (optional)", ar: "تاريخ التسليم (اختياري)" },
  assignTask: { en: "Assign to agent", ar: "أسند إلى الوكيل" },
  statusQueued: { en: "Queued", ar: "في الانتظار" },
  statusRunning: { en: "Agent working…", ar: "الوكيل يعمل…" },
  statusReview: { en: "For your review", ar: "بانتظار مراجعتك" },
  statusApproved: { en: "Approved", ar: "معتمدة" },
  statusArchived: { en: "Archived", ar: "مؤرشفة" },
  approveTask: { en: "Approve", ar: "اعتماد" },
  requestChanges: { en: "Request changes", ar: "طلب تعديلات" },
  revisionPlaceholder: {
    en: "What must change? The agent will revise AND learn this permanently…",
    ar: "ما الذي يجب تغييره؟ سيعدّل الوكيل وسيتعلم هذا بشكل دائم…",
  },
  runNow: { en: "Run now", ar: "نفّذ الآن" },
  retry: { en: "Retry", ar: "أعد المحاولة" },
  archiveTask: { en: "Archive", ar: "أرشفة" },
  noTasks: {
    en: "No tasks yet — assign the first one above.",
    ar: "لا مهام بعد — أسند المهمة الأولى من الأعلى.",
  },
  revisionRound: { en: "Revision round", ar: "جولة تعديل" },
  previousDrafts: { en: "Earlier drafts", ar: "مسودات سابقة" },
  playful: { en: "Playful", ar: "مرح" },
  formal: { en: "Formal", ar: "رسمي" },
  poetic: { en: "Poetic", ar: "شاعري" },
  direct: { en: "Direct", ar: "مباشر" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: UILang): string {
  return STRINGS[key][lang];
}
