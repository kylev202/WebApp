# Content (refit to layout.md budgets, Phase 3)

## Voice rules
1. Short declaratives. One fact per sentence. Numbers as numerals with units ("6.5 of 14 h").
2. Second person, present tense, no exclamation marks, no emoji.
3. Say the state plainly: "2 weeks behind", "On plan", "1 week ahead". Never soften, never cheer.
4. Name the thing: "Week 7", "Project 1", "DSA problems", not "progress" or "journey".
5. Doc text is quoted exactly. App text never paraphrases a task.
6. Banned: journey, unlock, level up, crush, streak fire, empower, seamless, "You've got this", em dashes, "Oops".

## App name
- Chosen: **Placement Roadmap** (the doc's own words). Short form in the top bar: none needed; the screen title carries the place.
- Rejected: invented brand names (would add a name the doc never uses).

## Tabs (one word each, ≤ 8 characters)
Week · Roadmap · Skills · Projects · Profile · Reports

## This week
- Title: the doc's week heading split into number and goal: "Week 7" + "pandas" (goal = the heading's text after the colon).
- Date line (≤ 40 chars, app-formatted, no dashes): "11 to 17 Jan · Summer break · 14 h plan".
- Before start: "Starts Monday 30 Nov". After the numbered weeks: "October: Interviews" with the month block's tasks.
- Task row: the doc text; ticked rows show "Done Tue 12 Jan" and "· Claude" when Claude ticked it.
- Overdue group heading: "Still open from earlier weeks (n)".
- Hours: "Hours this week" · "6.5 of 14 h" · button "Log hours".
- Log sheet: fields "Date", "Hours", "DSA problems solved" (optional), button "Save log". Error: "Hours must be between 0.25 and 16."
- Note: label "Note for this week", helper "Blockers or anything Claude should know. Saved when you stop typing." Saved state: "Saved 9:41 pm".

## Layout budgets
- Task text: doc wording, any length; wraps under the stop, never truncated.
- Week goal: doc heading text, wraps to 2 lines at 22px.
- Tab labels ≤ 8 characters (fit 65px at 13px semibold).
- Buttons one line: "Log hours", "Save log", "Write weekly report", "Write monthly report", "Copy as text", "Add a mark", "Record a result", "Add evidence".

## Roadmap
- Title: "Dec 2026 to Dec 2027".
- Status line: "Week 7 of 44 · 1 week behind" | "On plan" | "1 week ahead".
- Legend words: "Summer break ~14 h", "Semester ~8 h", "Checkpoint", "Today", "Your progress".
- Month sheet: month title from the doc, "Month goal:" line, weeks with tasks, checkpoint with tick.

## Skills
- Group names: Programming · DSA · Maths · Data · Machine learning · AI engineering · Build and deploy · Career
- Status words: Not started · Learning · Can explain it · Proven
- Evidence: "Add evidence", fields "Link (https)" and "Note". Error: "Links must start with https://".
- Summary line per group: "3 of 8 proven".

## Projects
- Section names: "Stages", "Targets", "Legal guardrails".
- Metric labels: "Test accuracy", "Refusal rate", "Users", "Test questions". No target in the doc → "No target in the plan".
- Guardrail rows: the doc's bold label + text, tick per project.
- Log metric: "Record a result", fields "Value", "Date". Button "Save result".

## Profile
- "Long-term goal", "2028 placement", "Plan complete", "DSA problems", "Study streak", "Uni average", "Recent changes".
- Streak unit: "study days in a row". Helper: "Wed, Fri and Sun are work days and don't break it."
- Uni marks: "Add a mark", fields "Unit", "Assessment", "Mark (%)". Empty: "No marks yet. Add one when results come out."

## Reports
- Buttons: "Write weekly report", "Write monthly report", "Copy as text".
- Copied: "Copied". Copy refused: "Couldn't copy. Select the text and copy it by hand."
- Empty: "No reports yet. Write one on Sunday night after you tick off the week."

## System states
- Loading: "Opening your roadmap…" After 10 s: "Can't reach your saved data yet. Ticks will save once it connects."
- Not seeded: "Your plan isn't loaded yet. Ask Claude to seed the roadmap from your doc."
- No db: "This page saves to your Claude account. Open it in the Claude app while signed in."
- Write failed: "Couldn't save that tick. Tap to try again." (row stays as it was)
- Read-only: "You can view this roadmap but not change it."

## Missing facts to request from the user
- Accuracy and refusal-rate targets for both projects (the doc gives none; app shows measured values only).
