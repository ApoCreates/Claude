export const meta = {
  name: 'studio-floor',
  description: 'Run the Aigency studio floor: brief → research → words → design → build → arabic → review, looping on review failures',
  whenToUse: 'Producing a complete Aigency artefact end to end — proposal, deck, carousel, document, page — when you want the whole line run deterministically rather than desk by desk.',
  phases: [
    { title: 'Brief',    detail: 'hear the room, set the intensity level, fix the spec' },
    { title: 'Research', detail: 'source every claim, cut what cannot be sourced' },
    { title: 'Words',    detail: 'write in the house voice, then cut' },
    { title: 'Design',   detail: 'set it in the house grid from the tokens' },
    { title: 'Build',    detail: 'render the real files, reproducibly' },
    { title: 'Arabic',   detail: 'RTL, shaping, rasterised inspection' },
    { title: 'Review',   detail: 'run the gates; loop until it passes' },
  ],
}

// args: { request: string, slug: string, arabic?: boolean, maxRounds?: number }
const req = args?.request
const slug = args?.slug
if (!req || !slug) throw new Error('studio-floor needs { request, slug }')

const dir = `.aigency/runs/${slug}`
const hasArabic = args?.arabic !== false
const maxRounds = args?.maxRounds ?? 3
const desk = (name, prompt, phase) =>
  agent(`Run desk. Job: ${req}\nRun directory: ${dir}\n\n${prompt}`,
        { agentType: name, label: name.replace('aigency-', ''), phase })

phase('Brief')
const brief = await desk('aigency-brief',
  `Write the brief to ${dir}/01-brief.md. Return the path, the intensity level, and any
   question that genuinely blocks the work.`, 'Brief')

phase('Research')
const research = await desk('aigency-research',
  `Read ${dir}/01-brief.md. Source every claim the artefact will need. Write
   ${dir}/02-research.md. Invent nothing.`, 'Research')

phase('Words')
await desk('aigency-words',
  `Read ${dir}/01-brief.md and ${dir}/02-research.md. Write the final copy to
   ${dir}/03-copy.md. Use only sourced facts.`, 'Words')

phase('Design')
await desk('aigency-design',
  `Read the brief and ${dir}/03-copy.md. Build the artefact source in ${dir}/04-design/
   and write ${dir}/04-design-notes.md. Render it and look at what you rendered.`, 'Design')

phase('Build')
await desk('aigency-build',
  `Read ${dir}/04-design-notes.md. Produce the real files in ${dir}/05-build/ and write
   ${dir}/05-build-notes.md with a one-command reproduce path.`, 'Build')

if (hasArabic) {
  phase('Arabic')
  await desk('aigency-arabic',
    `Handle the Arabic and RTL layout for this artefact. Rasterise and inspect the
     shaping — never report Arabic correct from a source diff. Write ${dir}/06-arabic.md.`, 'Arabic')
}

// Review loop: the reviewer cannot fix its own findings, so failures route back.
phase('Review')
let verdict = null
for (let round = 1; round <= maxRounds; round++) {
  verdict = await agent(
    `Review the artefact in ${dir}/05-build/ (source in ${dir}/04-design/). Run the gates,
     starting with: .claude/scripts/qc-gates.sh ${dir}
     Write ${dir}/07-review.md and return the verdict.`,
    { agentType: 'aigency-review', label: `review r${round}`, phase: 'Review',
      schema: {
        type: 'object',
        required: ['verdict', 'failures'],
        properties: {
          verdict: { type: 'string', enum: ['PASS', 'FAIL'] },
          failures: {
            type: 'array',
            items: {
              type: 'object',
              required: ['what', 'where', 'owner'],
              properties: {
                what:  { type: 'string' },
                where: { type: 'string' },
                owner: { type: 'string', enum: ['words', 'design', 'build', 'arabic', 'research'] },
              },
            },
          },
        },
      } })

  if (!verdict || verdict.verdict === 'PASS') break
  if (round === maxRounds) {
    log(`review still failing after ${maxRounds} rounds — stopping and reporting`)
    break
  }

  log(`review round ${round}: ${verdict.failures.length} failure(s) — routing back to the desks`)
  const byOwner = {}
  for (const f of verdict.failures) (byOwner[f.owner] ??= []).push(f)

  await parallel(Object.entries(byOwner).map(([owner, items]) => () =>
    desk(`aigency-${owner}`,
      `The review desk failed this artefact on findings you own. Fix each one in place,
       change nothing else, and return what you changed.\n\n` +
      items.map(f => `- ${f.what} (${f.where})`).join('\n'), 'Review')))
}

return { runDir: dir, brief, research, verdict }
