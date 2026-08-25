import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal — منصة إدارة هدر التموين",
  description:
    "بروتوتايب تشغيلي لإدارة هدر التموين وسلاسل الإمداد في الفعاليات: تصنيف سداسي، مصفوفة خطورة بثلاثة محاور، ومحرك قواعد حتمي يولّد الحلول. يعمل بالكامل داخل المتصفح بلا باك-إند وبلا مفاتيح.",
};

// البروتوتايب تطبيق ثابت مكتفٍ ذاتياً في /public/portal-app/index.html.
// يُحمَّل داخل iframe ملء الشاشة ليملك اتجاه RTL وخطوطه وتخزينه المحلي
// دون أن يصطدم بأنماط Next.js أو Tailwind في بقية التطبيق.
export default function PortalPage() {
  return (
    <main
      style={{
        position: "fixed",
        inset: 0,
        margin: 0,
        background: "#f4f6f9",
        overflow: "hidden",
      }}
    >
      <iframe
        src="/portal-app/index.html"
        title="Portal — منصة إدارة هدر التموين"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
      />
    </main>
  );
}
