import { NextRequest } from "next/server";
import { DEFAULT_MODEL, getClient, hasLiveAI } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/persona";
import { isModeId } from "@/lib/ai/modes";
import { demoWriteResponse } from "@/lib/ai/demo";
import type { BrandProfile, Dialect, OutputLang } from "@/lib/profiles";

export const runtime = "nodejs";
export const maxDuration = 120;

interface WriteBody {
  mode: string;
  brief: string;
  outputLang: OutputLang;
  dialect?: Dialect;
  profile?: BrandProfile | null;
  history?: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: NextRequest) {
  let body: WriteBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { mode, brief, outputLang, dialect, profile, history = [] } = body;
  if (!mode || !isModeId(mode)) {
    return Response.json({ error: "Unknown mode" }, { status: 400 });
  }
  if (!brief || typeof brief !== "string" || !brief.trim()) {
    return Response.json({ error: "Empty brief" }, { status: 400 });
  }

  if (!hasLiveAI()) {
    return new Response(demoWriteResponse(mode, outputLang || "both"), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Mode": "demo" },
    });
  }

  const system = buildSystemPrompt({ mode, profile, outputLang: outputLang || "both", dialect });
  const messages = [
    ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: brief },
  ];

  const client = getClient();
  const stream = client.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: 4000,
    system,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (text) => controller.enqueue(encoder.encode(text)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => {
        controller.enqueue(
          encoder.encode(`\n\n[The writer hit an error: ${err instanceof Error ? err.message : "unknown"}]`)
        );
        controller.close();
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-AI-Mode": "live" },
  });
}
