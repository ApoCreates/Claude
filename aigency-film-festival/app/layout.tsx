import type { Metadata } from "next";
import "./globals.css";
import { FESTIVAL } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: `${FESTIVAL.name} — ${FESTIVAL.service}`,
    template: `%s · ${FESTIVAL.name}`,
  },
  description:
    "A festival of films made with AI. Build the idea, make the film, publish the page — by The Aigency. AI for the better.",
  openGraph: {
    title: FESTIVAL.name,
    description: "Films made for the years ahead. A capacity-building festival by The Aigency.",
    type: "website",
  },
  metadataBase: undefined,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="ambient" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
