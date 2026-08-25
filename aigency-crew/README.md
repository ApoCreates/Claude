# aigency-crew

Six CrewAI agents that go after the two things a studio actually runs out of:
money and clients. Three of them do the work, three of them check it, and a
loop controller decides when a pair has converged, stalled, or needs a person.

```
  ┌──────────────────┐        ┌────────────────────┐
  │ funding_scout    │ ◀────▶ │ funding_auditor    │   grants, prizes, credits
  ├──────────────────┤        ├────────────────────┤
  │ client_prospector│ ◀────▶ │ prospect_auditor   │   accounts with a "why now"
  ├──────────────────┤        ├────────────────────┤
  │ campaign_architect ◀────▶ │ campaign_auditor   │   emails, calls, social
  └──────────────────┘        └────────────────────┘
        produce                    double-check
```

## The six agents

| Agent | Does | Its auditor checks |
|---|---|---|
| `funding_scout` | Hunts non-obvious funding: newly launched programs, ones tagged under the wrong sector, corporate innovation funds, in-kind compute credits, residencies, prizes, procurement routes. Scores each on payoff, winnability, effort and proof. | `funding_auditor` — is it open, are we eligible, does the URL support the claim, is it actually hidden or just unread, did we already deliver it last cycle |
| `client_prospector` | Builds a ranked account list from the ICP, each with a **dated** trigger event and a publicly sourced route in. | `prospect_auditor` — does the company still exist and do that, is the trigger real and recent, is the contact a real person at a public source, was the fit score inflated, are two rows the same company |
| `campaign_architect` | Turns the approved list into a dated campaign: sequenced emails, call scripts, a social calendar, and the metrics that will judge it. | `campaign_auditor` — is every claim provable, does each personalised line trace to its evidence URL, opt-out present, spam triggers, brand voice, are the targets grounded in recorded performance |

Producers and auditors run on **different models** by default
(`AIGENCY_MODEL` vs `AIGENCY_AUDITOR_MODEL`), because a reviewer that shares
the producer's blind spot is decoration.

## The three loops

**1. The audit loop** (inside each pair, `loops.py`). Produce → audit → revise,
with rules that make it healthy rather than endless:

- a blocker finding never passes, at any score;
- clean and at or above the pass mark → accept immediately;
- improved by less than `min_improvement` → **stop**, the loop has stalled;
- scored *lower* than the round before → **stop and roll back** to the best draft;
- out of rounds → **escalate to a human** with the best draft and the reason.

Escalation is a normal outcome, not a failure. Grinding a fourth round out of
a stalled pair costs money and usually makes the artifact worse.

**2. The cycle loop** (`engine.py`). funding → clients → outreach. If the
campaign comes out weak *and* the campaign auditor's findings point upstream —
personalisation, ICP fit, trigger quality — the engine re-runs prospecting with
those findings in hand. If the findings are about the copy itself, it does not:
another prospecting cycle would not fix a voice problem. Bounded by
`flow.max_cycles`.

**3. The ledger loop** (`ledger.py`). Every audit writes durable *learnings*;
every delivered id is remembered. Both are read back into the next run's
prompts, so week two brings new names and does not relearn week one's lessons.
The one signal that is not agent-generated lives here too:

```bash
aigency-crew ledger record --campaign q3-launch --segment hospitality \
  --sent 240 --replies 19 --meetings 7 --won 2
```

That is what turns the next prospecting round from a guess into a correction.

## Quickstart

```bash
cd aigency-crew
python -m venv .venv && source .venv/bin/activate
pip install -e ".[tools,dev]"
cp .env.example .env          # add ANTHROPIC_API_KEY, optionally SERPER_API_KEY

python -m aigency_crew.main run --dry-run    # loop mechanics, no model calls
python -m aigency_crew.main run              # the real thing
```

`--dry-run` swaps the six agents for scripted stand-ins (`demo.py`) that return
fixed, obviously fictional artifacts and a scripted sequence of scores. It is
the fastest way to watch accept / revise / stall / escalate / recycle happen:

```
[funding] round 1: score 64.0, 1 blocker(s) -> revise (1 blocker(s); 2 round(s) left)
[funding] round 2: score 86.0, 0 blocker(s) -> accept (scored 86.0 >= 80.0 with no blockers)
[funding] 1 new learning(s) recorded for future runs
=== cycle 1 of 2 ===
...
[cycle 1] campaign scored 88.0; no upstream rework needed
```

Other commands:

```bash
aigency-crew serve                  # the portal (see below)
aigency-crew stage funding          # one workstream and its auditor only
aigency-crew flow                   # same run, via the CrewAI Flow
aigency-crew flow --plot            # write the flow diagram
aigency-crew ledger show            # learnings, delivered ids, campaign results
```

## The portal

```bash
pip install -e ".[portal]"
aigency-crew serve            # http://127.0.0.1:8000
```

A browser front end for driving the agents, because a CLI is a poor place to
read a campaign and a terrible place to approve one.

- **Launch** a run with per-run overrides (region, targets, campaign goal), or
  tick *scripted agents* to walk the whole portal with no API calls at all.
- **Gates.** The run does funding and stops. Clients cannot start until you
  approve funding; outreach cannot start until you approve the list. The API
  refuses an out-of-order start with a 409, not just the UI.
