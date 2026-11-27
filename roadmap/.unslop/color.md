# Colour

Strategy: neutral panels with a **coded** pair of line colours and **one** accent (Transit wayfinding token sketch). Theme: both, equal; evenings dominate, so dark is designed, not inverted.

## Roles (light / dark), see tokens.color.light.css and tokens.color.dark.css
- Ground and surfaces: cool near-white `--bg`, `--surface`, `--surface-2` (chroma 0.003 to 0.007 toward 250); night graphite 0.19 / 0.235 / 0.285.
- Ink: `--ink` 16.8:1 light, 16.0:1 dark. `--ink-muted` ≥ 6:1 on every surface in both themes.
- **Line colours (data, not accents)**: `--line-break` orange (summer and mid-year break, ~14 h a week), `--line-sem` eucalyptus teal (semester, ~8 h). Used only for line segments, done-stop fills and legend swatches. Never text. Both ≥ 4:1 against the ground as graphics (3:1 needed).
- **Accent**: `--accent` signal yellow. Only for: the primary button (yellow text on an ink button in light mode, ink text on a yellow button in dark mode) and the "you are here" dot (yellow with an ink ring). Never on the light ground alone (1.44:1) and never for text on light.
- `--danger`: write errors and the overdue count number only (the "Still open" label is muted). 5.5:1 light, 6.3:1 dark.
- Placeholders use `--ink-muted` (7.2:1 light, 8.3:1 dark), never the UA grey.
- `--border` hairlines are decorative separators (no contrast requirement). Inputs and the unticked stop ring use `--border-strong` (4.2:1 light, 4.0:1 dark).
- Focus: 2px ring in `--focus` (ink by day, yellow by night) with 2px offset.

## Why these hues
- Orange for the summer break and teal for semester encode the doc's two routines; a stranger could not guess them from "study app" (category default is indigo or blue).
- Yellow comes from wayfinding (airport and tram-stop signage: yellow on black means "go here").

## Contrast report (contrast.mjs)
Light: ink/bg 16.82, ink/surface-2 14.09, ink-muted/surface-2 6.05, on-accent/accent 11.70, accent on ink 11.70, white on line-break 4.21, white on line-sem 5.58, line-break/bg 4.09, line-sem/bg 5.42, danger/surface 5.50, border-strong/bg 4.16.
Dark: ink/bg 15.96, ink-muted/surface-2 6.45, accent/bg 12.48, bg on line-break 7.67, bg on line-sem 8.37, danger/surface 6.27, border-strong/bg 3.97.
Expected fails, by rule: accent on light ground (never used), hairline border (decorative).
`log.mjs check --palette "neutral panels, coded orange and teal lines" --accent "signal yellow"`: no repeats.
