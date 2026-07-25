/**
 * Deliverable emails via Resend (same pattern as the film-festival app):
 * plain fetch, RESEND_API_KEY gates everything, never throws — a task run
 * must succeed even if delivery fails.
 */

import type { AgentTask } from "./tasks/types";

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.QALAM_FROM_EMAIL || "Qalam · Aigency Writer <onboarding@resend.dev>";

export function emailConfigured(): boolean {
  return !!RESEND_KEY;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Qalam-branded deliverable email: dark ink panel, gold accent, the
 * deliverable rendered with dir="auto" so Arabic paragraphs sit RTL.
 */
export function renderTaskEmailHTML(task: AgentTask, appUrl: string): string {
  const body = esc(task.result || "").replace(/\n/g, "<br/>");
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0b0e14;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0e14;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#10141d;border:1px solid #2e3750;border-radius:12px;">
        <tr><td style="padding:26px 34px;border-bottom:1px solid #212838;">
          <div style="font:600 11px Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#d4a545;">Qalam · قَلَم — Aigency Writer</div>
          <div style="font:400 12px Arial,sans-serif;color:#7482a3;margin-top:6px;">Daily deliverable · ${esc(task.mode)} · ${new Date().toISOString().slice(0, 10)}</div>
        </td></tr>
        <tr><td style="padding:28px 34px 8px;">
          <h1 style="margin:0;font:600 26px Georgia,serif;line-height:1.15;color:#e8ebf3;" dir="auto">${esc(task.title)}</h1>
        </td></tr>
        <tr><td style="padding:18px 34px 26px;">
          <div dir="auto" style="font:400 15px Georgia,'Noto Naskh Arabic',serif;line-height:1.7;color:#cdd4e4;">${body}</div>
        </td></tr>
        <tr><td style="padding:0 34px 30px;">
          <a href="${esc(appUrl)}" style="display:inline-block;background:#d4a545;color:#0b0e14;font:600 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;border-radius:8px;">Review on the task board</a>
          <div style="font:400 12px Arial,sans-serif;color:#4a5573;margin-top:18px;line-height:1.6;">
            Approve or request changes on the board — your notes become permanent lessons in the agent's brain.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export async function sendTaskEmail(
  to: string,
  task: AgentTask,
  appUrl: string
): Promise<boolean> {
  if (!RESEND_KEY) {
    console.log(`[email] (demo) would send "${task.title}" to ${to} — set RESEND_API_KEY.`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject: `✒️ ${task.title} — today's deliverable from Qalam`,
        html: renderTaskEmailHTML(task, appUrl),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[email] Resend ${res.status}: ${await res.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[email] send failed:", e);
    return false;
  }
}
