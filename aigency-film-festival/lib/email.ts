import { Submission } from "./types";
import { formatDuration } from "./utils";
import { parseYouTube, youtubeThumbnail, youtubeWatchUrl } from "./youtube";
import { BRAND, FESTIVAL } from "./brand";

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.FESTIVAL_FROM_EMAIL || "The Aigency Film Festival <onboarding@resend.dev>";
const NOTIFY = process.env.FESTIVAL_NOTIFY_EMAIL || BRAND.contactEmail;

export function emailConfigured(): boolean {
  return !!RESEND_KEY;
}

function posterFor(sub: Submission): string | null {
  if (sub.poster_url) return sub.poster_url;
  const ref = parseYouTube(sub.youtube_url);
  return ref ? youtubeThumbnail(ref.id) : null;
}

const C = BRAND.color;

/**
 * The organiser email IS the film's page: a designed, on-brand layout with
 * poster, title, logline, duration, and crew. Email clients don't run web
 * fonts/iframes, so we use serif fallbacks, a real poster <img>, and links
 * (the live page carries the YouTube player).
 */
export function renderFilmEmailHTML(sub: Submission, filmUrl: string): string {
  const poster = posterFor(sub);
  const ref = parseYouTube(sub.youtube_url);
  const watch = ref ? youtubeWatchUrl(ref) : sub.youtube_url;
  const crewRows = sub.crew
    .filter((m) => m.name.trim())
    .map(
      (m) => `<tr>
        <td style="padding:5px 0;font:600 15px Georgia,serif;color:${C.surface};">${esc(m.name)}</td>
        <td style="padding:5px 0;font:400 13px Arial,sans-serif;color:${C.mute};text-align:right;">${esc(m.role)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.paper};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">New film in the Official Selection — ${esc(sub.title)} (${formatDuration(sub.duration_seconds)})</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9E2D3;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.paper};border:1px solid #ded5c2;">

        <!-- header band -->
        <tr><td style="background:${C.surface};padding:24px 34px;">
          <div style="font:600 11px Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:${C.gold};">
            ${esc(FESTIVAL.name)}
          </div>
          <div style="font:400 12px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:rgba(244,239,229,0.55);margin-top:6px;">
            New submission · ${esc(sub.cohort || FESTIVAL.edition)}
          </div>
        </td></tr>

        ${
          poster
            ? `<tr><td style="padding:0;"><img src="${esc(poster)}" alt="${esc(sub.title)} poster" width="600" style="display:block;width:100%;height:auto;border:0;"/></td></tr>`
            : ""
        }

        <!-- body -->
        <tr><td style="padding:30px 34px 8px;">
          <div style="font:600 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${C.ochre};">
            ${formatDuration(sub.duration_seconds)} · ${esc(sub.category || "Film")} · ${esc(sub.team_name)}
          </div>
          <h1 style="margin:10px 0 0;font:400 38px Georgia,serif;line-height:1.05;color:${C.surface};letter-spacing:-0.5px;">
            ${esc(sub.title)}
          </h1>
          <p style="margin:16px 0 0;font:italic 400 19px Georgia,serif;line-height:1.4;color:${C.ochre};">
            ${esc(sub.logline)}
          </p>
        </td></tr>

        <!-- buttons -->
        <tr><td style="padding:24px 34px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:10px;">
              <a href="${esc(watch)}" style="display:inline-block;background:${C.gold};color:${C.surface};font:600 14px Arial,sans-serif;text-decoration:none;padding:13px 22px;">▶ Watch the film</a>
            </td>
            <td>
              <a href="${esc(filmUrl)}" style="display:inline-block;border:1px solid ${C.surface};color:${C.surface};font:600 14px Arial,sans-serif;text-decoration:none;padding:12px 22px;">Open the festival page</a>
            </td>
          </tr></table>
        </td></tr>

        <!-- crew -->
        <tr><td style="padding:22px 34px 0;">
          <div style="border-top:1px solid #ded5c2;padding-top:18px;">
            <div style="font:600 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${C.mute};margin-bottom:8px;">Crew</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${crewRows || `<tr><td style="font:400 14px Georgia,serif;color:${C.mute};">—</td></tr>`}</table>
          </div>
        </td></tr>

        <!-- ai meta -->
        <tr><td style="padding:18px 34px 4px;">
          <div style="border-top:1px solid #ded5c2;padding-top:18px;">
            <div style="font:600 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${C.mute};margin-bottom:6px;">AI toolchain</div>
            <div style="font:400 14px Georgia,serif;color:${C.surface};line-height:1.5;">${esc(sub.ai_tools || "—")}</div>
            <div style="font:400 13px Arial,sans-serif;color:${C.mute};line-height:1.5;margin-top:10px;"><em>Disclosure.</em> ${esc(sub.ai_disclosure || "—")}</div>
          </div>
        </td></tr>

        <!-- footer -->
        <tr><td style="padding:24px 34px 30px;">
          <div style="border-top:1px solid #ded5c2;padding-top:16px;font:400 12px Arial,sans-serif;color:${C.mute};line-height:1.6;">
            Submitted by ${esc(sub.submitter_name)} · ${esc(sub.submitter_email)}<br/>
            <span style="font:italic 400 13px Georgia,serif;color:${C.ochre};">AI for the better.</span> &nbsp;·&nbsp; ${esc(BRAND.contactEmail)}
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table></body></html>`;
}

function renderConfirmationHTML(sub: Submission, filmUrl: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#E9E2D3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E9E2D3;padding:30px 14px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.paper};border:1px solid #ded5c2;">
        <tr><td style="background:${C.surface};padding:24px 34px;">
          <div style="font:600 11px Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:${C.gold};">${esc(FESTIVAL.name)}</div>
        </td></tr>
        <tr><td style="padding:32px 34px;">
          <h1 style="margin:0;font:400 32px Georgia,serif;line-height:1.1;color:${C.surface};">You're in the<br/>Official Selection.</h1>
          <p style="margin:18px 0 0;font:400 16px Georgia,serif;line-height:1.55;color:${C.surface};">
            Thank you, ${esc(sub.submitter_name)}. <em>${esc(sub.title)}</em> has been received and now has its own page in the festival.
          </p>
          <p style="margin:14px 0 0;font:400 15px Georgia,serif;line-height:1.55;color:${C.mute};">
            We'll screen it with the room and the jury will weigh the work. Keep the link — share it freely.
          </p>
          <div style="margin-top:24px;">
            <a href="${esc(filmUrl)}" style="display:inline-block;background:${C.gold};color:${C.surface};font:600 14px Arial,sans-serif;text-decoration:none;padding:13px 24px;">View your film's page</a>
          </div>
        </td></tr>
        <tr><td style="padding:0 34px 30px;">
          <div style="border-top:1px solid #ded5c2;padding-top:16px;font:italic 400 14px Georgia,serif;color:${C.ochre};">— The Aigency.</div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

async function resendSend(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_KEY) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
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

/**
 * Send the organiser the designed film-page email + the trainee a confirmation.
 * Never throws — a submission must succeed even if email delivery fails.
 */
export async function sendSubmissionEmails(
  sub: Submission,
  filmUrl: string
): Promise<{ organiser: boolean; confirmation: boolean; configured: boolean }> {
  if (!RESEND_KEY) {
    console.log(
      `[email] (demo) New submission "${sub.title}" — set RESEND_API_KEY to email ${NOTIFY}. Page: ${filmUrl}`
    );
    return { organiser: false, confirmation: false, configured: false };
  }
  const organiser = await resendSend(
    NOTIFY,
    `🎬 New film: ${sub.title} (${formatDuration(sub.duration_seconds)}) — ${sub.team_name}`,
    renderFilmEmailHTML(sub, filmUrl)
  );
  let confirmation = false;
  if (sub.submitter_email && sub.submitter_email !== NOTIFY) {
    confirmation = await resendSend(
      sub.submitter_email,
      `You're in — ${sub.title} · ${FESTIVAL.name}`,
      renderConfirmationHTML(sub, filmUrl)
    );
  }
  return { organiser, confirmation, configured: true };
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
