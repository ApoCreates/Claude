import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine } from "lucide-react";
import { hasLiveAI } from "@/lib/ai/client";

export const metadata: Metadata = {
  title: "Product Studio · Image → Listing",
  description:
    "Upload a product image and generate a publish-ready listing: name, title, description, tags, metadata, and SEO.",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const live = hasLiveAI();
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="border-b border-border bg-panel/60 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/studio" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-accent/15 text-accent grid place-items-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold leading-tight">Product Studio</div>
              <div className="text-[10px] text-muted leading-tight">Image → publish-ready listing</div>
            </div>
          </Link>
          <span
            className={`chip ${live ? "chip-good" : "chip-warn"}`}
            title={live ? "Live Claude vision is configured" : "No API key — demo data"}
          >
            {live ? "Live AI" : "Demo mode"}
          </span>
        </div>
      </header>
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
