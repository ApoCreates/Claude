import type { Post } from "./types";

/** Seed content so the dashboard has something to show on a cold start.
 *  These are drafts from the studio floor's own carousel run — real copy, not
 *  lorem, and none of them are marked published. */
export function seedPosts(): Post[] {
  const now = Date.now();
  const iso = (offsetHours: number) => new Date(now + offsetHours * 3600_000).toISOString();
  const base = { createdAt: iso(-48), updatedAt: iso(-48), mediaUrls: [] as string[] };

  return [
    {
      ...base,
      id: "post_floor_01",
      title: "The Studio Floor — carousel",
      text: "Seven desks carry every artefact we make — from the first call, through Arabic, to the six checks that decide whether it ships.\n\nSwipe to meet the floor.",
      kind: "carousel",
      mediaUrls: ["/studio-samples/floor-01.png", "/studio-samples/floor-09.png"],
      runSlug: "studio-floor",
      scheduledFor: iso(18),
      review: { verdict: "PASS", failures: [], checkedAt: iso(-2) },
      // LinkedIn has no organic carousel, so the carousel goes to Instagram only.
      targets: [{ platform: "instagram", status: "scheduled" }],
    },
    {
      ...base,
      id: "post_gates_02",
      title: "Nothing ships until it passes",
      text: "Six checks stand between the work and the world. The desk that made a defect fixes it — the reviewer only ever reports.",
      kind: "text",
      scheduledFor: iso(42),
      review: { verdict: "NOT_RUN", failures: [] },
      targets: [
        { platform: "linkedin", status: "draft" },
        { platform: "x", status: "draft" },
      ],
    },
    {
      ...base,
      id: "post_arabic_03",
      title: "Both languages, the same care",
      text: "Text extraction lies about Arabic. It reports perfect order while the page renders unjoined. So we look at the pixels, every time.",
      kind: "text",
      scheduledFor: null,
      review: { verdict: "FAIL", failures: ["Arabic shaping not yet inspected on the rendered frames"] },
      targets: [{ platform: "linkedin", status: "blocked" }],
    },
  ];
}
