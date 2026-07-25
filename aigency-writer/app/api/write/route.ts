import { NextRequest } from "next/server";
import { DEFAULT_MODEL, getClient, hasLiveAI } from "@/lib/ai/client";
import { buildSystemBlocks } from "@/lib/ai/persona";
import { isModeId } from "@/lib/ai/modes";
import { demoWriteResponse } from "@/lib/ai/demo";
import { getBrain } from "@/lib/brain/store";
import {
  ensurePromptVersion,
  fetchActivePatches,
  getClientConfig,
  logAgentRun,
} from "@/lib/diwan/db";
import { newId } from "@/lib/store/persist";
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

  const { mode, brief, outputLang, dialect, history = [] } = body;
  if (!mode || !isModeId(mode)) {
    return Response.json({ error: "Unknown mode" }, { status: 400 });
  }
  if (!brief || typeof brief !== "string" || !brief.trim()) {
    return Response.json({ error: "Empty brief" }, { status: 400 });
  }

  const runId = newId("run");
  const started = Date.now();
  // Server-authoritative tenant config wins over the profile the UI sent
  const profile = (await getClientConfig(body.profile?.id)) || body.profile || null;
  const clientId = profile?.id || null;

  if (!hasLiveAI()) {
    return new Response(demoWriteResponse(mode, outputLang || "both"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-AI-Mode": "demo",
        "X-Run-Id": runId,
      },
    });
  }

  const [brain, patches] = await Promise.all([getBrain(), fetchActivePatches()]);
  const system = buildSystemBlocks({
    mode,
    profile,
    outputLang: outputLang || "both",
    dialect,
    brain,
    patches,
  });
  const promptVersionId = await ensurePromptVersion(system.map((b) => b.text).join("\n\n"));
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
  // The serverless function is frozen the moment the response closes, so
  // the final log/spend write must complete BEFORE the stream ends — we
  // hold the close until this promise settles.
  let logDone: Promise<void> = Promise.resolve();
  stream.on("finalMessage", (m) => {
    const output = m.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    logDone = logAgentRun({
      id: runId,
      requestType: mode,
      clientId,
      input: { brief, outputLang, dialect, historyTurns: history.length },
      output,
      status: "ok",
      model: DEFAULT_MODEL,
      promptVersionId,
      tokens: m.usage,
      latencyMs: Date.now() - started,
    });
  });
  stream.on("error", (err) => {
    logDone = logAgentRun({
      id: runId,
      requestType: mode,
      clientId,
      input: { brief, outputLang, dialect },
      status: "error",
      error: err instanceof Error ? `${err.message}\n${err.stack || ""}` : String(err),
      model: DEFAULT_MODEL,
      promptVersionId,
      latencyMs: Date.now() - started,
    });
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (text) => controller.enqueue(encoder.encode(text)));
      stream.on("end", () => {
        logDone.catch(() => {}).finally(() => controller.close());
      });
      stream.on("error", (err) => {
        controller.enqueue(
          encoder.encode(`\n\n[The writer hit an error: ${err instanceof Error ? err.message : "unknown"}]`)
        );
        logDone.catch(() => {}).finally(() => controller.close());
      });
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-AI-Mode": "live",
      "X-Run-Id": runId,
    },
  });
}
