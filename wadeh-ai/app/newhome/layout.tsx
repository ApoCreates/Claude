import type { Metadata } from "next";

// /newhome is the homepage redesign, served alongside the live /home rather
// than replacing it. It must not be indexed while it is a preview: two near
// identical homepages in an index is a duplicate-content problem, and this URL
// is for review, not for readers arriving from search.
//
// The route needs its own layout because page.tsx is a client component and a
// client component cannot export `metadata`.
export const metadata: Metadata = {
  title: "wadehAI · واضح — homepage preview",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function NewHomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
