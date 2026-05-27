import { NextResponse } from "next/server";
import { getClient, hasLiveAI, MODEL } from "@/lib/ai/client";
import {
  PRODUCT_SYSTEM,
  buildUserPrompt,
  parseAnalysis,
  DEMO_ANALYSIS,
} from "@/lib/ai/product";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AllowedMedia = (typeof ALLOWED_MEDIA)[number];

type Body = {
  imageBase64?: string; // raw base64, no data: prefix
  mediaType?: string;
  hint?: string;
  marketplace?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageBase64, mediaType, hint, marketplace } = body;

  if (!imageBase64) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }
  if (!ALLOWED_MEDIA.includes(mediaType as AllowedMedia)) {
    return NextResponse.json(
      { error: `Unsupported image type. Use one of: ${ALLOWED_MEDIA.join(", ")}` },
      { status: 415 }
    );
  }

  if (!hasLiveAI()) {
    return NextResponse.json({
      live: false,
      analysis: DEMO_ANALYSIS,
      note: "Demo data — set ANTHROPIC_API_KEY to analyze the uploaded image with live AI vision.",
    });
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json({ live: false, analysis: DEMO_ANALYSIS, note: "Demo data." });
  }

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: PRODUCT_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as AllowedMedia,
                data: imageBase64,
              },
            },
            { type: "text", text: buildUserPrompt({ hint, marketplace }) },
          ],
        },
      ],
    });
    const part = resp.content.find((b) => b.type === "text");
    const text = part && part.type === "text" ? part.text : "";
    const analysis = parseAnalysis(text);
    return NextResponse.json({ live: true, analysis });
  } catch (e: any) {
    return NextResponse.json({
      live: false,
      analysis: DEMO_ANALYSIS,
      note: `Live AI call failed (${e?.message ?? "unknown error"}). Showing demo data instead.`,
    });
  }
}
