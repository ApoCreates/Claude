// Claude models the tutor may call, ordered CHEAPEST-CAPABLE FIRST so every
// live generation costs as little as possible while still giving a strong,
// age-appropriate answer. Haiku 4.5 is the workhorse (fast, inexpensive, more
// than capable for tutoring young learners); Sonnet is only reached if no
// Haiku model is available on the account. The cascade also keeps the tutor
// live across account tiers.
export const MODEL_CASCADE = [
  "claude-haiku-4-5-20251001",
  "claude-haiku-4-5",
  "claude-3-5-haiku-latest",
  "claude-sonnet-5",
  "claude-3-5-sonnet-latest",
];
