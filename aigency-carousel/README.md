# The Studio Floor — Instagram carousel

A ten-frame Instagram carousel for **The Aigency**, built the same way as the reference
"AI content team" post: a cover that maps the whole team, one frame per employee, a summary,
and the ask — but set entirely in the Aigency brand rather than the reference's palette.

Frames are **1080 × 1350** (IG 4:5), rendered from HTML so the copy stays editable.

| # | Frame | Ground |
|---|---|---|
| 01 | Cover — Triple Hook + the seven-desk org chart | night |
| 02–08 | One desk each: Brief, Research, Words, Design, Build, Arabic, Review | paper |
| 09 | The floor — all seven in one line | paper |
| 10 | The ask — lockup, handle, contact | night |

## Build

```bash
npm install          # playwright (pinned to the preinstalled Chromium)
npm run render       # build.mjs → carousel.html, then render.mjs → frames/*.png
node qc.mjs          # overflow + IG safe-zone check
```

- `build.mjs` — all copy and structure. **Edit here**, not in `carousel.html` (it is generated).
- `icons.mjs` — the hairline mark set used in the toolkit cards.
- `carousel.css` — tokens and layout. Frame grounds swap via `.frame.night`.
- `qc.mjs` — fails loudly if a block overflows or if anything that matters falls below y=1130.

## Brand notes

- Tokens only, straight from `assets/tokens/aigency-core.css`. No pure black or white anywhere.
- Accent discipline: **ochre on paper, marigold on night** — never ochre on a dark ground.
- Type: Fraunces (display), Inter Tight (body), JetBrains Mono (eyebrows and furniture),
  IBM Plex Sans Arabic (the one Arabic word on frame 07, set at ×1.12 with no letterspacing).
- The close frame rebuilds the official vertical lockup from its parts — sun / wordmark /
  tagline at the sanctioned **190 : 52 : 116 : 36 : 40** ratio — because the supplied
  `aigency-logo-lockup-4k.png` is the ink colourway and disappears on a night ground.
- PNG marks throughout, so exports never regress.
- Safe zones held: 120px top, 220px bottom, 88px sides. Only footer furniture sits in the
  bottom strip; the page counter clears Instagram's own carousel bubble.

### Deliberate deviation

`references/03-formats.md` § C defaults social frames to a night ground. Here only the cover
and the close are night; frames 02–09 are paper, following the deck structure in QC gate 5
(dark cover → light content → dark close). Seven diagram-led frames on night would have
buried the hairline schematics. Say the word and the interior frames flip.

### Copy

Drafted from the brand book's own documented practice, so the claims are ones the studio can
stand behind. No client names, no invented figures — the only numbers are internal and true
(seven desks, six QC gates, two languages). Worth a read-through before it posts.
