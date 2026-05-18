export type Integration = {
  id: string;
  name: string;
  vendor: string;
  category: "ERP" | "Retail Scan" | "CRM" | "Logistics" | "Market Intel" | "Finance";
  status: "connected" | "syncing" | "error" | "pending";
  lastSync: string;
  recordsLastSync: number;
  notes?: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: "int-sap",
    name: "ERP — Sales orders & invoicing",
    vendor: "SAP S/4HANA",
    category: "ERP",
    status: "connected",
    lastSync: "2026-05-18 04:12",
    recordsLastSync: 184_312,
  },
  {
    id: "int-nielsen",
    name: "Retail scan data",
    vendor: "NielsenIQ",
    category: "Retail Scan",
    status: "connected",
    lastSync: "2026-05-18 02:30",
    recordsLastSync: 41_900,
    notes: "Weekly extract — next refresh Monday 02:00.",
  },
  {
    id: "int-salesforce",
    name: "Field sales & HORECA CRM",
    vendor: "Salesforce",
    category: "CRM",
    status: "syncing",
    lastSync: "2026-05-18 06:45",
    recordsLastSync: 3_120,
  },
  {
    id: "int-blueyonder",
    name: "Distribution & route planning",
    vendor: "Blue Yonder",
    category: "Logistics",
    status: "error",
    lastSync: "2026-05-17 22:01",
    recordsLastSync: 0,
    notes: "Auth token expired — re-issue required.",
  },
  {
    id: "int-mintel",
    name: "Competitive & market intel",
    vendor: "Mintel + manual",
    category: "Market Intel",
    status: "pending",
    lastSync: "—",
    recordsLastSync: 0,
    notes: "Awaiting vendor API credentials.",
  },
  {
    id: "int-netsuite",
    name: "GL & financial close",
    vendor: "NetSuite",
    category: "Finance",
    status: "connected",
    lastSync: "2026-05-18 03:50",
    recordsLastSync: 9_204,
  },
];
