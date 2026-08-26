import { NextResponse } from "next/server";
import { connectorList } from "@/lib/studio/connectors";
import { driver, persistenceNote } from "@/lib/studio/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    storage: { driver: driver(), note: persistenceNote() },
    connectors: connectorList.map(c => {
      const s = c.status();
      return {
        id: c.id, name: c.name, docsUrl: c.docsUrl,
        verified: c.verified, verifiedNote: c.verifiedNote,
        capabilities: c.capabilities, limits: c.limits,
        requiredEnv: c.requiredEnv.map(e => ({ ...e, present: s.present.includes(e.name) })),
        configured: s.configured, missing: s.missing,
      };
    }),
  });
}
