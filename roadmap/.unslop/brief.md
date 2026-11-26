# Brief: Placement Roadmap
Register: product     Mode: new     Size: L

## Core
- Who and where: Kyle, a second-year CS student at Swinburne (Hawthorn, Melbourne), on his iPhone inside the Claude app. Three study evenings a week (Mon, Tue, Thu) at his desk after uni, a Saturday afternoon project block, and a Sunday-night review where the doc tells him to "tick off the week's tasks and check the month's checkpoint". Quick ticks also happen one-handed on the tram home. Evenings dominate, so dark mode is a first-class theme, not an afterthought.
- Job: tick this week's tasks and see, in one glance, whether he is on track for a 2028 AI placement. Under 5 seconds from open to tick.
  Secondary: (1) the Sunday review: hours, checkpoint, a weekly report Claude can read; (2) keep Claude in the loop so any chat can advise from the same data.
- Voice words:
  - **A tram timetable** (rules out vague status words, KPI tiles and anything you have to interpret: every row says when and where you are).
  - **A pilot's logbook** (rules out confetti, badges and streak fireworks: entries are dated, signed by who made them, and the hours add up).
  - **A blunt tutor** (rules out cheerleading copy, emoji and "You've got this!": it says "2 weeks behind" plainly and names the next task).
- Reference: Massimo Vignelli and Bob Noorda's 1970s New York subway diagram, and Melbourne's own PTV network map. Borrow: a line you travel along, stops in order, interchanges that matter, and a "you are here" dot. Do not copy: their colours, Helvetica, or the map's geography.
- Real content: available = every month, week, task, checkpoint, target, project and guardrail in the doc (44 numbered weeks, 3 month blocks for Oct–Dec 2027, 121 tasks, 10 checkpoints, 2 projects, 5 guardrails), the weekly hours table (~14 break, ~8 semester), DSA targets by month, the 70% uni target, the long-term and 2028 goals.
  MISSING = Kyle's real progress (it starts empty), project metric targets for accuracy and refusal rate (the doc gives none), the exact 2027 Swinburne calendar (the doc says dates are approximate).
  SAMPLE = none in the shipped app. Test data used during the build is removed before handover.

## Audience and context
One user. Technical, reads code, distrusts fluff. Uses Claude as a study assistant across many chats, so the data must be legible to Claude through the db tools, not just to the page.
Week starts Monday, Australia/Melbourne time. Plan starts Monday 30 Nov 2026 (Week 1); today is before that, so the first state Kyle sees is "Week 1 starts Monday".

## Keep conventional / make distinct
- Conventional: bottom tab bar, native checkboxes behaviour (tap row to tick, undo by tapping again), iOS sheet for details, numeric keypad for hours, system share-free "Copy as text".
- Distinct: the roadmap as a line diagram you travel along; the type and colour system; the plain, logbook voice; who-did-what (Kyle or Claude) shown on entries.

## Information architecture
1. **This week (home)** — focal: the current week's title (its goal) and its 3–5 tasks as tick rows. Then hours this week vs plan (14 or 8), then a note field. Overdue tasks from earlier weeks appear under the list, quieter, so nothing is lost.
2. **Roadmap** — focal: an SVG line from Dec 2026 to Dec 2027, phases (Summer break, Semester 1, Mid-year break, Semester 2, Summer stretch, from the doc's routine table) as line segments, months as stops, checkpoints as interchange stations, "today" and "your progress" markers, ahead/behind in words. Tap a month: its weeks and tasks in a sheet.
3. **Skills** — eight groups; each skill row: name, status (not started / learning / can explain it / proven), date, optional evidence (https link or note). Skills are derived from the doc's tasks and keep links to the weeks that teach them.
4. **Projects** — Project 1 and Project 2: the doc's description, stages = the doc's tasks that build each project (ticking a task advances its stage), target metrics with the doc's targets and Kyle's measured values, and the five legal guardrails as a checklist per project.
5. **Profile** — long-term goal, 2028 placement goal, overall % complete, DSA solved vs the monthly targets, study streak, uni average vs 70%, recent activity (Kyle and Claude).
6. **Reports** — generate weekly or monthly: planned vs done, ahead/behind, blockers (overdue tasks and the week's note), next week's focus. Saved to the db; Copy as text.

Core flow: open app → This week → tap a task row → row ticks, count and progress update, activity entry written (by: kyle) → done.

## States the build must cover
Loading (db connecting, with a 10 s timeout note), empty db (not seeded yet: says so and that Claude seeds it), before plan start, mid-plan, after the weekly plan ends (Oct–Dec month blocks), all done, offline / db unavailable (read-only note), write rejected (say what failed, keep input), Claude-made change (marked "Claude" on the row and in activity), signed out / db null (explain the page needs the Claude app).

## Success criteria
- In 5 seconds Kyle sees which week it is, what is left this week, and whether he is ahead or behind.
- One tap ticks a task, and the roadmap, profile and next report reflect it.
- Every task string matches the doc word for word.
- A new Claude chat can read the current week, progress and latest report from the db.

## Open questions for the user
Written as assumptions in the plan message (skills list derived from tasks, hours target in transition weeks, streak definition, DSA count logged by hand).
