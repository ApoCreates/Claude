/** Reads the studio floor's run directories — the artefacts the seven desks leave
 *  behind in .aigency/runs/<slug>/. Read-only: the desks write, the dashboard looks. */
import { promises as fs } from "fs";
import path from "path";

export interface Run { slug: string; artefacts: string[]; updatedAt: string | null }

const ROOT = path.join(process.cwd(), ".aigency", "runs");

export async function listRuns(): Promise<Run[]> {
  try {
    const entries = await fs.readdir(ROOT, { withFileTypes: true });
    const runs: Run[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const dir = path.join(ROOT, e.name);
      const files = await fs.readdir(dir).catch(() => [] as string[]);
      let updatedAt: string | null = null;
      try { updatedAt = (await fs.stat(dir)).mtime.toISOString(); } catch { /* ignore */ }
      runs.push({ slug: e.name, artefacts: files.filter(f => !f.startsWith(".")).sort(), updatedAt });
    }
    return runs.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  } catch {
    return [];
  }
}

export async function readArtefact(slug: string, file: string): Promise<string | null> {
  if (slug.includes("..") || file.includes("..") || path.isAbsolute(file)) return null;
  try { return await fs.readFile(path.join(ROOT, slug, file), "utf8"); } catch { return null; }
}
