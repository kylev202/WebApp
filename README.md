# Loop

My personal life manager for iPhone: diet, gym, sleep, uni, work and money in one place.

The full plan, decisions and roadmap are in [PLAN.md](PLAN.md). Design mockups are in [`design/`](design/).

## What's new in v5.1: one design system, and a dark theme

Loop had grown from six cards on a screen to sixty numbers on one, and the soft
pastel "Liquid Glass" look hadn't grown with it. Every surface was the same
frosted pane, so nothing sat in front of anything else; the tile colours were
candy bright, so six of them on one screen shouted over the data; and the type,
spacing and corners had been chosen rule by rule, so nothing lined up with
anything. v5.1 is a pass over the whole look, taking its cue from **Bevel**:
calm, warm, editorial, data first.

- **Two materials, and the difference is the point.** A card is paper laid on
  the page: solid, a hairline, barely a shadow. Glass is kept for the things
  that genuinely float over it — the tab bar, the title bar, the pinned dock,
  sheets and toasts — which is what makes them read as floating. A long report
  used to stack a few dozen backdrop filters down the page; now it stacks none,
  and scrolls like it.
- **A palette instead of a paint box.** The six domain colours are re-pitched
  to one chroma and one lightness — sage, clay, iris, ochre, slate and teal —
  so a screen carrying several of them reads as one family. The ground is warm
  bone rather than blue-white, with three very low-chroma washes and a fine
  grain over it: depth, with no colour cast under the numbers.
- **Dark mode.** The whole sheet is tokens now, so dark is the same rules with a
  different set of values rather than a second stylesheet to keep in step. It
  follows your iPhone by default, and **Settings → Display → Appearance** pins
  Light or Dark. The choice is mirrored into `localStorage` so a pinned theme is
  already on screen at the first paint instead of flashing the other one.
- **Scales, not guesses.** One type ramp (`--fs-micro` … `--fs-3xl`), one weight
  ladder, one space scale and one radius scale. Display numbers are bigger and
  tracked tighter, and every figure that can change is `tabular-nums`, so a card
  never shifts under your thumb as it updates. Small-caps eyebrows label a
  block; the chapter heading carries the screen and now has real air above it.
- **The day leads.** The install hint and the backup nag used to be the first
  two things on Today, so the app opened on housekeeping. They moved to the
  foot of the screen — still unmissable on a screen you scroll anyway.
- **Contrast is checked, not eyeballed.** Every piece of text clears WCAG AA
  4.5:1 in both themes, verified by a script that composites each translucent
  ancestor to work out what a glyph is actually sitting on. Tertiary text used
  to aim at 4:1. **Increase contrast** and **Reduce transparency** still follow
  the iPhone's own settings, and now strengthen the hairlines too.

## What's in v5: built for the big iPhones

Every Health tab had grown into a long scroll of analytics and text (Diet ran to about seven screens). v5 restructures the screens around **glance first, depth on tap**, tuned for a one-handed 6.7" iPhone 15 / 16 Pro Max.

