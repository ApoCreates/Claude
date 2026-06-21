import { NextResponse } from "next/server";
import { getClient, hasLiveAI, MODEL } from "@/lib/ai/client";
import { BOTTLES, findBottle } from "@/lib/bar/bottles";

export const runtime = "nodejs";
export const maxDuration = 60;

type VisionResult = {
  bottleId: string | null;
  guessName: string;
  category: string;
  fillFraction: number; // 0..1
  confidence: number; // 0..1
  notes: string;
};

const CATALOG = BOTTLES.map((b) => `${b.id} = ${b.brand} ${b.name} (${b.category})`).join("\n");

const SYSTEM = `You are a precise bartender's inventory assistant with computer vision.
You are shown ONE photo of a single liquor/wine/spirit bottle. Do two things:

1) IDENTIFY the bottle. Match it to exactly one id from this catalog when you are
reasonably sure; otherwise set bottleId to null and still fill guessName/category.

CATALOG:
${CATALOG}

2) ESTIMATE how much liquid remains by reading the liquid surface line.
Define "fillFraction" precisely:
  - Measure the vertical height of the remaining liquid, from the INSIDE BOTTOM of
    the bottle up to the LIQUID SURFACE.
  - Divide it by the height from the inside bottom up to the FULL LINE — the level
    of a brand-new, unopened bottle (typically at the base of the neck / shoulder).
  - fillFraction = 1.0 means it looks unopened/full. 0.0 means empty.
  - Look carefully for the meniscus / refraction line and any label that occludes
    the liquid. If the liquid is dark or the glass is tinted, infer the surface from
    where opacity/brightness changes. Ignore the empty neck above the full line.

Respond with ONLY a JSON object, no prose, no code fences:
{"bottleId": string|null, "guessName": string, "category": string,
 "fillFraction": number, "confidence": number, "notes": string}
"confidence" (0..1) reflects how sure you are about the IDENTITY of the bottle.
"notes" is one short sentence (e.g. what you saw, or why it's uncertain).`;

function parseJson(text: string): VisionResult | null {
  if (!text) return null;
  let t = text.trim();
  // Strip code fences if the model added them anyway.
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const raw = JSON.parse(t.slice(start, end + 1));
    return {
      bottleId: typeof raw.bottleId === "string" ? raw.bottleId : null,
      guessName: String(raw.guessName ?? "Unknown bottle"),
      category: String(raw.category ?? "Spirit"),
      fillFraction: clamp01(Number(raw.fillFraction)),
      confidence: clamp01(Number(raw.confidence)),
      notes: String(raw.notes ?? ""),
    };
  } catch {
    return null;
  }
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export async function POST(req: Request) {
  let body: { imageBase64?: string; mediaType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { imageBase64, mediaType } = body;
  if (!imageBase64) {
    return NextResponse.json({ ok: false, error: "No image provided" }, { status: 400 });
  }

  if (!hasLiveAI()) {
    // Graceful demo fallback — the UI still lets the user pick the bottle and
    // fine-tune the level manually.
    return NextResponse.json({
      ok: true,
      live: false,
      result: {
        bottleId: null,
        guessName: "Set ANTHROPIC_API_KEY for auto-detection",
        category: "Spirit",
        fillFraction: 0.5,
        confidence: 0,
        notes:
          "AI vision is offline. Pick the bottle below and drag the level slider to set the amount manually.",
      } as VisionResult,
    });
  }

  const client = getClient()!;
  const media = (mediaType || "image/jpeg") as
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/gif";

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: media, data: imageBase64 },
            },
            {
              type: "text",
              text: "Identify this bottle and estimate the remaining fill. Return only the JSON.",
            },
          ],
        },
      ],
    });
    const part = resp.content.find((b) => b.type === "text");
    const text = part && part.type === "text" ? part.text : "";
    const result = parseJson(text);
    if (!result) {
      return NextResponse.json({
        ok: true,
        live: true,
        result: {
          bottleId: null,
          guessName: "Could not read bottle",
          category: "Spirit",
          fillFraction: 0.5,
          confidence: 0,
          notes: "The photo was unclear — pick the bottle and adjust the level manually.",
        } as VisionResult,
      });
    }
    // Don't trust an id that isn't in our catalog.
    if (result.bottleId && !findBottle(result.bottleId)) result.bottleId = null;
    return NextResponse.json({ ok: true, live: true, result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Vision request failed" },
      { status: 502 }
    );
  }
}
