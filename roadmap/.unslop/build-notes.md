# Build notes

## Files
- `roadmap/index.html`: the whole app (one self-contained page: tokens, six screens, db wiring). Published as a Claude artifact.
- `roadmap/seed/build_seed.py`: builds the db seed from the roadmap doc's XML (doc wording copied, never retyped). Output in `roadmap/seed/out/` is git-ignored because it holds the doc's text (visa and work details) and the repo is public.
- `roadmap/test/mock-db.js`, `roadmap/test/run.js`: a local stand-in for the db capability and a Playwright run at 390 x 844 (light and dark), with a fixed Melbourne date.

## Preview
- Real: open the artifact in the Claude app (needs the `db` and `user` capabilities, declared after publish).
- Local: `python3 -I roadmap/seed/build_seed.py <doc.xml> roadmap/seed/out` then `node roadmap/test/run.js` (screens in `.unslop/shots/test/`).

## Results
- `lint.mjs index.html`: clean (side-stripe on status notes removed).
- Test run: 39 checks pass: no overflow at 390 on all six screens in both themes, no script errors, tick / log hours / note / weekly and monthly report / skill / guardrail writes all land with `by: "kyle"`, `updatedAt` and an activity entry; states before start, October month block, no db, empty db.

## Deviations and notes
- Overpass's U+00B7 middle dot has zero advance width (font bug), so on-screen separators use U+2219.
- Doc wording keeps its own en dashes and lowercase starts ("Month goal: comfortable with…"). Only the first letter of goal and project headings is capitalised on screen; stored text is unchanged.
- Six tabs (iOS convention is five): Kyle listed six screens; each tab is 65 x 56 px.
- No `[MISSING]` copy. Project accuracy and refusal targets show "No target in the plan" (the doc gives none).
