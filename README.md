# Loop

My personal life manager for iPhone: diet, gym, sleep, uni, work and money in one place, in a soft pastel "Liquid Glass" style.

The full plan, decisions and roadmap are in [PLAN.md](PLAN.md). Design mockups are in [`design/`](design/).

## What's in v4

- **Gym (new):** pick a routine (Push/Pull/Legs, Upper/Lower, Full body or a body-part split) and edit every day, exercise, set and rep range. Start the next day from Today, log each set (kg × reps) with last session shown beside it, and tick sets off.
  - **Smart weights:** double progression. Beat last time by a rep; when every set hits the top of the range, Loop tells you to add weight.
  - **PRs:** heavier weight or higher estimated 1-rep max triggers a trophy and confetti.
  - **Rest timer** starts on each ticked set and chimes when it's time to go again.
  - **Plate calculator**, exercise history with strength line charts, weekly sets chart, custom exercises. Finishing a workout ticks the Gym habit.
  - **The anatomy figure (new):** an exercise never names the muscle it works — it shows it. The drawing is a pair of pictures ([`img/`](img/)) and every one of **17 muscle regions** is an outline traced from the artwork's own borders, laid over it in red with a multiply blend so the shading and line work still read through. Where many muscles must show at once — the week's volume, muscle recovery, a finished session, a routine day — the whole figure lights each muscle by how much work it got, and you can tap any of them for its weekly sets, where they come from and what else would hit it. Everywhere a single exercise appears, the same picture is cropped to a **close-up** of the muscle it works hardest, with anything else nearby shaded behind it. It is driven by a library of **127 exercises**, each mapped to those regions with primary and secondary muscles and a couple of form cues.
  - **Routine editor (new):** +/− steppers for sets and the rep range, one-tap **Strength / Hypertrophy / Pump** presets for a whole day, reorder and duplicate days, swap an exercise in place (keeping its sets, reps, rest and note), a **rest override** and a **note** per exercise, and **supersets** — paired moves show a linked rail in the editor and in the live logger. Each day shows its own body map, hard-set count and an estimated length.
  - **Exercise picker (new):** instant search across names, gear and muscles ("lats" finds the pulldowns), muscle and equipment filter chips, your most-used moves first, and a small anatomy figure on every row.
