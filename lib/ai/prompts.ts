import { PRODUCTS } from "../data/products";
import { COMPETITORS, categoryShare } from "../data/competition";
import { ytdRevenue, priorPeriodRevenue, revenueByCategory, revenueByChannel, topSkus } from "../data/sales";

export function businessContext(): string {
  const { recent, prior } = priorPeriodRevenue(30);
  const cats = revenueByCategory();
  const chans = revenueByChannel();
  const top = topSkus(6);
  return [
    "Company: a mid-sized US food & beverage manufacturer with brands Aurora (soda), Verde (juice), Glacio (water), Volt (energy), Solace (tea), Pasture (dairy).",
    `Trailing 90-day revenue: $${ytdRevenue().toLocaleString()}.`,
    `Last 30 days vs prior 30: $${recent.toLocaleString()} vs $${prior.toLocaleString()} (${(((recent - prior) / prior) * 100).toFixed(1)}%).`,
    `Revenue by category: ${cats.map((c) => `${c.category} ${(c.share * 100).toFixed(0)}%`).join(", ")}.`,
    `Revenue by channel: ${chans.map((c) => `${c.channel} ${(c.share * 100).toFixed(0)}%`).join(", ")}.`,
    `Top SKUs: ${top.map((t) => `${t.name} ($${(t.revenue / 1e6).toFixed(1)}M, ${(t.growth * 100).toFixed(1)}% YoY)`).join("; ")}.`,
    `Key competitors: ${COMPETITORS.map((c) => `${c.name} (${c.marketSharePct}% share, ${c.trend})`).join("; ")}.`,
    `Active products (sample): ${PRODUCTS.slice(0, 8).map((p) => p.name).join(", ")}.`,
  ].join("\n");
}

export function competitorContext(id: string): string {
  const c = COMPETITORS.find((x) => x.id === id);
  if (!c) return "";
  const shareLines = c.categories.map((cat) => {
    const shares = categoryShare(cat);
    return `${cat}: ${shares.map((s) => `${s.brand} ${(s.share * 100).toFixed(0)}%`).join(", ")}`;
  });
  return [
    `Competitor: ${c.name}, HQ ${c.hq}, founded ${c.founded}.`,
    `Categories: ${c.categories.join(", ")}.`,
    `Estimated overall market share: ${c.marketSharePct}% (trend: ${c.trend}).`,
    `Threat level: ${c.threatLevel}.`,
    `Notable: ${c.notable}`,
    `Category dynamics:\n${shareLines.join("\n")}`,
  ].join("\n");
}

export const ANALYST_SYSTEM = `You are a senior commercial analyst embedded in a F&B/FMCG company.
You answer C-level questions about the business using the provided context.
Be concise, numeric, and recommendation-oriented. Always tie insights to one of: revenue, share, margin, distribution, or competitive risk.
If the question can't be answered from the context, say so plainly and propose what data you'd need.`;

export const COMPETITION_SYSTEM = `You are a competitive intelligence analyst.
Given a competitor profile, produce a brief that a CEO can read in 60 seconds: their likely strategy, the threat they pose to us, and 2-3 concrete countermoves we should consider.
Keep it under 220 words. Use short paragraphs, no bullet markup unless it helps.`;

export const SCENARIO_SYSTEM = `You are a strategic planning analyst.
Given a hypothetical scenario about pricing, distribution, portfolio, or marketing, return:
1) the most plausible 6-12 month revenue impact (range), 2) the top 3 drivers behind that impact, 3) the top 2 risks, and 4) a recommendation.
Be specific to F&B/FMCG dynamics. Under 240 words.`;
