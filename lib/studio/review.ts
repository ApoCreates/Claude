/** Gate 1, ported to run on post copy.
 *
 * The shell script at .claude/scripts/qc-gates.sh checks artefact files; this
 * checks the text of a post inside the platform, so the review gate is a real
 * check rather than a flag someone sets by hand. Same rules, same source: the
 * brand skill's references/04-qc-gates.md.
 */
import type { Post } from "./types";
import { getConnector } from "./connectors";

export interface Finding { rule: string; detail: string; severity: "fail" | "warn" }

const RULES: { rule: string; re: RegExp; detail: string; severity: "fail" | "warn" }[] = [
  { rule: "pure black or white", re: /#fff\b|#ffffff\b|#000\b|#000000\b/i,
    detail: "Use the ink and paper tokens, never pure black or white.", severity: "fail" },
  { rule: "brand spelling", re: /AIgency|AI-gency|The AI Agency|TheAigency\b|THE AIGENCY/,
    detail: "It is written The Aigency — one spelling, one styling.", severity: "fail" },
  { rule: "lowercase brand", re: /(^|[^@/\w-])the aigency([^-./\w]|$)/,
    detail: "The Aigency takes a capital T in running text.", severity: "fail" },
  { rule: "domain", re: /[^-]aigency\.ai|www\.ai-gency|ai-gency\.com|theaigency\.ai/i,
    detail: "The domain is written ai-gency.ai — lowercase, no protocol, no www.", severity: "fail" },
  { rule: "forbidden vocabulary",
    re: /\b(leverage|synergy|unlock|disrupt|world-class|best-in-class|industry-leading|cutting-edge|actionable|deliverables|bandwidth|game-?changer|seamless|revolutionary)\b/i,
    detail: "Words we do not use. See the brand skill's word list.", severity: "fail" },
  { rule: "place", re: /\bDubai\b/i,
    detail: "Abu Dhabi in anything designed — Dubai only inside quoted SEO copy.", severity: "warn" },
  { rule: "emoji", re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u,
    detail: "The voice carries no emoji.", severity: "warn" },
];

export function reviewPost(post: Post): { verdict: "PASS" | "FAIL"; findings: Finding[] } {
  const findings: Finding[] = [];
  // Only what actually publishes. The title is internal floor metadata and
  // checking it produced false failures on posts whose copy was clean.
  const text = post.text;

  for (const r of RULES) {
    if (r.re.test(text)) findings.push({ rule: r.rule, detail: r.detail, severity: r.severity });
  }

  // Per-platform limits are part of the gate: a caption that cannot post is a defect.
  for (const t of post.targets) {
    const c = getConnector(t.platform);
    if (post.text.length > c.limits.captionMax) {
      findings.push({
        rule: `${c.name} caption length`,
        detail: `${post.text.length} characters; ${c.name} allows ${c.limits.captionMax}.`,
        severity: "fail",
      });
    }
    if (!c.capabilities[post.kind]) {
      findings.push({
        rule: `${c.name} capability`,
        detail: `${c.name} does not take a ${post.kind} post.`,
        severity: "fail",
      });
    }
    if (post.kind !== "text" && post.mediaUrls.length === 0) {
      findings.push({
        rule: "missing media",
        detail: `A ${post.kind} post needs at least one media URL.`,
        severity: "fail",
      });
    }
  }

  const fails = findings.filter(f => f.severity === "fail");
  return { verdict: fails.length === 0 ? "PASS" : "FAIL", findings };
}
