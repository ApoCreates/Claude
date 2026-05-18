import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pulse · F&B Competitive Intelligence (Demo)",
  description: "An AI-powered command center for F&B executives. Demo with dummy data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
