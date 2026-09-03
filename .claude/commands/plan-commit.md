You are in plan mode. Read the spec at $ARGUMENTS and the intent it links to.

Produce an implementation plan that names every file that changes, the order
of work, the tests that prove it, and the risks. Then interrogate your own
plan: what could this break, which step is riskiest, what alternatives did
you reject and why.

Iterate with me until an engineer who has never seen this conversation could
implement from the plan alone. Then write `docs/sdlc/plan-<slug>.md` using
docs/sdlc/plan-template.md and commit it as `plan: <slug>` before writing
any code. If implementation later departs from the plan, update plan.md in
the same commit.
