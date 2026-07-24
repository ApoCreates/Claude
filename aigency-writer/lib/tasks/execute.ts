/**
 * Shared task execution: the agent picks up a task and produces the
 * deliverable. Used by the dashboard run endpoint and the daily
 * scheduler. Revisions carry the coach note and the previous draft so
 * the agent fixes what was flagged instead of starting over.
 */

import { DEFAULT_MODEL, getClient, hasLiveAI } from "../ai/client";
import { buildSystemBlocks } from "../ai/persona";
import { demoWriteResponse } from "../ai/demo";
import { getBrain } from "../brain/store";
import { ensurePromptVersion, fetchActivePatches, getClientConfig, logAgentRun } from "../diwan/db";
import { newId } from "../store/persist";
import { updateTask } from "./store";
import type { AgentTask } from "./types";

export async function executeTask(task: AgentTask): Promise<AgentTask> {
  await updateTask(task.id, { status: "running", error: undefined });

  if (!hasLiveAI()) {
    const result = demoWriteResponse(task.mode, task.outputLang);
    return (await updateTask(task.id, { status: "review", result }))!;
  }

  const runId = newId("run");
  const started = Date.now();
  try {
    const [brain, patches] = await Promise.all([getBrain(), fetchActivePatches()]);
    const profile = (await getClientConfig(task.profile?.id)) || task.profile;
    const system = buildSystemBlocks({
      mode: task.mode,
      profile,
      patches,
      outputLang: task.outputLang,
      dialect: task.dialect,
      brain,
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

    const promptVersionId = await ensurePromptVersion(system.map((b) => b.text).join("\n\n"));
    const result0 = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    void logAgentRun({
      id: runId,
      requestType: `task:${task.mode}`,
      clientId: task.profile?.id || null,
      input: { taskId: task.id, title: task.title, brief: task.brief, revision: task.drafts.length },
      output: result0,
      status: "ok",
      model: DEFAULT_MODEL,
      promptVersionId,
      tokens: res.usage,
      latencyMs: Date.now() - started,
    });
    const result = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    return (await updateTask(task.id, {
      status: "review",
      result,
      runId,
      revisionNote: undefined,
    }))!;
  } catch (e) {
    void logAgentRun({
      id: runId,
      requestType: `task:${task.mode}`,
      clientId: task.profile?.id || null,
      input: { taskId: task.id, title: task.title },
      status: "error",
      error: e instanceof Error ? `${e.message}\n${e.stack || ""}` : String(e),
      model: DEFAULT_MODEL,
      latencyMs: Date.now() - started,
    });
    return (await updateTask(task.id, {
      status: "queued",
      error: e instanceof Error ? e.message : "Unknown error",
    }))!;
  }
}