- **Every round is kept**, with the auditor's findings attached — score,
  blockers, verdict, and the fix it asked for. **Revert** to an earlier round
  and that becomes the version the next stage consumes.
- **Send a stage back** with an instruction. It reaches the agent as feedback
  that outranks its own judgement, and the re-run appends rounds rather than
  erasing the first attempt.
- **Evaluate** a stage 0–100 with a note. The note is written into the ledger
  as a standing rule, so your review teaches the next run instead of
  evaporating.
- **Download** any stage, any individual round, or the whole run as markdown.
- **Memory** page shows what the agents have learned and takes your real
  campaign numbers (sent / replies / meetings / won).

Everything is a plain form post over server-rendered HTML — no build step, no
bundler. `state/jobs/*.json` holds the runs, one readable file each, written
atomically so a background stage never corrupts what the browser is reading.

## Seeing the results

Raw artifacts land in `output/<run-id>/` as `funding.json`, `prospects.json`,
`campaign.json` and `run.json` — that shape is what the next run reads back.
For a human, render the digest:

```bash
aigency-crew report                 # writes output/<run-id>/report.md
aigency-crew report --print         # ...and prints it
aigency-crew report --run run-20260825-224755
```

The digest opens with each stage's score, how many rounds it took, and why the
loop stopped — anything that escalated is called out at the top, before the
work it produced. Then: funding ranked by probability-weighted value with the
"why it's under the radar" and the source link for each; the pipeline ranked by
fit with each account's dated why-now and who to contact; and the campaign as a
day-by-day sequence with its opt-out lines and the source behind every
personalised opener.

## Fill this in before the first real run

`knowledge/aigency_profile.md` is the engine's only source of truth about the
studio, and the campaign auditor treats it as the **complete** set of claims
the outreach copy may make. It ships with `TODO:` markers — entity facts,
licence type, case studies, headcount — left deliberately empty rather than
guessed at. Until they are filled:

- the funding auditor will flag eligibility conclusions that depend on them;
- the campaign auditor will score down any copy that leans on them.

That is the intended behaviour. A grant shortlist built on assumed entity facts
is worse than no shortlist, and an invented case study is the most expensive
mistake this system could make.

`knowledge/icp.yaml` defines who counts as a prospect. The scorer matches on
those strings, so keep them lowercase and specific.

## Configuration

`src/aigency_crew/config/settings.yaml` holds the defaults; `AIGENCY_*`
environment variables override them.

| Setting | Default | What it does |
|---|---|---|
| `loops.default.max_rounds` | 3 | Revision rounds before escalating |
| `loops.default.pass_score` | 80 | The bar an artifact must clear |
| `loops.default.min_improvement` | 3 | Below this gain, the loop is stalled |
| `loops.outreach.pass_score` | 85 | Higher — this one reaches real inboxes |
| `flow.max_cycles` | 2 | Cycle budget for upstream rework |
| `flow.recycle_score_floor` | 70 | Below this, consider re-prospecting |

Without `SERPER_API_KEY` the crews still run, but the agents are told there is
no search, instructed to mark every claim unverified, and the auditors score
that down. The degradation is loud on purpose — quiet degradation to confident
guessing is the failure mode worth engineering against.

## Layout

```
src/aigency_crew/
  settings.py            settings, paths, knowledge loading
  config/agents.yaml     the six agents
  config/tasks.yaml      produce / audit / revise for each workstream
  config/settings.yaml   loop policy, targets, models
  crews/                 CrewAI wiring — one Workstream class, three configs
  tools/scoring.py       deterministic grant and ICP scorers
  tools/crew_tools.py    those scorers, dedupe and recall, as agent tools
  guardrails.py          mechanical checks that run before the auditor agent
  loops.py               the stopping rules
  ledger.py              cross-run memory
  engine.py              the three pairs, wired into each other
  flow.py                the same run as a CrewAI Flow
  reporting.py           a finished run, rendered as readable markdown
  parsing.py             salvaging structured output from a prose answer
  portal/jobs.py         the gated job state machine (no web framework in it)
  portal/app.py          FastAPI routes + templates
  demo.py                scripted agents for --dry-run and tests
knowledge/               studio profile and ICP — edit these
state/ledger.json        what the engine remembers
output/<run-id>/         what it produced
```

## Two design notes

**Why the loop is not one sequential crew.** A three-task crew would run
produce → audit → revise unconditionally, every time. It could not accept a
good first draft, stop a stalled pair, roll back a regression, or escalate.
So each call is a single-agent crew and `loops.run_audited_cycle` drives the
sequence.

**Why two layers of checking.** Guardrails (`guardrails.py`) count items, look
for opt-out lines and evidence URLs, and reject on the spot — deterministic and
free. Auditor agents judge the things only judgement can: eligibility,
plausibility, whether a "trigger event" is really a trigger event. Spending an
audit round telling a producer it returned four items instead of eight wastes
the expensive layer on the cheap layer's job.

## Tests

```bash
pytest            # 219 tests, ~5s
```

The logic modules — `loops`, `ledger`, `engine`, `inputs`, `parsing`,
`tools.scoring`, `portal.jobs` —
import no CrewAI, so the stopping rules, the memory, and the orchestration are
all tested with scripted agents and no model in the room. `test_config_contract.py`
checks the YAML wiring: every task points at an agent that exists, every
`{placeholder}` is supplied, no producer audits itself.
