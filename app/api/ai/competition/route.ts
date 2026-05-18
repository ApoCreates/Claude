import { NextResponse } from "next/server";
import { completeText, hasLiveAI } from "@/lib/ai/client";
import { COMPETITION_SYSTEM, competitorContext } from "@/lib/ai/prompts";
import { competitorById } from "@/lib/data/competition";

const CANNED: Record<string, string> = {
  "cmp-cascade":
    "Cascade Beverages is the entrenched leader in soda and a meaningful player in water and tea. Their just-launched zero-calorie line is a direct shot at Aurora Cola Zero — expect heavy slotting fees and end-cap displays through Q3, particularly in hypermarkets where they hold ~34% share.\n\nThe immediate threat is shelf displacement of Aurora Cola Zero in 8–12 of our top hypermarket banners. Their pricing posture suggests they're spending for share, not margin, which means we have ~6 weeks before they reset baselines.\n\nCountermoves: 1) Lock multi-period contracts with 4 strategic banner partners before Cascade's terms set. 2) Run a paired 12-week trial of an Aurora Cola Zero + Glacio Sparkling Lime co-merchandise display in West region — leverages our sparkling water momentum. 3) Pre-empt the launch narrative with a Pasture-anchored 'real ingredients' campaign aimed at the same Gen-Z target.",
  "cmp-northwave":
    "Northwave is the premium juice insurgent. They've quietly captured ~21% of juice category share by anchoring in HORECA accounts where Verde under-indexes. Their cold-pressed positioning commands a 35% price premium and they're winning on quality cues, not price.\n\nThe threat is acute in West and Northeast HORECA, exactly the channel where we're trying to scale Verde Mango Sunrise. If we don't move, they will compound a quality reputation that locks Verde out of the premium tier.\n\nCountermoves: 1) Accelerate scn-002 (Verde Mango Sunrise HORECA expansion) — pull Northeast forward to Q3 if cold-chain capacity allows. 2) Launch a Verde Cold-Pressed line extension in 4 lighthouse HORECA accounts. 3) Bundle Verde + Solace Peach Iced Tea in HORECA combos to make our offering harder to displace.",
  "cmp-solbright":
    "Solbright is a faded giant. Their dairy recall has accelerated a multi-year share decline and Midwest distribution is contracting. Threat level is medium because share losses create a real ~10-day demand window we can capture in dairy and juice — but they remain a major retailer relationship.\n\nThe primary opportunity is trial capture for Pasture in Midwest while Solbright is offline. The risk: over-commit and we own dairy distribution headaches we don't actually want.\n\nCountermoves: 1) Run a 2-week Pasture Whole + Choco Shake trial promo in Midwest (40 accounts). 2) Hold the win — convert trial users with subscription/loyalty in our DTC channel. 3) Do NOT pursue Solbright juice share aggressively; the cost-to-serve is poor for our scale.",
  "cmp-amperion":
    "Amperion is the most dangerous entrant in our portfolio. They are taking share from Volt at the bottom of the funnel — convenience-channel impulse purchases by young males — using influencer marketing we can't match dollar-for-dollar.\n\nThe threat is structural: every quarter they hold convenience shelf is a quarter Volt's brand strength erodes with the cohort that defines the category for the next decade.\n\nCountermoves: 1) Greenlight scn-001 (Volt Berry Rush -8% in convenience) but ring-fence to 4 banners in South & West for an 8-week proof. 2) Launch a Volt creator program with 12 mid-tier athletes/streamers in Q3 — match their distribution model, not their ad spend. 3) Use Glacio Sparkling Lime co-placement to reach the same shopper at lower CPM.",
  "cmp-meridian":
    "Meridian Pure owns the Mountain region private-label water relationships and is preparing a 4% price increase next quarter — unusual for a private-label-anchored player. This signals either margin recovery or distribution leverage.\n\nThe Mountain region softness in our weekly numbers (~7% below forecast for three weeks) is likely already a result of Meridian's quiet trade promo. If they raise prices on top of that, we get a window.\n\nCountermoves: 1) Hold Glacio Still pricing in Mountain — do not chase the promo. 2) Time a Glacio Sparkling Lime push to follow Meridian's April 1 price increase. 3) Brief the field team to confirm the trade promo within 48 hours and harden distribution agreements through Q4.",
};

export async function POST(req: Request) {
  const { id } = await req.json();
  const comp = competitorById(id);
  if (!comp) return NextResponse.json({ error: "Unknown competitor" }, { status: 404 });

  if (!hasLiveAI()) {
    return NextResponse.json({ live: false, text: CANNED[id] || "No canned brief for this competitor." });
  }

  try {
    const text = await completeText({
      system: COMPETITION_SYSTEM,
      user: competitorContext(id),
      maxTokens: 600,
    });
    return NextResponse.json({ live: true, text: text || CANNED[id] || "" });
  } catch (e: any) {
    return NextResponse.json({ live: false, text: CANNED[id] || `AI error: ${e.message}` });
  }
}
