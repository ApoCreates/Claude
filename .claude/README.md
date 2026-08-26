# The Aigency — the studio floor

Seven agents that make things the way the studio makes things, plus the checks that
decide whether the work is allowed to leave.

This is the working version of the floor. The carousel in `aigency-carousel/` is a
picture of it; these are the desks.

## The desks

| Desk | Agent | What it does | Leaves behind |
|---|---|---|---|
| 01 | `aigency-brief` | Hears the room, sets the intensity level, fixes the format spec and the scope | `01-brief.md` |
| 02 | `aigency-research` | Sources every claim, cuts what it cannot source | `02-research.md` |
| 03 | `aigency-words` | Writes in the house voice, then cuts | `03-copy.md` |
| 04 | `aigency-design` | Sets it in the house grid from the tokens | `04-design/` |
| 05 | `aigency-build` | Renders the real files, reproducibly | `05-build/` |
| 06 | `aigency-arabic` | Arabic, RTL, and the rasterised shaping check | `06-arabic.md` |
| 07 | `aigency-review` | Runs the QC gates and returns a verdict | `07-review.md` |

Every desk loads the `the-aigency-brand` skill before it produces anything, so the
tokens, the voice rules and the format specs come from one place rather than seven
approximations of it.

## Running it

**The whole line:**

```
/floor a one-page capability profile for a government AI-literacy programme
```

The command creates `.aigency/runs/<slug>/`, walks the desks in order, stops the line
when the brief hits a blocking question or research cannot source a load-bearing claim,
and loops on review failures until the artefact passes.

**One desk on its own** — normal Agent invocation, e.g. `aigency-review` against
something that already exists:

```
Use the aigency-review agent to run the gates on aigency-carousel/
```

**Deterministic, many agents in parallel** — the workflow script, for when you want the
line run as one orchestrated job rather than turn by turn:

```
Workflow({ name: "studio-floor", args: { request: "...", slug: "capability-profile" } })
```

It fans failures back to the owning desks in parallel between review rounds. Workflows
spawn a lot of agents and cost real tokens, so it only runs when you ask for it.

## The gate script

```bash
.claude/scripts/qc-gates.sh <path>...
```

Gate 1 from the brand skill, runnable: pure black and white, the spelling and styling of
The Aigency, the domain and handle, Dubai, forbidden vocabulary, "Apo" in formal <!-- qc-allow -->
material, ochre on a dark ground, SVG marks in export-bound files. Non-zero exit on any
hard failure; warnings are judgement calls and never fail the run.

It is a plain shell script — use it in a hook, in CI, or on its own, not only through
the review desk.

## Two decisions worth knowing about

**The reviewer has no Write or Edit.** It reports; the desk that made the defect fixes
it; then it checks again. A reviewer that quietly patches what it finds destroys the
only independent read the artefact gets, and the review loop in `/floor` and the
workflow exists because of that constraint rather than in spite of it.

**No desk invents a number.** Research cuts what it cannot source, and words writes only
from what research left behind. An unsourced figure is treated as a defect, not a
placeholder — which means the honest output of a thin research pass is a smaller
artefact, not a padded one.

## Adding a desk

Drop a new `.md` in `.claude/agents/` with `name`, `description` and `tools`
frontmatter, give it a numbered artefact in the run directory, and add it to the table
in `commands/floor.md` and to `workflows/studio-floor.js`. Keep the tool grant to what
the desk actually needs — the constraint is the design.
