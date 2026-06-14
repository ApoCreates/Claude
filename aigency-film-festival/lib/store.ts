import {
  CrewMember,
  NewRating,
  NewSubmission,
  Rating,
  RatingSummary,
  Submission,
} from "./types";
import { makeId, shortId, slugify, average, round1 } from "./utils";

/**
 * Data layer with two interchangeable drivers:
 *  - Supabase (PostgREST over fetch) when SUPABASE_URL + SERVICE_ROLE are set.
 *  - In-memory (seeded) otherwise — for instant, zero-config demos.
 *
 * The in-memory store persists for the life of a server process. On Vercel's
 * serverless runtime that means it is NOT durable across cold starts — set up
 * Supabase (see supabase/schema.sql) before collecting real submissions.
 */

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = process.env.SUPABASE_POSTER_BUCKET || "posters";

export function storeMode(): "supabase" | "memory" {
  return SUPABASE_URL && SERVICE_ROLE ? "supabase" : "memory";
}

export type ListOpts = {
  cohort?: string;
  status?: Submission["status"];
  featuredOnly?: boolean;
  limit?: number;
};

// ── Pure helpers ─────────────────────────────────────────────────────────────

export function summarize(ratings: Rating[]): RatingSummary {
  if (!ratings.length) {
    return { count: 0, story: 0, craft: 0, ai: 0, emotion: 0, overall: 0 };
  }
  const story = round1(average(ratings.map((r) => r.story)));
  const craft = round1(average(ratings.map((r) => r.craft)));
  const ai = round1(average(ratings.map((r) => r.ai)));
  const emotion = round1(average(ratings.map((r) => r.emotion)));
  const overall = round1((story + craft + ai + emotion) / 4);
  return { count: ratings.length, story, craft, ai, emotion, overall };
}

function makeSlug(title: string): string {
  const base = slugify(title) || "film";
  return `${base}-${shortId(4)}`;
}

// ── Supabase (PostgREST) driver ──────────────────────────────────────────────

function sbHeaders(extra?: Record<string, string>): HeadersInit {
  return {
    apikey: SERVICE_ROLE,
    Authorization: `Bearer ${SERVICE_ROLE}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function sbFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...sbHeaders(), ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${text || res.statusText}`);
  }
  return res;
}

