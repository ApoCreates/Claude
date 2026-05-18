export type DemoUser = {
  email: string;
  name: string;
  role: "CEO" | "CFO" | "VP Sales" | "Analyst" | "Admin";
  team: string;
  avatarHue: number;
};

export const USERS: DemoUser[] = [
  { email: "ceo@demo.fnb",        name: "Eliana Reyes",     role: "CEO",       team: "Executive",    avatarHue: 340 },
  { email: "cfo@demo.fnb",        name: "Marcus Tatum",     role: "CFO",       team: "Finance",      avatarHue: 200 },
  { email: "vpsales@demo.fnb",    name: "Priya Aurand",     role: "VP Sales",  team: "Commercial",   avatarHue: 120 },
  { email: "analyst@demo.fnb",    name: "Jun Park",         role: "Analyst",   team: "Insights",     avatarHue: 40 },
  { email: "admin@demo.fnb",      name: "Riley Okafor",     role: "Admin",     team: "Platform",     avatarHue: 280 },
];

export function userByEmail(email: string) {
  return USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
