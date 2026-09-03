Babysit the open PR for this branch until it is green and waiting only on
my approval.

Loop:
1. `gh pr view --json number,reviews,comments,statusCheckRollup` and
   `gh pr checks`.
2. List every unresolved review comment and every failing check.
3. Address each one. For review comments, reply in the thread with what
   you changed. Never edit test files to make a check pass.
4. Run build, typecheck, lint, test locally. Push.
5. Repeat until nothing is unresolved and all checks pass.

Do not merge. Do not approve. Report the final state and stop.
