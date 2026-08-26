/** Studio store.
 *
 * Persistence is deliberately pluggable and honest about where it is running:
 *
 *   file    — a JSON file on disk. The default anywhere with a writable filesystem.
 *   memory  — a per-instance singleton. The fallback on serverless, where the
 *             filesystem is read-only and instances are recycled, so writes do
 *             NOT survive. The dashboard says so rather than pretending otherwise.
 *
 * Swapping in a real database means implementing `load`/`save` against it; the
 * schema is one table of posts. See .env.example.
 */
import { promises as fs } from "fs";
import path from "path";
import type { Post, StudioState } from "./types";
import { seedPosts } from "./seed";

const FILE = path.join(process.cwd(), ".aigency", "studio-data.json");

export type Driver = "file" | "memory";

interface Cache { state: StudioState | null; driver: Driver | null }
const g = globalThis as unknown as { __aigencyStudio?: Cache };
const cache: Cache = (g.__aigencyStudio ??= { state: null, driver: null });

function serverless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

export function driver(): Driver {
  return cache.driver ?? (serverless() ? "memory" : "file");
}

export function persistenceNote(): string {
  return driver() === "file"
    ? `Writing to ${path.relative(process.cwd(), FILE)}`
    : "In-memory only — this instance is serverless, so changes are lost when it recycles. Set a database to persist.";
}

async function load(): Promise<StudioState> {
  if (cache.state) return cache.state;
  if (!serverless()) {
    try {
      const raw = await fs.readFile(FILE, "utf8");
      cache.state = JSON.parse(raw) as StudioState;
      cache.driver = "file";
      return cache.state;
    } catch { /* first run — fall through to the seed */ }
  }
  cache.state = { posts: seedPosts() };
  cache.driver = serverless() ? "memory" : "file";
  if (!serverless()) await save();
  return cache.state;
}

async function save(): Promise<void> {
  if (!cache.state || serverless()) return;
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(cache.state, null, 2), "utf8");
  } catch { cache.driver = "memory"; }
}

export async function listPosts(): Promise<Post[]> {
  const s = await load();
  return [...s.posts].sort((a, b) => {
    const at = a.scheduledFor ?? a.createdAt;
    const bt = b.scheduledFor ?? b.createdAt;
    return at.localeCompare(bt);
  });
}

export async function getPost(id: string): Promise<Post | undefined> {
  return (await load()).posts.find(p => p.id === id);
}

export async function upsertPost(post: Post): Promise<Post> {
  const s = await load();
  const i = s.posts.findIndex(p => p.id === post.id);
  post.updatedAt = new Date().toISOString();
  if (i >= 0) s.posts[i] = post; else s.posts.push(post);
  await save();
  return post;
}

export async function deletePost(id: string): Promise<boolean> {
  const s = await load();
  const before = s.posts.length;
  s.posts = s.posts.filter(p => p.id !== id);
  await save();
  return s.posts.length < before;
}

export function newId(): string {
  return `post_${Math.random().toString(36).slice(2, 10)}`;
}
