# Client deliverables — The Aigency

Discovery artifacts for the Unified Sales Intelligence Platform engagement.

| File | What it is |
|------|------------|
| `discovery-questions.pdf` | System-level technical deep dive (Business Central, LS Retail, Squirrel, Bayan, unification, security) with a "suggested approach" under each question. |
| `architecture.pdf` / `architecture.svg` | One-page reference architecture diagram. SVG is the editable source. |
| `build-pdfs.js` | Generates both PDFs from the SVG source and the inline question data. |

## Regenerating the PDFs

```bash
# from a scratch dir with network access
npm init -y && npm i pdfkit svg-to-pdfkit
node build-pdfs.js   # writes the PDFs next to this folder
```

## Conventions
- Branded **The Aigency · lab@ai-gency.ai**.
- `[Client]` and `[Date]` remain fill-in placeholders per engagement.
- Edit question content in the `SECTIONS` array of `build-pdfs.js`; edit the diagram in `architecture.svg`.
- Avoid Unicode arrows (→, ⇄) in PDF text — the standard PDF fonts don't carry those glyphs. Use "to" / "-" instead.
