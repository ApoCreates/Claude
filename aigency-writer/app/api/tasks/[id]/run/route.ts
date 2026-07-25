import { NextRequest } from "next/server";
import { executeTask } from "@/lib/tasks/execute";
import { getTask } from "@/lib/tasks/store";

export const runtime = "nodejs";
export const maxDuration = 180;

/** The agent picks up an assigned task and produces the deliverable. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const task = await getTask(params.id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  if (task.status === "running") {
    return Response.json({ error: "Task is already running" }, { status: 409 });
  }

  const done = await executeTask(task);
  return done.error
    ? Response.json({ task: done }, { status: 502 })
    : Response.json({ task: done });
}
