import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PourCheck · Bar Bottle Inventory",
  description:
    "Snap a photo of any bottle and instantly see how much is left — auto-identified, with ml and shots remaining.",
};

export default function BarLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg">{children}</div>;
}