- **Custom icon set:** every emoji is replaced with Loop's own pastel duotone icons, including a habit icon picker.
- **Today:** workout card, weekly line chart, Diet, Sleep, Water and Weight cards, habits with streaks, today's food with Repeat yesterday.
- **Health:** Gym, Diet (today's macros + a full nutrition report), Sleep, Body (weight trend + bulk rate).
- **Logging:** meals (recent meals, any day), water (tap the drops), sleep, weigh-ins; tap any entry to edit, delete with Undo.
- **Bulk calculator**, iOS-style sheets you can swipe down, haptics, animations, offline, no account, data stays on the phone.

- **Plan (new):** agenda with a calendar you can expand from a week strip to a full month, swipe between weeks or months, jump to any date and tap back to today (classes, events, shifts, deadlines, invoices), **Uni** (courses, weekly timetable, assessments with marks, GPA on a 7 or 4-point scale, WAM, and "what do I need on the rest" for HD/D/C/P), **Work** (café shifts with weekday/Saturday/Sunday rates and expected pay, freelance clients, projects and invoices; marking an invoice paid or adding a week's pay records the income in Money) and **Tasks** (grouped by overdue, today, tomorrow, this week...).
- **Money (new):** monthly overview with spending vs budget-pace line, income/spent/saved, budgets per category, Westpac/Revolut/cash accounts, transfers (not counted as spending), foreign-currency notes, bills & subscriptions (tap Paid to log and roll the date), savings goals with an estimated finish date.
- **Today** now also shows Up Next, To-Do and a Money card.
- **Ask (new, centre ✦ tab):** chat with Google Gemini. Type or speak ("3 eggs and toast", "bench 3x8 at 60", "spent $18 at uni", "plan study for my exam") and it logs meals, water, sleep, weight, habits, workouts, routines, tasks, events, shifts, assessments, expenses, income and goals. Every logged item appears as a card with **Undo**. Attach a photo (roster, meal, receipt). It answers questions from your Loop data. Setup: paste a free key from aistudio.google.com/apikey; Loop picks the newest Flash model automatically.
- **Connections (new, Settings → Connections):**
  - **Bank CSV import** for Westpac and Revolut (and most bank CSVs): cleans merchant names, auto-categorises Australian merchants, skips duplicates and reverted payments, and spots Westpac → Revolut top-ups as transfers. Optional "sort with AI" for unknown merchants.
  - **Your relay** ([`relay/`](relay/)): a free Cloudflare Worker you own. It powers **Apple Pay logging** (Shortcuts Transaction automation → each tap lands in Money) and **Siri "Log to Loop"**, and passes **Canvas** requests through.
  - **Canvas sync:** units, assignments, due dates, weights (from assignment groups) and marks.
  - **Google Calendar (read-only):** events appear in the agenda and Up Next. Needs your own OAuth Client ID (guide in the app).
- **Day (new):** a `Summary / Day` switch on Today opens a close-up of one day on a single timeline — classes, shifts, events and workouts as blocks down the left, meals, spending and weigh-ins as dots down the right, a live "now" line between what's scheduled and what's happened. Add **blocks** for the time you actually spend (study, revision, reading, coding, admin, chores, social, rest): tap **Start** for a live timer, or tell Ask "studied 2 til 4". Plans you lay out ahead are hatched, and stay as an empty outline if the hour passes without them — the gap is the point. Hold any block or dot to **drag it to another time** (15-minute snap); anything imported or backdated waits in **No time yet** until you place it. Quiet hours shrink so an empty afternoon costs a few pixels. Swipe back through any past day, and leave a line in **How the day went** that the coach reads at the evening review.
  - **Checkpoint nudges:** at 2pm, 6pm and 10:30pm the coach looks at the day so far — protein against the hours left, a clear 90-minute gap worth studying in, a deadline with nothing logged against it, spending past its daily pace — and pins a note on the timeline. Costed once per checkpoint per day, so the free Gemini tier lasts; without a key the same facts show in plain text.

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

- **Money report (new):** a Report tab on Money reading the last four weeks against the eight before. Spend per category against its own baseline with the change in dollars and per cent, a twelve-week weekly line with the baseline week marked, **recurring-cost creep** (every bill plus any merchant charging on a regular gap, split into price rises, new sign-ups and things you dropped, with yearly charges spread over the months they cover), **savings rate** against a 20% aim with six months of what each month kept, and a **cash runway** — how many months the spendable balance covers at your current burn, against a three-month floor, with the month split into fixed, living and flexible.

- **Uni report (new):** the Uni tab is now a semester report. Every mark against what it was worth, grade points banked and dropped per unit, your average on heavy pieces against small ones and by assessment type, **what the remaining work has to score** for each grade band (with “already banked” and “out of reach” marked), and **study hours per unit set against its results** — hours a week beside each unit's average, eight weeks of study, and what is due next with the weight riding on it. Study hours follow the **Towards** tag on a block (or a unit code in its name), so they land in the right row.

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
| `js/core.js` | Shared shell: registries, render, sheets, toasts, haptics, confetti |
| `js/icons.js` | Loop's duotone icon set |
| `js/util.js`, `js/data.js` | Helpers and data selectors |
| `js/today.js`, `js/health.js`, `js/gym.js`, `js/settings.js` | Screens and their sheets/actions |
| `js/overview.js` | Health overview: one day's sleep, recovery, nutrition, training and body read in detail |
| `js/day.js` | The day timeline: blocks, dots, dragging, live timer |
| `js/study.js` | Exam countdown, the free-time engine and the backwards study planner |
| `js/targets.js` | Long-term targets and pace against them |
| `js/gym-data.js` | Exercise library and routine templates |
| `js/store.js` | IndexedDB storage, backup export/import |
| `js/charts.js` | SVG line charts and sparklines |
| `js/fx.js` | Motion that needs JS: the liquid tab pill, sliding calendar weeks |
| `sw.js` | Offline cache (bump `CACHE` when releasing) |
| `manifest.webmanifest`, `icons/` | Home Screen install and icons |
| `design/icon.html` | Icon source (render with Playwright at any size) |
