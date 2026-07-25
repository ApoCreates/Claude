"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePrefs, type Plan } from "@/lib/prefs";
import { SUBJECTS } from "@/lib/curriculum";
import { checkAdmin, ADMIN_USER } from "@/lib/admin";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SunMark } from "@/components/SunMark";
import clsx from "clsx";

const SESSION_KEY = "wadehai:admin";

// The founder console — device-local stats and controls.
export default function AdminPage() {
  const { lang, plan, xp, streakDays, bestSprint, passed, review, setPlan, setTourDone, reset } = usePrefs();
  const ar = lang === "ar";

  const [authed, setAuthed] = useState(false);
  const [checkedSession, setCheckedSession] = useState(false);
  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === "1");
    setCheckedSession(true);
  }, []);

  const login = async () => {
    if (await checkAdmin(user, pw)) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPw("");
  };

  const masteredTotal = Object.values(passed).reduce((n, arr) => n + arr.length, 0);

  if (!checkedSession) return null;

  if (!authed) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="card w-full max-w-md p-8">
          <div className="mb-6 flex items-center gap-4">
            <SunMark size={40} />
            <div>
              <p className="font-serif text-2xl">{ar ? "وحدة تحكم المؤسس" : "Founder console"}</p>
              <p className="eyebrow mt-1">WADEHAI · ADMIN</p>
            </div>
          </div>
          <label className="mb-3 block">
            <span className="eyebrow">{ar ? "المستخدم" : "USERNAME"}</span>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
              className="mt-1 w-full border border-hairline bg-ink px-4 py-3 text-sm outline-none focus:border-marigold/70"
            />
          </label>
          <label className="mb-5 block">
            <span className="eyebrow">{ar ? "كلمة السر" : "PASSWORD"}</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              autoComplete="current-password"
              className="mt-1 w-full border border-hairline bg-ink px-4 py-3 text-sm outline-none focus:border-marigold/70"
            />
          </label>
          {error && <p className="mb-4 text-sm text-dusk">{ar ? "بيانات غير صحيحة." : "Wrong credentials."}</p>}
          <button onClick={login} className="btn-primary w-full">
            {ar ? "دخول" : "Sign in"}
          </button>
          <p className="mt-4 text-xs text-mute-light">
            {ar
              ? `المستخدم: ${ADMIN_USER} — كلمة السر أُرسلت إليك بشكل خاص.`
              : `Username: ${ADMIN_USER} — the password was sent to you privately.`}
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow-accent mb-2">WADEHAI · ADMIN</p>
            <h1 className="font-serif text-5xl">{ar ? "وحدة تحكم المؤسس" : "Founder console"}</h1>
          </div>
          <button onClick={logout} className="btn-ghost shrink-0">
            {ar ? "خروج" : "Sign out"}
          </button>
        </div>
        <p className="mt-3 max-w-xl text-sm text-mute-light">
          {ar
            ? "لوحة محلية على هذا الجهاز: إحصاءات هذا المتعلم وأدوات تجريبية. لوحة جميع المستخدمين تأتي مع الخادم."
            : "Device-local console: this learner's stats and demo controls. The all-users dashboard arrives with the backend."}
        </p>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 border border-hairline sm:grid-cols-5">
          {[
            [xp, ar ? "أشعة" : "RAYS"],
            [streakDays, ar ? "مواظبة" : "STREAK"],
            [masteredTotal, ar ? "سنوات مُتقنة" : "YEARS MASTERED"],
            [bestSprint, ar ? "أفضل سباق" : "BEST SPRINT"],
            [review.length, ar ? "للمراجعة" : "IN REVIEW"],
          ].map(([v, label], i) => (
            <div key={String(label)} className={clsx("p-5", i > 0 && "border-s border-hairline")}>
              <p className="font-serif text-3xl text-marigold">{v as number}</p>
              <p className="eyebrow mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Mastery per subject */}
        <div className="card mt-8 p-6">
          <p className="eyebrow-accent mb-4">{ar ? "الإتقان حسب المادة" : "MASTERY BY SUBJECT"}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SUBJECTS.map((s) => {
              const n = (passed[s.slug] ?? []).length;
              return (
                <div key={s.slug} className="flex items-center justify-between gap-3 border-t border-hairline py-2">
                  <span className="text-sm">{s.name[lang]}</span>
                  <span className="font-mono text-[11px] text-mute-light">{n}/10</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="card mt-8 p-6">
          <p className="eyebrow-accent mb-4">{ar ? "أدوات" : "CONTROLS"}</p>
          <div className="flex flex-wrap items-center gap-3">
            {(["free", "scholar", "family"] as Plan[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={clsx("btn", plan === p ? "bg-marigold text-ink" : "border border-hairline-strong text-paper hover:border-marigold/70")}
              >
                {ar ? "خطة:" : "Plan:"} {p}
              </button>
            ))}
            <button onClick={() => setTourDone(false)} className="btn-ghost">
              {ar ? "إعادة تشغيل الجولة" : "Replay tour"}
            </button>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} className="btn border border-dusk text-dusk hover:bg-dusk/10">
                {ar ? "تصفير بيانات الجهاز" : "Reset device data"}
              </button>
            ) : (
              <button
                onClick={() => {
                  reset();
                  setConfirmReset(false);
                }}
                className="btn bg-dusk text-ink"
              >
                {ar ? "تأكيد التصفير — لا تراجع" : "Confirm reset — no undo"}
              </button>
            )}
          </div>
        </div>

        {/* Moderation — where the tutor's silent safety flags arrive */}
        <div className="card mt-8 p-6">
          <p className="eyebrow-accent mb-4">{ar ? "السلامة والإشراف" : "SAFETY & MODERATION"}</p>
          <p className="text-sm leading-relaxed text-mute-light">
            {ar
              ? "كل رسالة إلى المعلّم تُفحص على الخادم. المحاولات المشبوهة (عنف، مخدرات، إيذاء النفس، محتوى جنسي، كراهية، اختراق، أو محاولات التحايل على القواعد) تُحظر بلطف ويُبلَّغ عنها بصمت — دون إعلام المستخدم — مع هوية الجهاز والوقت ونوع المحاولة ومقتطف من الرسالة."
              : "Every tutor message is screened on the server. Suspicious attempts (violence, drugs, self-harm, sexual content, hate, hacking, or tries to talk the tutor out of its rules) are gently blocked and reported silently — the user is never told — with the device id, UTC time, category, and a short excerpt."}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-mute-light">
            <li className="border-t border-hairline pt-2">
              <span className="font-mono text-[11px] text-marigold">WADEH_FLAG</span>{" "}
              {ar
                ? "— ابحث عن هذه العلامة في سجلات Vercel (المشروع ← Logs) لرؤية كل البلاغات."
                : "— filter the Vercel logs (Project → Logs) for this marker to see every report."}
            </li>
            <li className="border-t border-hairline pt-2">
              <span className="font-mono text-[11px] text-marigold">MODERATION_WEBHOOK_URL</span>{" "}
              {ar
                ? "— أضف هذا المتغير في إعدادات Vercel ليصل كل بلاغ فوراً كـ JSON إلى Slack أو Discord أو بريدك."
                : "— set this env var in Vercel to receive every report instantly as JSON in Slack, Discord, or e-mail."}
            </li>
          </ul>
        </div>

        {/* Cost controls — how the tutor stays cheap */}
        <div className="card mt-8 p-6">
          <p className="eyebrow-accent mb-4">{ar ? "التكلفة والميزانية" : "COST & BUDGET"}</p>
          <p className="text-sm leading-relaxed text-mute-light">
            {ar
              ? "المعلّم يجيب أولًا من داخل المنصّة: مكتبة أسئلة شائعة + ذاكرة للإجابات السابقة (بلا تكلفة). لا يُستدعى المفتاح المدفوع إلا عند عدم إيجاد إجابة جاهزة، ويستخدم عندها أرخص نموذج قادر (Haiku) بإجابة قصيرة — جزء من السنت للطلب الواحد."
              : "The tutor answers from inside the app first — a library of common questions plus a memory of past answers (both free). The paid key is called only when no ready answer exists, and then uses the cheapest capable model (Haiku) with a short answer window — a fraction of a cent per call."}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-mute-light">
            <li className="border-t border-hairline pt-2">
              <span className="font-mono text-[11px] text-marigold">MONTHLY_BUDGET_USD</span>{" "}
              {ar
                ? "— الحدّ الشهري (افتراضيًا 10$). عند تجاوزه يواصل المعلّم العمل من المحرّك المحلي بلا تكلفة."
                : "— the soft monthly cap (defaults to $10). Past it, the tutor keeps working from the local engine at no cost."}
            </li>
            <li className="border-t border-hairline pt-2">
              {ar
                ? "الحدّ الحاسم: اضبط سقف إنفاق 10$ في Anthropic Console ← Billing ← Usage limits. هذا هو الضمان الفعلي."
                : "Authoritative cap: set a $10 spend limit in Anthropic Console → Billing → Usage limits. That is the real guarantee."}
            </li>
            <li className="border-t border-hairline pt-2">
              {ar
                ? "افحص /api/health لرؤية الإنفاق التقديري والرصيد المتبقّي وعدد الإجابات المخزّنة."
                : "Check /api/health for estimated spend, remaining budget, and how many answers are cached."}
            </li>
          </ul>
        </div>

        <p className="mt-8">
          <Link href="/learn" className="btn-paper">
            {ar ? "إلى المنهج" : "To the curriculum"} <span aria-hidden>→</span>
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
