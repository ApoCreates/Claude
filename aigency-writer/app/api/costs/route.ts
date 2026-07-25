import { RESEARCH_MONTHLY_BUDGET_USD } from "@/lib/costs";
import { getMonthSpendByType, getSpendSummary } from "@/lib/spend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Spending history + averages for the Spend panel. */
export async function GET() {
  const [summary, researchMonthUsd] = await Promise.all([
    getSpendSummary(),
    getMonthSpendByType("research"),
  ]);
  return Response.json({
    ...summary,
    research: { monthUsd: researchMonthUsd, budgetUsd: RESEARCH_MONTHLY_BUDGET_USD },
  });
}
