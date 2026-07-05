import { NextRequest } from "next/server";
import { DEFAULT_MODEL, getClient, hasLiveAI } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/ai/persona";
import { demoWriteResponse } from "@/lib/ai/demo";
import { getTask, updateTask } from "@/lib/tasks/store";

export const runtime = "nodejs";
export const maxDuration = 180;

/**
 * The agent picks up an assigned task and produces the deliverable.
 * Revisions carry the coach note and every earlier draft so the agent
 * fixes what was flagged instead of starting from scratch.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const task = getTask(params.id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  if (task.status === "running") {
    return Response.json({ error: "Task is already running" }, { status: 409 });
  }

  updateTask(task.id, { status: "running", error: undefined });

  if (!hasLiveAI()) {
    const result = demoWriteResponse(task.mode, task.outputLang);
    return Response.json({ task: updateTask(task.id, { status: "review", result }) });
  }

  try {
    const system = buildSystemPrompt({
      mode: task.mode,
      profile: task.profile,
      outputLang: task.outputLang,
      dialect: task.dialect,
      extra: `ASSIGNED TASK (dashboard)
This is delegated client work, not a conversation. Deliver the complete, final-quality deliverable for the brief. Title: "${task.title}". Priority: ${task.priority}.${task.due ? ` Due: ${task.due}.` : ""}`,
    });

    let userContent = task.brief;
    if (task.revisionNote) {
      const lastDraft = task.drafts[task.drafts.length - 1];
      userContent = `${task.brief}

────────
REVISION ROUND ${task.drafts.length}
Your previous draft was reviewed. Coach note (must be fully addressed):
«${task.revisionNote}»

Previous draft:
${lastDraft ? lastDraft.text.slice(0, 6000) : "(missing)"}

Deliver the corrected version in full, and open with one line stating what you changed.`;
    }

    const client = getClient();
    const res = await client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: userContent }],
    });

    const result = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    return Response.json({
      task: updateTask(task.id, { status: "review", result, revisionNote: undefined }),
    });
  } catch (e) {
    return Response.json(
      {
        task: updateTask(task.id, {
          status: "queued",
          error: e instanceof Error ? e.message : "Unknown error",
        }),
      },
      { status: 502 }
    );
  }
}
