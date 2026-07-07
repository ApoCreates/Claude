import { NextRequest } from "next/server";
import { createTask, listTasks } from "@/lib/tasks/store";
import { isModeId } from "@/lib/ai/modes";
import type { BrandProfile, Dialect, OutputLang } from "@/lib/profiles";
import type { TaskPriority } from "@/lib/tasks/types";

export const runtime = "nodejs";

/** GET → tasks (priority-ordered) + automations + status counts. */
export async function GET() {
  const { tasks, recurring, stats } = await listTasks();
  return Response.json({ tasks, recurring, stats });
}

interface CreateBody {
  title: string;
  brief: string;
  mode: string;
  outputLang: OutputLang;
  dialect?: Dialect;
  priority?: TaskPriority;
  due?: string;
  profile?: BrandProfile | null;
}

/** POST → assign a new task to the agent (lands in the queue). */
export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.brief?.trim()) {
    return Response.json({ error: "Task brief is required" }, { status: 400 });
  }
  if (!body.mode || !isModeId(body.mode)) {
    return Response.json({ error: "Unknown mode" }, { status: 400 });
  }

  const task = await createTask({
    title: body.title?.trim() || body.brief.trim().slice(0, 60),
    brief: body.brief.trim(),
    mode: body.mode,
    outputLang: body.outputLang || "both",
    dialect: body.dialect,
    priority: body.priority || "normal",
    due: body.due || undefined,
    profile: body.profile || null,
  });

  return Response.json({ task }, { status: 201 });
}
