"use client";

import { usePrefs } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Guard } from "@/components/Guard";
import { SunSprint } from "@/components/SunSprint";

export default function SprintPage() {
  return (
    <Guard>
      <Sprint />
    </Guard>
  );
}

function Sprint() {
  const { lang } = usePrefs();
  const d = t(lang);
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="eyebrow-accent mb-3">{d.sprint.eyebrow}</p>
        <h1 className="font-serif text-5xl">{d.sprint.title}</h1>
        <p className="mt-4 max-w-xl text-paper/70">{d.sprint.pageBody}</p>
        <div className="mt-10">
          <SunSprint />
        </div>
      </main>
      <Footer />
    </>
  );
}
