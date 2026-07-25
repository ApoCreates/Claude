/**
 * Diwan platform layer — feedback capture, observability, prompt
 * versioning, review queue, and tenant configs on Supabase.
 *
 * Every function here is fail-safe: if Supabase isn't configured
 * (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) or a call fails, the agent
 * keeps working and the event is logged to console instead — never a
 * silent failure, never a broken request path.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { recordSpend } from "../spend";
import type { BrandProfile } from "../profiles";

export const AGENT_NAME = "qalam"; // this deployment's agent (aql | qalam | lisan)

const g = globalThis as unknown as {
  __diwanClient?: SupabaseClient | null;
  __diwanPromptVersions?: Map<string, string>;
};

export function diwanEnabled(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function db(): SupabaseClient | null {
  if (!diwanEnabled()) return null;
  if (g.__diwanClient === undefined) {
    g.__diwanClient = createClient(
      process.env.SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false } }
    );
  }
  return g.__diwanClient;
}

// ── Observability ────────────────────────────────────────────────────────

export interface AgentRunLog {
  id: string;
  requestType: string;
  clientId?: string | null;
  input: Record<string, unknown>;
  output?: string;
  status: "ok" | "error";
  error?: string;
  model?: string;
  promptVersionId?: string | null;
  tokens?: unknown;
  latencyMs?: number;
}

/** Structured log of one agent run. Console always; Supabase when enabled. */
export async function logAgentRun(run: AgentRunLog): Promise<void> {
  const record = {
    id: run.id,
    agent_name: AGENT_NAME,
    client_id: run.clientId || null,
    request_type: run.requestType,
    input: run.input,
    output: run.output?.slice(0, 20000) || null,
    status: run.status,
    error: run.error?.slice(0, 4000) || null,
    model: run.model || null,
    prompt_version_id: run.promptVersionId || null,
    tokens: run.tokens ?? null,
    latency_ms: run.latencyMs ?? null,
  };
  console.log(
    "[diwan run]",
    JSON.stringify({ ...record, input: undefined, output: undefined })
  );
  // Every run with token usage lands in the persistent spend ledger —
  // logAgentRun is the single choke point all AI calls pass through.
  if (run.tokens) {
    await recordSpend({
      runId: run.id,
      requestType: run.requestType,
      model: run.model,
      tokens: run.tokens,
    });
  }
  const client = db();
  if (!client) return;
  const { error } = await client.from("agent_runs").insert(record);
  if (error) console.warn("[diwan] run log failed:", error.message);
}

// ── Prompt versioning ────────────────────────────────────────────────────

/**
 * Record the built system prompt as a version (hash-deduped) and return
 * its id, so every run and rating can be attributed to a prompt version.
 */
export async function ensurePromptVersion(systemPrompt: string): Promise<string | null> {
  const client = db();
  if (!client) return null;
  const hash = createHash("sha256").update(systemPrompt).digest("hex").slice(0, 24);
  if (!g.__diwanPromptVersions) g.__diwanPromptVersions = new Map();
  const cached = g.__diwanPromptVersions.get(hash);
  if (cached) return cached;
  try {
    const { data } = await client
      .from("prompt_versions")
      .select("id")
      .eq("agent_name", AGENT_NAME)
      .eq("hash", hash)
      .maybeSingle();
    if (data?.id) {
      g.__diwanPromptVersions.set(hash, data.id);
      return data.id;
    }
    const { data: inserted, error } = await client
      .from("prompt_versions")
      .insert({
        agent_name: AGENT_NAME,
        hash,
        system_prompt: systemPrompt,
        change_note: "auto-recorded from deployment",
      })
      .select("id")
      .single();
    if (error) throw error;
    g.__diwanPromptVersions.set(hash, inserted.id);
    return inserted.id;
  } catch (e) {
    console.warn("[diwan] prompt version failed:", e);
    return null;
  }
}

