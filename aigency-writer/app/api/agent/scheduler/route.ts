import { NextRequest } from "next/server";
import { createTask, listRecurring, updateRecurring, updateTask } from "@/lib/tasks/store";
import { executeTask } from "@/lib/tasks/execute";
import { sendTaskEmail } from "@/lib/email";
import type { AgentTask } from "@/lib/tasks/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * The agent's daily shift. Vercel Cron hits this every morning (see
 * vercel.json): each enabled automation becomes a fresh task, the agent
 * executes it, the deliverable lands on the board under "For your
 * review" — and is emailed if the automation has emailTo set.
 *
 * POST with {"id": "..."} runs a single automation on demand.
 */

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function appUrl(req: NextRequest): string {
  const host = req.headers.get("host") || "localhost:3000";
  return `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
}

async function runAutomations(req: NextRequest, onlyId?: string) {
  const recurring = await listRecurring();
  const due = recurring.filter((r) => r.enabled && (!onlyId || r.id === onlyId));
  if (onlyId && !due.length) {
    return Response.json({ error: "Automation not found or disabled" }, { status: 404 });
  }

  const url = appUrl(req);
  const results: { id: string; title: string; taskId: string; emailed: boolean }[] = [];

  // Sequential on purpose: predictable API load, and maxDuration bounds us
  for (const rec of due) {
    const task = await createTask({
      title: rec.title,
      brief: rec.brief,
      mode: rec.mode,
      outputLang: rec.outputLang,
      dialect: rec.dialect,
      priority: rec.priority,
      profile: rec.profile,
      recurringId: rec.id,
    });
    const done: AgentTask = await executeTask(task);

    let emailed = false;
    if (rec.emailTo && done.result) {
      emailed = await sendTaskEmail(rec.emailTo, done, url);
      if (emailed) await updateTask(done.id, { emailedTo: rec.emailTo });
    }
    await updateRecurring(rec.id, { lastRunAt: new Date().toISOString() });
    results.push({ id: rec.id, title: rec.title, taskId: done.id, emailed });
  }

  return Response.json({ ok: true, ran: results.length, results });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return runAutomations(req);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  return runAutomations(req, typeof body.id === "string" ? body.id : undefined);
}
