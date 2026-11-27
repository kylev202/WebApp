# Layout

Grid: one column, max 600px, centred; gutters 18px (16 + 2 optical); full-bleed ground. Above 900px the column stays 600px and the tab bar docks under it: this is a phone tool, and a wider page would only stretch rows.
Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72. Inside a group ≤ 12; between groups ≥ 24 (1:2).
Radius rule: small, signage-like. Buttons and inputs 10px; sheets 16px top corners; inner = outer minus padding (a 10px button inside a 16px sheet with 6px gap). No cards: grouping by space and hairlines.
Targets: every control ≥ 44px tall; tab items 65 x 56; task rows ≥ 56.
Safe areas: top padding max(16px, env(safe-area-inset-top)); tab bar padding-bottom env(safe-area-inset-bottom).

## Screens (each a different layout family)
1. **Week: rail checklist.** Seen first: week numeral + goal. Second: first task. Third: status line.
   - Header block (≈150px): "Week 7" numeral 64px left, goal 22px under it, date line 13px, status line 15px semibold ("1 week behind").
   - Task rail: a 3px line in the phase colour down the left at x=30; each task a stop (26px circle) on the rail, text to the right, row ≥ 56px, whole row is the hit area.
   - "Still open from earlier weeks (n)": a disclosure row, quieter; opens the same rail list in muted ink.
   - Hours: label, "6.5 of 14 h" right-aligned, a track meter (HTML row, % width, 14 or 8 hour ticks), primary button "Log hours".
   - Note: textarea, 4 rows, autosave on pause.
2. **Roadmap: line diagram (SVG).** Seen first: status line. Second: the yellow "you are here". Third: next checkpoint.
   - Status strip at top; legend in one wrapping row (swatches + words).
   - Vertical line at x=34; months as stations (16px ring, name 17px semibold, month goal hidden); weeks as small ticks (8px) with week numbers; checkpoints as interchange rings (double ring) after each month; Oct to Dec as stations without week ticks.
   - Today = yellow dot with ink ring; Your progress = ink diamond; a bracket between them labelled with the gap.
   - Each month row is a 44px+ button over the drawing, opens a sheet with weeks, tasks and checkpoint.
3. **Skills: grouped route lists.** Group head (22px) with "n of m proven" and a 4-part count row; rows show a status glyph (ring, half, ring+dot, filled) plus the status word; tap opens the skill sheet.
4. **Projects: switch + spec list + table + checklist.** Two-option switch (Project 1 / Project 2). Description as a definition list (doc labels as terms). Stages: a timetable list, week number hanging left, stop glyph, doc task text. Targets: a 3-column table (Metric, Target, Latest). Guardrails: checklist rows.
5. **Profile: figure ledger + one chart.** Goals as two plain paragraphs (long-term at 22px). Then a ledger: label left, figure right (tabular), thin meter under each. DSA gets the one real chart: cumulative target steps vs logged problems by month (SVG, 160px tall). Uni marks list with "Add a mark". Recent changes list (who, what, when).
6. **Reports: two buttons + the latest report as a slip + history list.**

## Hierarchy check (390 x 844)
- Week: numeral → first task → status. The first task row starts at about y=230: visible without scrolling.
- Roadmap: status → yellow dot (auto-scrolled into view on open) → next checkpoint ring.
- Profile: plan complete figure → DSA chart → streak.
