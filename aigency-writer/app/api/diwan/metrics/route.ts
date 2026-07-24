import { diwanEnabled, fetchMetricsRaw } from "@/lib/diwan/db";

export const runtime = "nodejs";
// GET with no request args would be statically prerendered, freezing the
// build-time "enabled: false" response forever — force per-request eval.
export const dynamic = "force-dynamic";

/**
 * Per-client and global metrics for the dashboard: rating trend, output
 * volume, flag rate, resolution time, and rating impact per prompt
 * version. These are the hard numbers for award/investor conversations.
 */
export async function GET() {
  if (!diwanEnabled()) {
    return Response.json({ enabled: false });
  }
  const raw = await fetchMetricsRaw(90);
  if (!raw) return Response.json({ enabled: false });

  const { runs, feedback, queue, tickets, versions } = raw;

  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;

  // Weekly rating trend
  const byWeek = new Map<string, number[]>();
  for (const f of feedback) {
    const week = f.created_at.slice(0, 10).slice(0, 8) + "w"; // coarse bucket
    const d = new Date(f.created_at);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    void week;
    if (!byWeek.has(key)) byWeek.set(key, []);
    byWeek.get(key)!.push(f.rating);
  }
  const trend = [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, ratings]) => ({ week, avgRating: avg(ratings), count: ratings.length }));

  // Segments
  const segment = (key: "request_type" | "client_id") => {
    const m = new Map<string, number[]>();
    for (const f of feedback) {
      const k = (f as Record<string, string | number>)[key] as string | null;
      if (!k) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(f.rating);
    }
    return [...m.entries()]
      .map(([k, ratings]) => ({ key: k, avgRating: avg(ratings), count: ratings.length }))
      .sort((a, b) => (a.avgRating ?? 9) - (b.avgRating ?? 9));
  };

  // Rating impact per prompt version
  const runVersion = new Map(runs.map((r) => [r.id, r.prompt_version_id]));
  const byVersion = new Map<string, number[]>();
  for (const f of feedback) {
    const v = runVersion.get(f.output_id);
    if (!v) continue;
    if (!byVersion.has(v)) byVersion.set(v, []);
    byVersion.get(v)!.push(f.rating);
  }
  const versionImpact = versions.map((v) => ({
    id: v.id,
    hash: v.hash,
    createdAt: v.created_at,
    avgRating: avg(byVersion.get(v.id) || []),
    ratings: (byVersion.get(v.id) || []).length,
  }));

  const resolved = queue.filter((q) => q.status === "resolved" && q.resolved_at);
  const resolutionHours = avg(
    resolved.map(
      (q) => (new Date(q.resolved_at!).getTime() - new Date(q.created_at).getTime()) / 3600_000
    )
  );

  return Response.json({
    enabled: true,
    summary: {
      outputs: runs.length,
      errors: runs.filter((r) => r.status === "error").length,
      avgLatencyMs: avg(runs.map((r) => r.latency_ms || 0).filter(Boolean)),
      ratings: feedback.length,
      avgRating: avg(feedback.map((f) => f.rating)),
      flagRate: feedback.length
        ? Math.round((feedback.filter((f) => f.rating <= 2).length / feedback.length) * 100)
        : 0,
      openFlags: queue.filter((q) => q.status === "open").length,
      avgResolutionHours: resolutionHours,
    },
    trend,
    byRequestType: segment("request_type"),
    byClient: segment("client_id"),
    versionImpact,
    tickets,
  });
}
