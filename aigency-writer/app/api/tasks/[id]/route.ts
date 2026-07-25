import { NextRequest } from "next/server";
import { getTask, pushDraft, updateTask } from "@/lib/tasks/store";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const task = await getTask(params.id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });
  return Response.json({ task });
}

interface PatchBody {
  action: "approve" | "request_changes" | "archive" | "requeue";
  comment?: string;
}

/**
 * Review actions from the dashboard:
 * - approve         → deliverable accepted
 * - request_changes → current draft is archived with the coach note and the
 *                     task re-queues; the note also becomes a brain lesson
 *                     (the dashboard posts it to /api/feedback)
 * - requeue         → run again as-is (e.g. after an error)
 * - archive         → remove from the active board
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const task = await getTask(params.id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });

  switch (body.action) {
    case "approve":
      return Response.json({ task: await updateTask(params.id, { status: "approved" }) });
    case "archive":
      return Response.json({ task: await updateTask(params.id, { status: "archived" }) });
    case "requeue":
      return Response.json({
        task: await updateTask(params.id, { status: "queued", error: undefined }),
      });
    case "request_changes": {
      if (!body.comment?.trim()) {
        return Response.json({ error: "A change request needs a comment" }, { status: 400 });
      }
      await pushDraft(params.id, body.comment.trim());
      return Response.json({ task: await updateTask(params.id, { status: "queued", error: undefined }) });
    }
    default:
      return Response.json({ error: "Unknown action" }, { status: 400 });
  }
}
