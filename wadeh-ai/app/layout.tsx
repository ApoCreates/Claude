import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono, Amiri, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { PrefsProvider } from "@/lib/prefs";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-fraunces",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-amiri",
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-arabic",
});

export const metadata: Metadata = {
  title: "wadehAI · واضح — Learn clearly",
  description:
    "A bilingual AI learning platform for the GCC and the Levant. Ten subjects × ten school years, in Arabic and English — with visual labs, quests, mastery quizzes and a patient AI tutor in every lesson.",
  openGraph: {
    title: "wadehAI · واضح — Learn clearly",
    description:
      "Ten subjects, ten school years each, in Arabic and English. Visual labs, daily quests, mastery quizzes, and a Socratic AI tutor — built for the GCC and the Levant.",
    siteName: "wadehAI",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${interTight.variable} ${jetbrains.variable} ${amiri.variable} ${plexArabic.variable} bg-ink text-paper font-sans antialiased`}
      >
        <PrefsProvider>{children}</PrefsProvider>
      </body>
    </html>
  );
}