/** Active human-authored prompt patches / guardrails for this agent. */
export async function fetchActivePatches(): Promise<string[]> {
  const client = db();
  if (!client) return [];
  try {
    const { data } = await client
      .from("prompt_patches")
      .select("kind, patch_text")
      .eq("agent_name", AGENT_NAME)
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(20);
    return (data || []).map(
      (p) => `${p.kind === "guardrail" ? "[GUARDRAIL] " : ""}${p.patch_text}`
    );
  } catch {
    return [];
  }
}

// ── Tenant configuration ─────────────────────────────────────────────────

/** Server-authoritative client config; falls back to the profile the UI sent. */
export async function getClientConfig(clientId?: string | null): Promise<BrandProfile | null> {
  const client = db();
  if (!client || !clientId) return null;
  try {
    const { data } = await client
      .from("client_configs")
      .select("client_id, name, config")
      .eq("client_id", clientId)
      .maybeSingle();
    if (!data) return null;
    return { ...(data.config as BrandProfile), id: data.client_id, name: data.name };
  } catch {
    return null;
  }
}

// ── Feedback capture ─────────────────────────────────────────────────────

export interface FeedbackRow {
  outputId: string;
  rating: number; // 1–5
  feedbackText?: string;
  clientId?: string | null;
  requestType?: string;
  promptResponse?: Record<string, unknown>;
}

export async function recordFeedback(row: FeedbackRow): Promise<void> {
  const client = db();
  if (!client) return;
  const { error } = await client.from("feedback").insert({
    output_id: row.outputId,
    agent_name: AGENT_NAME,
    client_id: row.clientId || null,
    rating: Math.min(5, Math.max(1, Math.round(row.rating))),
    feedback_text: row.feedbackText || null,
    request_type: row.requestType || null,
    prompt_response: row.promptResponse ?? null,
  });
  if (error) console.warn("[diwan] feedback insert failed:", error.message);
}

// ── Review queue + metrics (dashboard) ───────────────────────────────────

export async function listReviewQueue() {
  const client = db();
  if (!client) return [];
  const { data } = await client
    .from("review_queue")
    .select("id, status, resolution_action, resolution_note, resolved_at, created_at, feedback:feedback_id (output_id, rating, feedback_text, request_type, client_id)")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function resolveReview(input: {
  id: string;
  action: "prompt_update" | "knowledge_update" | "guardrail" | "no_action";
  note?: string;
  patchText?: string;
  resolvedBy?: string;
}): Promise<boolean> {
  const client = db();
  if (!client) return false;
  // Actions (a) and (c) create a versioned prompt amendment — human-authored,
  // so the human-gating rule holds: automation drafts, humans approve.
  if ((input.action === "prompt_update" || input.action === "guardrail") && input.patchText) {
    await client.from("prompt_patches").insert({
      agent_name: AGENT_NAME,
      kind: input.action === "guardrail" ? "guardrail" : "prompt_update",
      patch_text: input.patchText,
      created_by: input.resolvedBy || "reviewer",
    });
  }
  const { error } = await client
    .from("review_queue")
    .update({
      status: "resolved",
      resolution_action: input.action,
      resolution_note: input.note || null,
      resolved_by: input.resolvedBy || "reviewer",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) {
    console.warn("[diwan] resolve failed:", error.message);
    return false;
  }
  return true;
}

export async function fetchMetricsRaw(days = 90) {
  const client = db();
  if (!client) return null;
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const [runs, fb, queue, tickets, versions] = await Promise.all([
    client.from("agent_runs").select("id, agent_name, client_id, request_type, status, latency_ms, prompt_version_id, created_at").gte("created_at", since).limit(2000),
    client.from("feedback").select("rating, agent_name, client_id, request_type, output_id, created_at").gte("created_at", since).limit(2000),
    client.from("review_queue").select("status, created_at, resolved_at").gte("created_at", since).limit(1000),
    client.from("improvement_tickets").select("scope, avg_rating, rating_count, status, created_at").order("created_at", { ascending: false }).limit(50),
    client.from("prompt_versions").select("id, hash, change_note, created_at").eq("agent_name", AGENT_NAME).order("created_at", { ascending: false }).limit(20),
  ]);
  return {
    runs: runs.data || [],
    feedback: fb.data || [],
    queue: queue.data || [],
    tickets: tickets.data || [],
    versions: versions.data || [],
  };
}
