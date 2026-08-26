/** Social connectors — shared contract.
 *
 * Every connector is a real client for its platform's documented publishing API.
 * None of them fake a post: with credentials present they make the actual HTTP
 * calls; without credentials they refuse and say which variables are missing.
 *
 * `dryRun` is the third state and the useful one — it returns the exact requests
 * the connector *would* send, so a payload can be inspected before any account
 * is connected.
 */

export type Platform = "instagram" | "tiktok" | "linkedin" | "x" | "youtube";

export type MediaKind = "text" | "image" | "video" | "carousel";

export interface PublishPayload {
  /** Caption / commentary / tweet text. */
  text: string;
  /** Publicly reachable media URLs. Most platforms pull rather than accept bytes. */
  mediaUrls?: string[];
  kind: MediaKind;
  /** Video title, where the platform has a separate title field. */
  title?: string;
}

/** One HTTP call in a publish sequence — recorded whether or not it was sent. */
export interface PublishStep {
  label: string;
  method: "GET" | "POST" | "PUT";
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  /** Absent on a dry run. */
  response?: { status: number; body: unknown };
}

export interface PublishResult {
  ok: boolean;
  platform: Platform;
  mode: "live" | "dry-run" | "not-configured";
  externalId?: string;
  url?: string;
  steps: PublishStep[];
  error?: string;
}

export interface ConnectorStatus {
  configured: boolean;
  missing: string[];
  present: string[];
}

export interface Connector {
  id: Platform;
  name: string;
  /** The documentation this implementation was written against. */
  docsUrl: string;
  /**
   * How the request shapes below were established.
   * "primary-docs" — read from the platform's own documentation during this build.
   * "unverified"   — written from prior knowledge and NOT re-checked in this build.
   */
  verified: "primary-docs" | "unverified";
  verifiedNote: string;
  capabilities: Record<MediaKind, boolean>;
  requiredEnv: { name: string; description: string }[];
  limits: { captionMax: number; mediaMax: number; rateLimit: string };
  status(): ConnectorStatus;
  publish(payload: PublishPayload, opts?: { dryRun?: boolean }): Promise<PublishResult>;
}

/** Never let a token reach a log, an API response, or the dashboard. */
export function redact(v: string | undefined): string {
  if (!v) return "";
  if (v.length <= 8) return "••••";
  return `${v.slice(0, 4)}••••${v.slice(-4)}`;
}

export function envStatus(required: { name: string }[]): ConnectorStatus {
  const present: string[] = [];
  const missing: string[] = [];
  for (const { name } of required) {
    if (process.env[name] && process.env[name]!.trim() !== "") present.push(name);
    else missing.push(name);
  }
  return { configured: missing.length === 0, missing, present };
}

export function notConfigured(platform: Platform, status: ConnectorStatus): PublishResult {
  return {
    ok: false,
    platform,
    mode: "not-configured",
    steps: [],
    error: `Not connected. Set ${status.missing.join(", ")} to publish to ${platform}.`,
  };
}

/** Shared fetch that records the call and never throws on a non-2xx. */
export async function send(
  step: Omit<PublishStep, "response">,
  init: RequestInit
): Promise<PublishStep> {
  try {
    const res = await fetch(step.url, init);
    const text = await res.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch { /* keep raw text */ }
    return { ...step, response: { status: res.status, body: parsed } };
  } catch (e) {
    return { ...step, response: { status: 0, body: { error: String(e) } } };
  }
}

export function stepFailed(step: PublishStep): boolean {
  const s = step.response?.status ?? 0;
  return s < 200 || s >= 300;
}
