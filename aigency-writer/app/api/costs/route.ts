import { getSpendSummary } from "@/lib/spend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Spending history + averages for the Spend panel. */
export async function GET() {
  return Response.json(await getSpendSummary());
}
