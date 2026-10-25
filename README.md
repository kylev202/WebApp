# Loop

My personal life manager for iPhone: diet, gym, sleep, uni, work and money in one place, in a soft pastel "Liquid Glass" style.

The full plan, decisions and roadmap are in [PLAN.md](PLAN.md). Design mockups are in [`design/`](design/).

## What's in v2

- **Gym (new):** pick a routine (Push/Pull/Legs, Upper/Lower or Full body) and edit every day, exercise, set and rep range. Start the next day from Today, log each set (kg × reps) with last session shown beside it, and tick sets off.
  - **Smart weights:** double progression. Beat last time by a rep; when every set hits the top of the range, Loop tells you to add weight.
  - **PRs:** heavier weight or higher estimated 1-rep max triggers a trophy and confetti.
  - **Rest timer** starts on each ticked set and chimes when it's time to go again.
  - **Plate calculator**, exercise history with strength line charts, weekly sets chart, custom exercises. Finishing a workout ticks the Gym habit.
- **Custom icon set:** every emoji is replaced with Loop's own pastel duotone icons, including a habit icon picker.
- **Today:** workout card, weekly line chart, Diet, Sleep, Water and Weight cards, habits with streaks, today's food with Repeat yesterday.
- **Health:** Gym, Diet (macros with bulking targets), Sleep, Body (weight trend + bulk rate).
- **Logging:** meals (recent meals, any day), water (tap the drops), sleep, weigh-ins; tap any entry to edit, delete with Undo.
- **Bulk calculator**, iOS-style sheets you can swipe down, haptics, animations, offline, no account, data stays on the phone.

- **Plan (new):** agenda with a week strip (classes, events, shifts, deadlines, invoices), **Uni** (courses, weekly timetable, assessments with marks, GPA on a 7 or 4-point scale, WAM, and "what do I need on the rest" for HD/D/C/P), **Work** (café shifts with weekday/Saturday/Sunday rates and expected pay, freelance clients, projects and invoices; marking an invoice paid or adding a week's pay records the income in Money) and **Tasks** (grouped by overdue, today, tomorrow, this week...).
- **Money (new):** monthly overview with spending vs budget-pace line, income/spent/saved, budgets per category, Westpac/Revolut/cash accounts, transfers (not counted as spending), foreign-currency notes, bills & subscriptions (tap Paid to log and roll the date), savings goals with an estimated finish date.
- **Today** now also shows Up Next, To-Do and a Money card.
- **Ask (new, centre ✦ tab):** chat with Google Gemini. Type or speak ("3 eggs and toast", "bench 3x8 at 60", "spent $18 at uni", "plan study for my exam") and it logs meals, water, sleep, weight, habits, workouts, routines, tasks, events, shifts, assessments, expenses, income and goals. Every logged item appears as a card with **Undo**. Attach a photo (roster, meal, receipt). It answers questions from your Loop data. Setup: paste a free key from aistudio.google.com/apikey; Loop picks the newest Flash model automatically.
- **Connections (new, Settings → Connections):**
  - **Bank CSV import** for Westpac and Revolut (and most bank CSVs): cleans merchant names, auto-categorises Australian merchants, skips duplicates and reverted payments, and spots Westpac → Revolut top-ups as transfers. Optional "sort with AI" for unknown merchants.
  - **Your relay** ([`relay/`](relay/)): a free Cloudflare Worker you own. It powers **Apple Pay logging** (Shortcuts Transaction automation → each tap lands in Money) and **Siri "Log to Loop"**, and passes **Canvas** requests through.
  - **Canvas sync:** units, assignments, due dates, weights (from assignment groups) and marks.
  - **Google Calendar (read-only):** events appear in the agenda and Up Next. Needs your own OAuth Client ID (guide in the app).

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
| `js/gym-data.js` | Exercise library and routine templates |
| `js/store.js` | IndexedDB storage, backup export/import |
| `js/charts.js` | SVG line charts and sparklines |
| `sw.js` | Offline cache (bump `CACHE` when releasing) |
| `manifest.webmanifest`, `icons/` | Home Screen install and icons |
| `design/icon.html` | Icon source (render with Playwright at any size) |
