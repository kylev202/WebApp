# Type

Analogy: a tram-stop timetable panel, read at arm's length, at night, in a moving tram.

## Choice: Overpass (one family), weights 400, 600, 800
- Shortlist: Overpass, Atkinson Hyperlegible Next, Public Sans (voice "Plain public service"), also seen: Fira Sans, Inclusive Sans, Libre Franklin.
- Specimen (`shots/specimen/mobile-390.png`): all three set the doc's Week 17 tasks cleanly at 17 px.
  - **Overpass wins**: descended from Highway Gothic (US road signs), so the signage lineage is real, not costume; slightly compact, which keeps long doc tasks to fewer lines at 390 px; the 800 weight makes a strong week numeral.
  - Atkinson Hyperlegible Next: the most legible, but its wide set adds a line to long tasks, and it has no link to signage.
  - Public Sans: made for the US Web Design System; outside government it reads as borrowed (library note).
- `log.mjs check --fonts "Overpass"`: no repeats.
- No second family, no mono (no identifiers to show), no italics except the doc's own (rendered as plain text; the seed strips formatting).

## Scale (fixed rem, product UI, ratio ~1.25 at the top)
| Token | Size | Line height | Tracking | Use |
|---|---|---|---|---|
| --t-meta | 13px | 1.35 | +0.01em | dates, "Done Tue 1 Dec", legend, tab labels |
| --t-small | 15px | 1.4 | 0 | secondary rows, helper text, report body |
| --t-body | 17px | 1.42 | 0 | tasks, skills, form inputs (≥16 stops iOS zoom) |
| --t-head | 22px | 1.2 | -0.005em | section heads, week goal, sheet titles |
| --t-title | 32px | 1.08 | -0.015em | screen titles |
| --t-display | 64px | 0.95 | -0.025em | the week numeral only |

## Details
- `font-variant-numeric: tabular-nums lining-nums` on body (every number in this app aligns or changes).
- `text-wrap: balance` on titles and heads; `pretty` on task text and notes.
- Sentence case everywhere. No all-caps labels.
- Real apostrophes in app copy. Doc text keeps its own punctuation, en dashes included (doc wording wins over the no-dash rule; app-authored copy never uses dashes).
- `font-synthesis: none`; only the three loaded weights are used.

## Loading
Google Fonts CSS2 (allowed by the artifact CSP): `Overpass:wght@400;600;800`, `display=swap`. Fallback stack `"Overpass", "Helvetica Neue", Arial, system-ui, sans-serif` with `size-adjust` not needed (Overpass and Arial differ little in x-height). Licence: SIL OFL.
