import type { Metadata } from "next";
import "./globals.css";

const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "Qalam · قَلَم";

export const metadata: Metadata = {
  title: `${brand} — Aigency Bilingual Writer`,
  description:
    "Arabic-native, English-native writer agent: copy, campaigns, fiction, documentary, screenplay, prompts, comedy, and newsroom — learning daily from research, practice, and your feedback.",
  icons: { icon: "/aigency-mark.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Aigency brand fonts (same set as ai-gency.ai) + Arabic pairs */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Noto+Naskh+Arabic:wght@400;500;700&family=Noto+Kufi+Arabic:wght@500;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
