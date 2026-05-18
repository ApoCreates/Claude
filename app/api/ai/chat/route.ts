import { NextResponse } from "next/server";
import { getClient, hasLiveAI, MODEL } from "@/lib/ai/client";
import { ANALYST_SYSTEM, businessContext } from "@/lib/ai/prompts";

type Msg = { role: "user" | "assistant"; content: string };

const CANNED_FALLBACK =
  "I'd need a live LLM connection to answer that with confidence. Based on the headline data I do have: revenue is trending up modestly (~3% over the trailing 30 days), Energy and Sparkling Water are the share gainers, and the two competitors to watch this week are Cascade Beverages (zero-cal launch) and Amperion (convenience-channel pricing).";

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: Msg[] };
  if (!hasLiveAI()) {
    return NextResponse.json({ live: false, text: CANNED_FALLBACK });
  }
  const client = getClient();
  if (!client) return NextResponse.json({ live: false, text: CANNED_FALLBACK });

  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: `${ANALYST_SYSTEM}\n\nBUSINESS CONTEXT:\n${businessContext()}`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const part = resp.content.find((b) => b.type === "text");
    return NextResponse.json({ live: true, text: part && part.type === "text" ? part.text : "" });
  } catch (e: any) {
    return NextResponse.json({ live: false, text: `AI error: ${e.message}\n\n${CANNED_FALLBACK}` });
  }
}
