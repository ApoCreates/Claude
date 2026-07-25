import { NextRequest } from "next/server";
import { createRecurring, deleteRecurring, listRecurring, updateRecurring } from "@/lib/tasks/store";
import { isModeId } from "@/lib/ai/modes";
import { emailConfigured } from "@/lib/email";
import type { BrandProfile, Dialect, OutputLang } from "@/lib/profiles";
import type { TaskPriority } from "@/lib/tasks/types";

export const runtime = "nodejs";

/** GET → all standing automations. */
export async function GET() {
  return Response.json({ recurring: await listRecurring(), emailConfigured: emailConfigured() });
}

interface CreateBody {
  title: string;
  brief: string;
  mode: string;
  outputLang: OutputLang;
  dialect?: Dialect;
  priority?: TaskPriority;
  emailTo?: string;
  profile?: BrandProfile | null;
}

/** POST → create a daily automation (executed by the scheduler cron). */
export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.brief?.trim()) {
    return Response.json({ error: "Brief is required" }, { status: 400 });
  }
  if (!body.mode || !isModeId(body.mode)) {
    return Response.json({ error: "Unknown mode" }, { status: 400 });
  }
  const rec = await createRecurring({
    title: body.title?.trim() || body.brief.trim().slice(0, 60),
    brief: body.brief.trim(),
    mode: body.mode,
    outputLang: body.outputLang || "both",
    dialect: body.dialect,
    priority: body.priority || "normal",
    emailTo: body.emailTo?.trim() || undefined,
    profile: body.profile || null,
  });
  return Response.json({ recurring: rec }, { status: 201 });
}

/** PATCH → enable/disable an automation. */
export async function PATCH(req: NextRequest) {
  let body: { id?: string; enabled?: boolean };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
  const rec = await updateRecurring(body.id, { enabled: Boolean(body.enabled) });
  if (!rec) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ recurring: rec });
}

/** DELETE ?id= → remove an automation. */
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const ok = await deleteRecurring(id);
  return ok
    ? Response.json({ ok: true })
    : Response.json({ error: "Not found" }, { status: 404 });
}
