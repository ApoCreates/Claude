import type { Connector, Platform } from "./types";
import { instagram } from "./instagram";
import { tiktok } from "./tiktok";
import { linkedin } from "./linkedin";
import { x } from "./x";
import { youtube } from "./youtube";

export const connectors: Record<Platform, Connector> = { instagram, tiktok, linkedin, x, youtube };
export const connectorList: Connector[] = [instagram, tiktok, linkedin, x, youtube];
export function getConnector(p: Platform): Connector { return connectors[p]; }
export * from "./types";
