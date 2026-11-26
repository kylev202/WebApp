# Direction

## Seeds rolled (roll.mjs --n 3, no history)
- A: Japanese minimal + Craft heritage, botanical rose/leaf, carved civic serif, triage inbox. **Discarded**: rose and leaf come from no part of Kyle's world, and a carved serif fights 5-second ticking at 390 px.
- B: Data-dense terminal + Vaporwave, Barragán pink, newsprint serif, split view, constraint "borrow the structure of a printed object: timetable…". **Kept the constraint card** (Direction A is a timetable and line map). Pink drench and vaporwave irony discarded: the tutor voice is sincere.
- C: Dithered low-tech + Documentary photo, International orange committed on fog gray, clinical neutral type, constraint "contrast scale violently: one huge element". **Kept the palette and type voice** (Direction B) and **the constraint** (Direction B's week plate). Dithering and photography discarded: there are no photos of this world to use.

## Direction A: Line 28
Idea: the year is a tram line you ride from Dec 2026 to the 2028 placement; each week is a stretch of track, each task a stop, each checkpoint an interchange.
- Voice words on screen: *tram timetable* = every row has a date or a week number, hanging left like departure times; *pilot's logbook* = done stops carry the date and who ticked them; *blunt tutor* = the status line says "1 week behind" in the line's own signage type.
- Reference: Vignelli/Noorda NYC subway diagram and the PTV network map. Borrowed: line, stops, interchanges, "you are here".
- Type class: signage sans, two weights, big numerals. Candidates: Overpass (US highway-sign lineage), Public Sans, Atkinson Hyperlegible.
- Colour: neutral panels (white by day, graphite by night). Two **coded** line colours with one meaning each: Summer/Mid-year break (~14 h) and Semester (~8 h). One action accent, used only for ticks and the primary button.
- Layouts: Week = a short vertical line with the tasks as stops (tap the stop or the row). Roadmap = one vertical line scrolling Dec → Dec, months as stations, checkpoints as interchange rings, a "today" dot and a "your progress" dot; the gap between them is ahead/behind. Skills = route lists per group. Projects = two branch lines with stages as stops. Profile and Reports = timetable rows.
- Imagery: the line diagram itself, drawn from data. No illustration.
- Motion: feedback only. The stop fills on tick; sheets slide along the direction of travel. Off under reduced motion.
- Memorable thing: "My week is a stretch of tram line and ticking a task lights up the stop."
- Risks: decorative line colours that encode nothing (every colour maps to a routine, defined once in tokens); a map that is pretty but slow (Week screen stays a plain checklist with the line as a 2 px rail beside it).

## Direction B: Bench manual
Idea: the plan as an engineering manual and spec sheet, Braun / Teenage Engineering style: one huge orange plate with the week number, then ruled spec rows.
- Voice words: *timetable* = ruled rows with tabular figures; *logbook* = every row stamped with date and initials (K or C); *tutor* = blunt spec language ("Hours 6.5 / 14").
- Reference: Teenage Engineering OP-1 field manual and Dieter Rams's Braun product sheets. Borrowed: numbers as the hero, one signal colour, labelled parts. Not copied: their product imagery or fonts.
- Type class: DIN-like grotesque with real tabular figures, condensed cut for the giant numeral. Candidates: Barlow + Barlow Semi Condensed, Saira.
- Colour: **committed** International orange carries the top plate of every screen (30–40% of the first view); fog gray ground; graphite ink. Night: graphite ground, the orange plate dims to a burnt orange.
- Layouts: Week = orange plate (week number at ~120 px, goal, hours gauge) over a ruled checklist. Roadmap = an engineering schedule: months as columns of a horizontally scrolling chart, weeks as ruled ticks, plan vs done as two bars per month, checkpoints as rivets. Skills = spec table per group. Projects = parts list with stages and tolerances (targets). Profile = specification sheet. Reports = printed test report.
- Imagery: schedule chart and gauges drawn from data.
- Motion: none. States snap.
- Memorable thing: "The giant orange week number."
- Risks: fake serial numbers and mono costume (only the doc's real week numbers and dates appear; no part codes); density that slows the 5-second tick (the checklist sits directly under the plate, rows 52 px tall).

## Direction C: Graph-paper notebook
Idea: a CS student's squared notebook marked by a strict tutor: graphite text on a faint grid, your ticks in pencil, checkpoints marked in red pen.
- Voice words: *timetable* = a dated margin down the left like a ruled planner; *logbook* = pencil entries with dates; *tutor* = red-pen marks on checkpoints and on "behind".
- Reference: a Rhodia dot/grid pad and a marked exam script. Borrowed: the grid as structure, the red pen as the only colour that judges. Not copied: Rhodia's orange cover.
- Type class: humanist sans for text, a restrained hand for marks only (ticks, circled numbers). Candidates: Atkinson Hyperlegible + Caveat for marks.
- Colour: **restrained**: white paper with a 4% blue grid, graphite ink, red pen as the one accent (< 8% of any screen). Night: blueprint, white lines on deep ink blue.
- Layouts: Week = a notebook page with the date margin and hand-drawn tick boxes. Roadmap = a pencil timeline sketched across the grid, months as bracketed spans, the red pen circling where you are. Skills = a marked checklist. Projects = two worked pages. Profile = the cover sheet. Reports = a marked script.
- Imagery: hand-drawn SVG marks generated from data (tick strokes, circles, underlines).
- Motion: the pencil stroke draws the tick (180 ms); nothing else moves.
- Memorable thing: "The red-pen circle around this week."
- Risks: costume (hand marks only on ticks and circles, never on body text); cute instead of blunt (copy stays tutor-plain); cream-and-serif slop (paper is white, type is sans).

## Repeat check
`log.mjs check` for all three: no repeats (no history). Saturation: Transit wayfinding low, Industrial medium, Hand-drawn low. None is the category default for a study tracker (which would be a Dark SaaS or Bento dashboard with progress rings).

## Recommendation
**A: Line 28.** The roadmap is the screen that has to carry "where am I, ahead or behind", and a line you travel shows that without a chart legend. It comes from Kyle's own Melbourne, keeps interaction conventional (a checklist, a tab bar, sheets) and puts identity in the line, the signage type and the coded colours. B is the strongest for density but its plate pushes the tasks down on a 390 px screen; C is the warmest but hand marks at small sizes cost legibility on a tram at night.

## Chosen: (waiting for Kyle)