const sb = {
  async list(opts: ListOpts = {}): Promise<Submission[]> {
    const q = new URLSearchParams();
    q.set("select", "*");
    q.set("order", "created_at.desc");
    if (opts.cohort) q.set("cohort", `eq.${opts.cohort}`);
    if (opts.status) q.set("status", `eq.${opts.status}`);
    if (opts.featuredOnly) q.set("featured", "is.true");
    if (opts.limit) q.set("limit", String(opts.limit));
    const res = await sbFetch(`submissions?${q.toString()}`);
    return (await res.json()) as Submission[];
  },
  async getBySlug(slug: string): Promise<Submission | null> {
    const res = await sbFetch(`submissions?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    const rows = (await res.json()) as Submission[];
    return rows[0] || null;
  },
  async getById(id: string): Promise<Submission | null> {
    const res = await sbFetch(`submissions?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    const rows = (await res.json()) as Submission[];
    return rows[0] || null;
  },
  async create(row: Submission): Promise<Submission> {
    const res = await sbFetch("submissions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    const rows = (await res.json()) as Submission[];
    return rows[0];
  },
  async update(id: string, patch: Partial<Submission>): Promise<Submission | null> {
    const res = await sbFetch(`submissions?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    });
    const rows = (await res.json()) as Submission[];
    return rows[0] || null;
  },
  async addRating(row: Rating): Promise<Rating> {
    const res = await sbFetch("ratings", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    const rows = (await res.json()) as Rating[];
    return rows[0];
  },
  async listRatings(submissionId?: string): Promise<Rating[]> {
    const q = new URLSearchParams();
    q.set("select", "*");
    q.set("order", "created_at.asc");
    if (submissionId) q.set("submission_id", `eq.${submissionId}`);
    const res = await sbFetch(`ratings?${q.toString()}`);
    return (await res.json()) as Rating[];
  },
  async incrementVote(id: string): Promise<number> {
    const res = await sbFetch("rpc/increment_votes", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ sub_id: id }),
    });
    const out = await res.json();
    return typeof out === "number" ? out : Number(out) || 0;
  },
};

// ── In-memory driver (seeded) ────────────────────────────────────────────────

type MemDB = { submissions: Submission[]; ratings: Rating[] };

function seed(): MemDB {
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();
  const crew = (names: [string, string][]): CrewMember[] =>
    names.map(([name, role]) => ({ name, role }));

  const submissions: Submission[] = [
    {
      id: "demo-1",
      slug: "the-last-lighthouse-demo",
      title: "The Last Lighthouse",
      logline:
        "When the keeper of the world's final lighthouse loses the dawn, she must teach the dark to remember light.",
      youtube_url: "https://youtu.be/eRsGyueVLvQ",
      duration_seconds: 84,
      poster_url: null,
      team_name: "Group A",
      submitter_name: "Demo Trainee",
      submitter_email: "demo@example.com",
      crew: crew([
        ["Lina Haddad", "Director"],
        ["Omar Said", "Producer"],
        ["Yara Nseir", "Editor"],
      ]),
      ai_tools: "Image: Nano Banana Pro · Video: Runway Gen-4.5 · Audio: ElevenLabs v3",
      ai_disclosure: "All footage AI-generated; voice-over recorded by the team and cleaned in Adobe Podcast.",
      cohort: "Demo Cohort",
      category: "Narrative",
      status: "selected",
      award: null,
      featured: true,
      votes: 41,
      created_at: iso(220),
    },
    {
      id: "demo-2",
      slug: "salt-demo",
      title: "Salt",
      logline:
        "A fisherman's hands, a vanishing sea, and the one catch he refuses to let go.",
      youtube_url: "https://youtu.be/R6MlUcmOul8",
      duration_seconds: 72,
      poster_url: null,
      team_name: "Group B",
      submitter_name: "Demo Trainee",
      submitter_email: "demo@example.com",
      crew: crew([
        ["Tariq Mansour", "Director"],
        ["Hana Aziz", "Sound"],
      ]),
      ai_tools: "Image: Nano Banana 2 · Video: Veo 3.1 · Audio: Eleven Music",
      ai_disclosure: "Fully AI-generated picture and score. No real persons depicted.",
      cohort: "Demo Cohort",
      category: "Documentary / Factual",
      status: "awarded",
      award: "The Horizon",
      featured: true,
      votes: 67,
      created_at: iso(300),
    },
    {
      id: "demo-3",
      slug: "thirteen-windows-demo",
      title: "Thirteen Windows",
      logline:
        "On a sleepless night in a tall city, thirteen strangers are awake for the same reason.",
      youtube_url: "https://youtu.be/TLkA0RELQ1g",
      duration_seconds: 90,
      poster_url: null,
      team_name: "Group C",
      submitter_name: "Demo Trainee",
      submitter_email: "demo@example.com",
      crew: crew([
        ["Noor Khalil", "Director"],
        ["Sami Rahman", "Editor"],
        ["Dana Wael", "Writer"],
      ]),
      ai_tools: "Image: Nano Banana Pro · Video: Kling 3.0 · Audio: ElevenLabs v3",
      ai_disclosure: "AI-generated visuals from team-written prompts. Dialogue performed with consent-based TTS.",
      cohort: "Demo Cohort",
      category: "Experimental",
      status: "submitted",
      award: null,
      featured: true,
      votes: 23,
      created_at: iso(90),
    },
  ];

  const ratings: Rating[] = [
    { id: "r1", submission_id: "demo-1", juror: "Jury · A", story: 8, craft: 7, ai: 8, emotion: 9, notes: null, created_at: iso(120) },
    { id: "r2", submission_id: "demo-1", juror: "Jury · B", story: 9, craft: 8, ai: 7, emotion: 8, notes: "Strong last frame.", created_at: iso(110) },
    { id: "r3", submission_id: "demo-2", juror: "Jury · A", story: 9, craft: 9, ai: 9, emotion: 9, notes: "Complete and assured.", created_at: iso(130) },
    { id: "r4", submission_id: "demo-2", juror: "Jury · B", story: 9, craft: 8, ai: 9, emotion: 10, notes: null, created_at: iso(125) },
    { id: "r5", submission_id: "demo-3", juror: "Jury · A", story: 7, craft: 7, ai: 8, emotion: 7, notes: null, created_at: iso(60) },
  ];

  return { submissions, ratings };
}

// Persist across HMR / route invocations within one process.
const g = globalThis as unknown as { __aff_db?: MemDB };
function db(): MemDB {
  if (!g.__aff_db) g.__aff_db = seed();
  return g.__aff_db;
}

const mem = {
  async list(opts: ListOpts = {}): Promise<Submission[]> {
    let rows = [...db().submissions];
    if (opts.cohort) rows = rows.filter((r) => r.cohort === opts.cohort);
    if (opts.status) rows = rows.filter((r) => r.status === opts.status);
    if (opts.featuredOnly) rows = rows.filter((r) => r.featured);
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return opts.limit ? rows.slice(0, opts.limit) : rows;
  },
  async getBySlug(slug: string) {
    return db().submissions.find((r) => r.slug === slug) || null;
  },
  async getById(id: string) {
    return db().submissions.find((r) => r.id === id) || null;
  },
  async create(row: Submission) {
    db().submissions.unshift(row);
    return row;
  },
  async update(id: string, patch: Partial<Submission>) {
    const row = db().submissions.find((r) => r.id === id);
    if (!row) return null;
    Object.assign(row, patch);
    return row;
  },
  async addRating(row: Rating) {
    db().ratings.push(row);
    return row;
  },
  async listRatings(submissionId?: string) {
    const all = db().ratings;
    return submissionId ? all.filter((r) => r.submission_id === submissionId) : [...all];
  },
  async incrementVote(id: string) {
    const row = db().submissions.find((r) => r.id === id);
    if (!row) return 0;
    row.votes += 1;
    return row.votes;
  },
};

function driver() {
  return storeMode() === "supabase" ? sb : mem;
}

// ── Public API ───────────────────────────────────────────────────────────────

// Reads degrade gracefully: a database hiccup shows an empty festival, never a
// crashed page. Writes (below) still surface errors to the caller/API.
export async function listSubmissions(opts?: ListOpts): Promise<Submission[]> {
  try {
    return await driver().list(opts);
  } catch (e) {
    console.error("[store] listSubmissions failed:", e);
    return [];
  }
}
export async function getSubmissionBySlug(slug: string): Promise<Submission | null> {
  try {
    return await driver().getBySlug(slug);
  } catch (e) {
    console.error("[store] getSubmissionBySlug failed:", e);
    return null;
  }
}
export async function getSubmissionById(id: string): Promise<Submission | null> {
  try {
    return await driver().getById(id);
  } catch (e) {
    console.error("[store] getSubmissionById failed:", e);
    return null;
  }
}

export async function createSubmission(data: NewSubmission): Promise<Submission> {
  const row: Submission = {
    ...data,
    id: makeId(),
    slug: makeSlug(data.title),
    status: "submitted",
    award: null,
    featured: false,
    votes: 0,
    created_at: new Date().toISOString(),
  };
  return driver().create(row);
}

export function updateSubmission(id: string, patch: Partial<Submission>) {
  return driver().update(id, patch);
}

export async function addRating(data: NewRating): Promise<Rating> {
  const row: Rating = { ...data, id: makeId(), created_at: new Date().toISOString() };
  return driver().addRating(row);
}

export async function listRatings(submissionId?: string): Promise<Rating[]> {
  try {
    return await driver().listRatings(submissionId);
  } catch (e) {
    console.error("[store] listRatings failed:", e);
    return [];
  }
}

export async function incrementVote(id: string): Promise<number> {
  try {
    return await driver().incrementVote(id);
  } catch (e) {
    console.error("[store] incrementVote failed:", e);
    return 0;
  }
}

/** Map of submissionId → RatingSummary for a set of submissions. */
export async function summariesFor(ids: string[]): Promise<Record<string, RatingSummary>> {
  const all = await listRatings();
  const out: Record<string, RatingSummary> = {};
  for (const id of ids) {
    out[id] = summarize(all.filter((r) => r.submission_id === id));
  }
  return out;
}

export const POSTER_BUCKET = BUCKET;