- **Screens stay whole, with a section bar.** Nothing is hidden behind a summary — a closed block tells you nothing about what is inside it — so every screen is one scroll, and a second row in the pinned dock names its sections (*Today · Meals · Report · Earlier*). A pill marks the section you are reading and slides to the one you tap, a hairline along the foot of the dock shows how far down the screen you are, and the names are reachable by keyboard with ←/→. Screens with no chapters of their own, like the money report, get a bar from their group labels.
- **Specialists are a strip, not a wall.** Each tab shows its specialist as a short card: who, their verdict, any alert, a three-line summary and **Full consult** / **Ask**. The whole consult (forecasts, findings, plan, red flags, the letter) opens as a sheet. On Overview the GP shows the wellbeing index as a ring and your care team as four tappable avatars with a status dot each.
- **Sub-tabs stay pinned.** On Health, Money and Plan the sub-tab switcher sticks under the title bar while you scroll, so switching never means scrolling back up; switching from deep in a tab opens the next one at its top.
- **One motion for both navigation bars.** The sub-tabs at the top now have the same liquid pill as the tab bar at the bottom: it stretches across to the new tab like a drop, squeezes and wobbles as it settles, and the new label hops. Pressing an item squashes it in both bars, and holding the current one swells its pill like a lens. All of it switches off with Reduce Motion.
- **Swipe between sub-tabs** anywhere on the page (Health → Overview, Gym, Diet, Sleep, Body), with a slide from that side. The calendar, timeline drags, inputs and anything that scrolls sideways keep their own gestures.
- **Overview tiles jump.** The six status tiles (sleep, calories, protein, water, training, weight) take you to the section that explains them.
- **Accessibility:** text now follows the iPhone's own **Text Size** (Settings → Display & Brightness), or pick one in **Settings → Display & accessibility** (Default, Large, Larger, Largest) with a live preview. The smallest text (9–10px) was raised to 10–11px, tertiary text contrast raised from about 3:1 to 4:1, and on Pro Max-width screens everything reads 4% larger. **Increase contrast** and **Reduce transparency** follow the iPhone's Accessibility settings automatically or can be switched on for Loop alone. Sub-tabs are announced as tabs, the section bar is one tab stop walked with the arrow keys (each name carrying aria-current), its names take a thumb-sized tap area, and the overview tiles say their value and status to VoiceOver.
- **App readiness:** launch screens for iPhone 16 Pro Max, 15/16 Plus & Pro Max, 16 Pro, 15 Pro and 14 (no more white flash on open), numbers are no longer auto-linked as phone numbers or dates, and the manifest gains an id, portrait orientation, categories and shortcuts.

## What's in v4

- **Gym (new):** pick a routine (Push/Leg/Pull, Upper/Lower, Full body or a body-part split) and edit every day, exercise, set and rep range. Start the next day from Today, log each set (kg × reps) with last session shown beside it, and tick sets off.
  - **Smart weights:** double progression. Beat last time by a rep; when every set hits the top of the range, Loop tells you to add weight.
  - **PRs:** heavier weight or higher estimated 1-rep max triggers a trophy and confetti.
  - **Rest timer** starts on each ticked set and chimes when it's time to go again.
  - **Plate calculator**, exercise history with strength line charts, weekly sets chart, custom exercises. Finishing a workout ticks the Gym habit.
  - **The anatomy figure (new):** an exercise never names the muscle it works — it shows it. The drawing is a pair of pictures ([`img/`](img/)) and every one of **17 muscle regions** is an outline traced from the artwork's own borders, laid over it in red with a multiply blend so the shading and line work still read through. Where many muscles must show at once — the week's volume, muscle recovery, a finished session, a routine day — the whole figure lights each muscle by how much work it got, and you can tap any of them for its weekly sets, where they come from and what else would hit it. Everywhere a single exercise appears, the same picture is cropped to a **close-up** of the muscle it works hardest, with anything else nearby shaded behind it. It is driven by a library of **261 exercises**, each mapped to those regions with primary and secondary muscles and a couple of form cues.
  - **Routine editor (new):** nothing you do here redraws the screen. Every edit patches the one card it touched, so the page keeps its scroll position, the keyboard stays up and the text you were typing stays put. **Drag a move by its handle** to reorder it; **hold a +/− stepper** and the sets or reps run on; one-tap **Strength / Hypertrophy / Pump** presets for a whole day (with Undo); **swap** straight from the row, keeping its sets, reps, rest and note; **move an exercise to another day**; a **rest override** and a **note** per exercise; and **supersets** — paired moves show a linked rail in the editor and in the live logger. Removing a day or an exercise happens at once and offers **Undo** instead of stopping you with a dialog. Each day shows its own body map, hard-set count and an estimated length.
  - **Exercise picker (new):** instant search across all 261 moves by name, gear or muscle ("lats" finds the pulldowns), muscle and equipment filter chips drawn from the library itself, a running match count, your most-used moves first and a small anatomy figure on every row. The search and the filters stay pinned while the list scrolls. It says how many of each move are already in the day you are filling, and it **stays open after an add** so a whole day goes in one tap at a time — the day card updates behind it as you go.
