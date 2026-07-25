"use client";

import Image from "next/image";
import { usePrefs } from "@/lib/prefs";
import type { Subject } from "@/lib/curriculum";

// AI-generated subject artwork (Higgsfield soul_2, brand-palette brief),
// served locally from /public/art. Alt text is bilingual and descriptive.
export function SubjectArt({
  subject,
  className = "",
  priority = false,
}: {
  subject: Subject;
  className?: string;
  priority?: boolean;
}) {
  const { lang } = usePrefs();
  const alt =
    lang === "ar"
      ? `رسم توضيحي لمادة ${subject.name.ar}: ${subject.tagline.ar}`
      : `Illustration for ${subject.name.en}: ${subject.tagline.en}`;
  return (
    <Image
      src={`/art/${subject.slug}.webp`}
      alt={alt}
      width={1200}
      height={800}
      priority={priority}
      className={`w-full border border-hairline object-cover ${className}`}
    />
  );
}
