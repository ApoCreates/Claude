// Solo, client-only game. The platform requires a code module at the zip root;
// this is the required no-op rules stub (no imports, no timers).
export const meta = { game: "dubai-kindness-quest", minPlayers: 1, maxPlayers: 1 };
export function setup() { return {}; }
export function validateAction() { return { ok: true }; }
export function applyAction(state) { return state; }
export function isGameOver() { return { over: false }; }
export function viewFor(state) { return state; }