- **Custom icon set:** every emoji is replaced with Loop's own pastel duotone icons, including a habit icon picker.
- **Today:** workout card, weekly line chart, Diet, Sleep, Water and Weight cards, habits with streaks, today's food with Repeat yesterday.
- **Health:** Gym, Diet (today's macros + a full nutrition report), Sleep, Body (weight trend + bulk rate).
- **Logging:** meals (recent meals, any day), water (tap the drops), sleep, weigh-ins; tap any entry to edit, delete with Undo.
- iOS-style sheets you can swipe down, haptics, animations, offline, no account, data stays on the phone.

- **Plan (new):** agenda with a calendar you can expand from a week strip to a full month, swipe between weeks or months, jump to any date and tap back to today (classes, events, shifts, deadlines, invoices), **Uni** (courses, weekly timetable, assessments with marks, GPA on a 7 or 4-point scale, WAM, and "what do I need on the rest" for HD/D/C/P), **Work** (café shifts with weekday/Saturday/Sunday rates and expected pay, freelance clients, projects and invoices; marking an invoice paid or adding a week's pay records the income in Money) and **Tasks** (grouped by overdue, today, tomorrow, this week...).
- **Money (new):** monthly overview with spending vs budget-pace line, income/spent/saved, budgets per category, Westpac/Revolut/cash accounts, transfers (not counted as spending), foreign-currency notes, bills & subscriptions (tap Paid to log and roll the date), savings goals with an estimated finish date.
- **Today** now also shows Up Next, To-Do and a Money card.
- **Ask (new, centre ✦ tab):** chat with Google Gemini. Type or speak ("3 eggs and toast", "bench 3x8 at 60", "spent $18 at uni", "plan study for my exam") and it logs meals, water, sleep, weight, habits, workouts, routines, tasks, events, shifts, assessments, expenses, income and goals. Every logged item appears as a card with **Undo**. Attach a photo (roster, meal, receipt). It answers questions from your Loop data. Setup: paste a free key from aistudio.google.com/apikey; Loop picks the newest Flash model automatically.
- **Connections (new, Settings → Connections):**
  - **Bank CSV import** for Westpac and Revolut (and most bank CSVs): cleans merchant names, auto-categorises Australian merchants, skips duplicates and reverted payments, and spots Westpac → Revolut top-ups as transfers. Optional "sort with AI" for unknown merchants.
  - **Your relay** ([`relay/`](relay/)): a free Cloudflare Worker you own. It powers **Apple Pay logging** (Shortcuts Transaction automation → each tap lands in Money) and **Siri "Log to Loop"**, and passes **Canvas** requests through.
  - **Canvas sync:** units, assignments, due dates, weights (from assignment groups) and marks.
  - **Google Calendar (read-only):** events appear in the agenda and Up Next. Needs your own OAuth Client ID (guide in the app).
- **Day (new):** a `Summary / Day` switch on Today opens a close-up of one day on a single timeline — classes, shifts, events and workouts as blocks down the left, meals, spending and weigh-ins as dots down the right, a live "now" line between what's scheduled and what's happened. Add **blocks** for the time you actually spend (study, revision, reading, coding, admin, chores, social, rest): tap **Start** for a live timer, or tell Ask "studied 2 til 4". Plans you lay out ahead are hatched, and stay as an empty outline if the hour passes without them — the gap is the point. Hold any block or dot to **drag it to another time** (15-minute snap), or pull the **grip at a block's top or bottom edge to stretch it** — the pill above it reads the new hours and how long it now runs. Anything imported or backdated waits in **No time yet** until you place it. Quiet hours shrink so an empty afternoon costs a few pixels. Step back through any past day **or forward a fortnight** to lay one out, and leave a line in **How the day went** that the coach reads at the evening review.
  - **Checkpoint nudges:** at 2pm, 6pm and 10:30pm the coach looks at the day so far — protein against the hours left, a clear 90-minute gap worth studying in, a deadline with nothing logged against it, spending past its daily pace — and pins a note on the timeline. Costed once per checkpoint per day, so the free Gemini tier lasts; without a key the same facts show in plain text.

- **Day planner (new):** tell the bot to plan a day, or tap **Plan my day** on the Day view, and Loop lays the whole day out on the timeline in one go. It plans from the day's actual shape rather than a blank page: the classes, shifts, events and workouts already on it, the free runs left between them, what each assessment still owes in hours, your open tasks, and whether the routine says a training day is due. You can hand it a line of context first ("wrecked after last night — keep the morning light, COMP2123 draft before the shift") and set the hours of the day it may use.
  - **Nothing it suggests is taken on trust.** Every block comes back through the day's own arithmetic: snapped to the quarter hour, trimmed to the free run it overlaps most (a block lapping into your shift is cut back to the hour before it, not dropped), thrown out if nothing is left, and never laid over something already there. A study block tagged to an assessment credits its hours to that countdown. What didn't fit is said rather than hidden.
  - **It's a plan, not a verdict.** Every block it writes is an ordinary planned block, so you drag it to another hour, stretch it by its edge, tap to re-tag or rename it, tick it off or delete it like any other. **Replan** writes a new one over it, **Clear** takes it away, and both offer **Undo**. Blocks you planned by hand are left alone.
  - From Ask the same thing happens in the chat: it reads the day first, then lays it out in a single card with **Undo** on it, and can plan around what's already there instead of replacing it.

- **Study (new, Plan → Study):** an exam countdown and the planner behind it. The next assessment gets a big countdown with the hours it will cost (estimated from its weight, or your own number), how many you've done and what the rest comes to per day. **Plan my study** works backwards from each due date into the free runs of your days — classes, shifts and anything already on the timeline are left alone, the nearest deadline picks its slots first, sessions land on the quarter hour with a break between them and a daily ceiling you set. What doesn't fit is said plainly ("4.5 h short of 24 h by Sat 7 Nov") instead of being quietly dropped. Accepted sessions become planned blocks on the Day timeline, hatched until you tick them off; ticking one tells you where that leaves the countdown. Free runs of the day now show on the Day timeline as slots you can tap to fill, and any block can be tagged **Towards** an assessment so hours you start yourself count too.

- **Targets (new):** long-term goals the coach manages toward — body weight, WAM, GPA, money saved (pace against a deadline, with a projected landing date), or study hours, workouts, protein days and sleep a week (a four-week average against what you're aiming to keep up). They show on Today with how far ahead or behind pace you are, and in the weekly report.
- **A coach with a memory (new):** it keeps **standing notes about you**, rewritten once a week from its own briefings and reviews and carried into every later answer, so it can say "five weeks running" instead of treating today as new (Settings → *What your coach has noticed*). The **week in review** now compares against the eight weeks before it rather than describing the week alone. And it **proposes rather than changes**: a new protein target, a study block before a deadline, a task, a long-term target — each arrives as a card on Today with **Accept** or **Not now**, and what you turn down goes back into its thinking so it doesn't ask twice.

- **Coaching (new):** a **morning briefing** on Today (sleep, classes, shifts, deadlines, today's lift target, bulk targets, bills), an **evening review** (today's wins plus your top 3 for tomorrow, saved as tasks), and a **week in review** report every Sunday. With the AI connected, the briefing and reviews are written by Gemini (once per day/week, to save the free tier). **17 badges** for training, nutrition, sleep, money and uni. A **reminders guide** for iPhone Shortcuts notifications.

- **Motion (new):** everything moves on springs. Cards bounce in, and buttons and cards squash when pressed and wobble back like jelly; a habit, set or task you tick and a glass of water you add pop as they change. Sheets spring up (and stretch like a rubber band if you pull them up), toasts drop in and bounce, the tab pill stretches across like a drop of liquid, the active tab icon hops, the Ask orb slowly turns and breathes, chat messages inflate from their tail and the typing dots bounce. The background colour blobs drift slowly. All of it switches off with iOS **Reduce Motion**.

- **Health overview (new):** Health now opens on **Overview**, a close read of one day instead of a single number per area. A short written summary and six status tiles (sleep, calories, protein, water, training, weight) say whether each is on track, behind or done, paced against how much of your waking day has gone. Below that:
  - **Sleep & recovery:** last night's bed and wake times, difference from goal, 7-night average, sleep debt, a 7-night bar strip against your goal, how steady your bedtime has been, and whether you're rested enough to train hard.
  - **Nutrition:** calories against where you should be by now, macros, where your energy came from (protein/carbs/fat), protein per kg of body weight against the 1.6–2.2 g/kg range, how much is left split over your remaining meals, and your surplus against estimated maintenance (from the bulk calculator).
  - **Water and Body:** glasses against pace with quick +/−, latest weight, weekly trend, BMI and a 30-day line.
  - **Training:** today's workout (sets per muscle, volume, PRs) or the next routine day with a Start button, the week's training days, 7-day sets, **muscle recovery** (which groups have had 48 hours since they were last trained), and whether what's next works a muscle that's still recovering.
  - **Day log:** sleep, meals, workouts and weigh-ins in time order; tap any entry to edit it. Step back with ‹ › to read any past day the same way.

- **Health analytics (new):** the Diet, Sleep, Body and Gym tabs are now reports. **Diet:** a 7-day average against your calorie and protein goals, a 0–100 bulk-adherence score (calories, protein, steadiness, logging) with your surplus read against estimated maintenance, calorie and protein consistency over 14 and 30 days with the day-to-day swing, protein per meal and where the calories come from, meal timing (eating window, first and last meal, calories by time of day, how much lands after 9pm), your most common foods ranked with their share of your energy and protein per 1,000 kcal, and weekday against weekend with a day-of-week breakdown. **Sleep:** 7-night average, sleep debt, bedtime and wake regularity, a 0–100 sleep score with its breakdown, a 14-night strip, a 30-night trend, weekday pattern and social jetlag. **Body:** a 7-day trend weight that filters out water swings, 7/30/90-day change, rate of gain against the lean-bulk band, 4- and 12-week fits, energy balance (scale vs food log), projected weight and BMI. **Gym:** a full lifting report — training status (productive / maintaining / overreaching / detraining) from load and strength together, relative strength against body-weight standards with a level per lift and a Big 3 total, a strength index and per-lift overload rate with plateau warnings, a six-week volume map per muscle against MEV/MAV/MRV with training frequency, rep-range and relative-intensity distribution, push/pull, quad/hinge and upper/lower balance with strength-ratio checks, and consistency, session density and PR counts.

- **Specialists (new):** every Health tab now has its own clinician, who reads that tab's data and gives a consult the way a specialist would at a follow-up. **Overview → Dr Maya Okafor, GP** (a 0–100 wellbeing index from the other four, cross-system findings like sleep debt on top of a heavy training week, tomorrow's readiness, your biggest lever, and your care team at a glance). **Gym → Dr Leo Hartmann, Sports & Exercise Physician** (1RM forecasts at 4 and 8 weeks per lift and when you reach the next strength level, overuse-injury risk from load spikes and sleep debt, stalled lifts, under-dosed muscles, push/pull balance). **Diet → Priya Nair, Sports Dietitian** (weight change your intake predicts, protein-goal days next week, per-meal protein, late eating, variety, hydration, with food swaps in grams). **Sleep → Dr Sam Whitfield, Sleep Physician** (next week's average from the 4-week trend, the date sleep debt clears, lights-out and caffeine cut-off times from your own wake time, social jetlag). **Body → Dr Elena Ruiz, body composition** (weight at 4/8/12 weeks with a likely range, the date you reach a weight target against its deadline, a rough muscle-versus-fat split of the gain).
  - Every forecast carries a **confidence level** and a **Why** that names the numbers behind it, plus what would change the outcome. Each consult ends in a numbered plan, **when to see someone in person** (data-triggered alerts first) and what data would sharpen it.
  - With Gemini connected, **Ask** any specialist in a chat that is briefed with their consult and your data, or have them **write a consult letter** (on demand, cached for the day). It's guidance from your logs, not a diagnosis.

- **Money report (new):** a Report tab on Money reading the last four weeks against the eight before. Spend per category against its own baseline with the change in dollars and per cent, a twelve-week weekly line with the baseline week marked, **recurring-cost creep** (every bill plus any merchant charging on a regular gap, split into price rises, new sign-ups and things you dropped, with yearly charges spread over the months they cover), **savings rate** against a 20% aim with six months of what each month kept, and a **cash runway** — how many months the spendable balance covers at your current burn, against a three-month floor, with the month split into fixed, living and flexible.

- **Uni report (new):** the Uni tab is now a semester report. Every mark against what it was worth, grade points banked and dropped per unit, your average on heavy pieces against small ones and by assessment type, **what the remaining work has to score** for each grade band (with “already banked” and “out of reach” marked), and **study hours per unit set against its results** — hours a week beside each unit's average, eight weeks of study, and what is due next with the weight riding on it. Study hours follow the **Towards** tag on a block (or a unit code in its name), so they land in the right row.

- **Health profile (new, Settings → Health profile):** replaces the bulk calculator. **Personal details** (sex, age or birthday, height, activity, bulk pace) and an optional **medical background** (conditions, medications and supplements, allergies, family history, other notes). If height was never entered, Loop works it out from a health check's weight and BMI and offers to save it. **Health checks** can be added as often as you have them: paste the report straight from a pharmacy station, GP visit or blood test and Loop reads the numbers and status words (heart age, weight, blood pressure, BMI, body fat, resting heart rate, diabetes risk, plus waist, cholesterol, glucose, HbA1c, SpO₂ and more). Each result is graded against Australian ranges and shows what changed since the last check. Every **specialist** reads the profile: the GP covers blood pressure, heart age, diabetes risk and when to see a doctor; Dr Ruiz works out lean mass and FFMI from body fat; Dr Hartmann reads resting heart rate as aerobic fitness; Priya turns diabetes risk and lipids into food advice. **Ask** and the specialist chats can save checks and details for you (`log_health_check`, `update_health_profile`, `remove_health_check`), and each save comes with an Undo. Daily goals now suggest calorie and protein targets from the profile.

- **Polish:** Today puts today's numbers and habits first and the weekly chart lower down; bigger tap targets (close/delete buttons, water, section links); clearer text and tag colours (WCAG AA); press feedback and no double-tap zoom; tap the active tab to scroll to top; the page behind a sheet no longer scrolls; keyboard and VoiceOver can reach every card.

The app icon is drawn by [`design/icon.html`](design/icon.html): an infinity "loop" ribbon flowing through each life area's colour.

## Run it locally

No build step. Just serve the folder:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Put it on your iPhone

1. Host the folder on HTTPS. The free option is **GitHub Pages**: repo **Settings → Pages → Deploy from a branch → `main` / root**. The app will be at `https://<username>.github.io/WebApp/`.
   GitHub Pages on a free account requires the repo to be **public**. The code holds no personal data or keys, since your data stays on your phone.
2. Open that link in **Safari** on the iPhone.
3. Tap **Share → Add to Home Screen**.
4. Always open Loop from the **Home Screen icon**. Safari tabs can have their data cleared after ~7 days unused; Home Screen apps keep it.

## Your data

- Stored in IndexedDB on the phone only; Loop asks iOS to keep it persistent.
- It's lost if you delete the Home Screen app, clear Safari website data, or reset/lose the phone.
- **Back up weekly:** Settings → **Back up** → **Save to Files** → iCloud Drive. Restore the `.json` file from Settings → **Restore**. Today shows a reminder when the last backup is over a week old.

## Files

| Path | What |
|---|---|
| `index.html` | App shell and tab bar |
| `css/app.css` | Styles (pastel glass theme) |
| `js/app.js` | Entry point: event delegation, routing, boot |
| `js/core.js` | Shared shell: registries, render, sheets, toasts, haptics, confetti, the section bar, pinned sub-tabs and swipe |
| `js/icons.js` | Loop's duotone icon set |
| `js/util.js`, `js/data.js` | Helpers and data selectors |
| `js/today.js`, `js/health.js`, `js/gym.js`, `js/settings.js` | Screens and their sheets/actions |
| `js/specialists.js` | The Health specialists: rule-based consults, forecasts, the consult letter and the specialist chat |
| `js/overview.js` | Health overview: one day's sleep, recovery, nutrition, training and body read in detail |
| `js/day.js` | The day timeline: blocks, dots, dragging, stretching, live timer |
| `js/planner.js` | The day planner: the day's shape, the model's plan, and the checks it has to pass |
| `js/study.js` | Exam countdown, the free-time engine and the backwards study planner |
| `js/targets.js` | Long-term targets and pace against them |
| `js/gym-data.js` | Exercise library and routine templates |
| `js/store.js` | IndexedDB storage, backup export/import |
| `js/charts.js` | SVG line charts and sparklines |
| `js/fx.js` | Motion that needs JS: the liquid tab pill, sliding calendar weeks |
| `js/display.js` | Display & accessibility: text size (follows iPhone Text Size), contrast, transparency |
| `sw.js` | Offline cache (bump `CACHE` when releasing) |
| `manifest.webmanifest`, `icons/` | Home Screen install and icons |
| `design/icon.html` | Icon source (render with Playwright at any size) |
