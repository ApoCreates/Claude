import type { Metadata } from "next";
import "./globals.css";

const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "Qalam · قَلَم";

export const metadata: Metadata = {
  title: `${brand} — Aigency Bilingual Writer`,
  description:
    "Arabic-native, English-native writer agent: copy, campaigns, fiction, documentary, screenplay, prompts, comedy, and newsroom — learning daily from research, practice, and your feedback.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
