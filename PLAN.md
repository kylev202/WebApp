# Life — Personal Life Manager (Plan)

A personal app to manage every part of my life — diet, gym, sleep, university, work, money, habits — in one place, with an AI assistant that does the logging and coaching. Built for **one user (me)**, used mainly on **iPhone**.

_Last updated: Oct 25, 2026_

---

## 1. Status

| Step | Status |
|---|---|
| Initial design mockup (desktop + mobile, strong colors) | ✅ Done, then replaced |
| iPhone-first redesign, soft pastel colors, compact layout | ✅ Done |
| Remove account/profile UI, use line charts instead of rings | ✅ Done |
| AI assistant (Gemini) — concept agreed | ✅ Planned |
| Brainstorm + detail questions answered | ✅ Done |
| Mockup v3: Today (briefing, workout, weight, money), ✨ Ask, Money screens | ✅ Done |
| Build the real app | ⏳ Not started |

Current mockup: `design/mockup.html` (open with `#today`, `#ask`, `#money`). Screenshots: `design/today-full.png`, `design/ask-full.png`, `design/money-full.png`.

---

## 2. My Answers (decisions)

| Topic | Decision |
|---|---|
| Areas | Health (diet, gym, sleep), **School** (university), **Work** (part-time + freelance web building), **Finance** (full tracker), Habits |
| Not included | Mind/mood journal, account/login/profile |
| Main way to log | **Type/talk to the AI** and **Siri / Apple Shortcuts** (not photo logging, not mainly tap buttons) |
| Fitness focus | **Gym / strength** |
| Motivation | Streaks & badges, AI coaching, reminders, charts & trends — all of them |
| AI coach check-ins | **Morning briefing**, **evening review**, **Sunday weekly report** |
| AI provider | **Google Gemini, free tier** (can switch to paid later by swapping the key) |
| Theme | **Light only** (soft pastel) |
| Currency | **AUD (A$)** |
| Diet goal | **Bulking** — calorie surplus (≈3,000 kcal/day placeholder), high protein (≈160 g); AI can suggest exact targets from body weight |

---

## 3. Design Decisions (confirmed)

- **Style:** Apple's recent iOS "Liquid Glass" look — translucent frosted cards, soft blurred background, rounded corners, bold large headings, floating glass tab bar.
- **Colors:** light and soft pastels, *not* strong/saturated colors. Near-white background with faint color washes. Light theme only.
  - Diet = mint `#8fd3a8` · Gym = blush `#f4a7b5` · Sleep = lavender `#b4b2ef`
  - School = peach `#f7cd96` · Work = sky `#a9cdf2` · Finance = aqua (TBD, soft)
- **Layout:** compact and small — iPhone-first (390 px wide). No desktop sidebar.
- **Charts:** **line charts** preferred over ring/pie charts. Smooth curves, thin strokes.
- **No account / profile / login.** Personal use only.
- **Font:** system font (SF Pro on iPhone; Inter as fallback).

---

## 4. Features by Area

### 🏋️ Gym
- Log **sets / reps / weight** per exercise (by talking to the AI: "bench 3×8 at 60 kg").
- **Strength line chart** per exercise over time (estimated 1-rep max).
- **AI-made routine:** AI builds a weekly split (e.g. push/pull/legs) for my goals; today's workout shows on the Today screen.
- **Body weight trend:** weigh-ins + line chart (bulk/cut).

### 🥗 Diet
- Log meals by text/voice → AI estimates calories & protein/carbs/fat.
- Daily calorie & protein targets tied to gym goal (bulk/cut).
- Water tracking (Siri: "log water").

### 🌙 Sleep
- Log bedtime/wake time (Siri Shortcut or AI), or auto-import from iPhone Health via a Shortcut.
- Sleep duration line chart; bedtime reminder.

### 🎓 School (University)
- Courses per semester with credits.
- Weekly **class timetable** → shows in Up Next automatically.
- Assignments & exams with due dates.
- **Grades & GPA** tracker, plus "what score do I need on the final?"
- **Exam countdown** with AI-generated study plan working back from the date.

### 💼 Work
- **Part-time job:** log shifts, hours worked, hourly rate → estimated pay per week/month.
- **Freelance web building:** clients, projects, deadlines, project tasks, invoices/payments (paid / unpaid / overdue).
- Work income flows into Finance automatically.

### 💳 Finance (full money tracker)
- Expenses by category (log by text: "spent $12 on lunch").
- Income: part-time pay + freelance payments.
- Monthly **budget per category** with progress.
- **Subscriptions** tracker (renewal dates, monthly total).
- **Savings goals** with progress line.
- **Bills due** reminders.

### ✅ Habits & Motivation
- Daily habits with **streaks** and **badges** (e.g. 7-day gym streak, budget kept for a month).
- **Reminders** (water, bedtime, deadlines, bills, workout).
- **Trends** tab: long-term line charts for every area.

---

## 5. Screens

### Tab bar (floating glass)
`Today` · `Health` · `✨ Ask` (AI, center) · `Plan` · `Money`

> Trends (long-term charts) live inside each area's detail screen and in the weekly report, since Finance needs its own tab.

### Today (home) — mocked up, will be updated
1. Date + greeting + **AI morning briefing** (2–3 lines)
2. **This Week** line chart (Move / Eat / Sleep vs goal)
3. Widgets: Diet, Sleep, **Today's workout**, Water, **Money left this month**
4. **Up Next** — classes, shifts, client deadlines, workout, bedtime
5. **To-Do** — assignments, freelance tasks, bills due
6. **Habits** with streak counts
7. Floating ＋ button (opens AI quick log)

### Health
Diet · Gym (routine, exercise history, strength charts, body weight) · Sleep

### ✨ Ask (AI)
Chat with quick-prompt chips: "Log meal", "Log workout", "Spent…", "Plan tomorrow", "Weekly review".

### Plan
Calendar (classes + shifts + deadlines), University (courses, grades, GPA, exams), Work (shifts & pay, freelance clients/projects/invoices).

### Money
Monthly overview, budget by category, spending line chart, income, subscriptions, savings goals, bills.

### Settings
Gemini API key, goals (calories, protein, sleep, budget), class timetable, hourly rate, data backup export/import.

---

## 6. AI Assistant (Google Gemini, free tier)

**What it does**
- **Natural-language logging** for everything: meals, workouts, sleep, water, expenses, shifts, tasks.
- **Planning:** study plans before exams, weekly gym routine, daily schedule.
- **Coaching:**
  - **Morning briefing** — today's classes, shifts, deadlines, workout, bills due.
  - **Evening review** — how the day went, set tomorrow's top 3.
  - **Sunday weekly report** — trends in gym, diet, sleep, money, school.
- **Q&A over my data:** "How much did I spend on food this month?", "Is my bench going up?"

**How it works**
- Gemini **function calling**: the app gives the AI a fixed set of tools (`add_meal`, `log_set`, `log_sleep`, `add_expense`, `log_shift`, `add_task`, `add_event`, `toggle_habit`, …). The app validates each call before saving, so the AI can only do what those tools allow.
- Called directly from the phone — no server needed.

**Setup**
1. Get a free API key from Google AI Studio (aistudio.google.com).
2. Paste it into the app's **Settings** once — stored only on the phone.

**Cautions**
- **Privacy:** on the free tier, Google may use submitted data to improve its products. Can switch to the paid tier later just by swapping the key.
- **Rate limits:** free tier has per-minute/per-day caps (check AI Studio for current numbers) — fine for one person.
- **Never commit the API key** to the repo. Key lives only in on-device Settings.

---

## 7. Siri & Apple Shortcuts

- "Hey Siri, log water" / "log my weight 72 kg" / "I spent 50k on lunch" → Shortcut opens the app with the entry pre-filled via URL (e.g. `…/log?text=...`), the AI parses and saves it.
- **Auto-import from iPhone Health** (steps, sleep, weight) with a daily Shortcut automation.
- **Scheduled check-ins & reminders:** a web app with no server can't send notifications on a timer by itself. Plan: use **Shortcuts personal automations** (e.g. 7:00 AM → open morning briefing, 10:30 PM → bedtime/evening review). Optional later: a small free push service if Shortcuts isn't enough.

---

## 7b. Connections (Google Calendar & money)

### 📅 Google Calendar
- "Connect Google Calendar" → Google sign-in (OAuth, in-app, no server). Events feed **Up Next**, **Plan** and the AI briefing.
- **Read-only:** the app only reads Google Calendar, never changes it.
- Events the AI creates (study plans, gym sessions, shifts) go into the **app's own calendar** (Plan tab), shown together with Google events.
- One-time setup: free Google Cloud project → enable Calendar API → OAuth client ID → add myself as the only test user (no Google review needed).
- Read-only scope (`calendar.readonly`).
- Sign-in token lasts ~1 hour; app silently reconnects on open (occasionally one tap).

### 🏦 Westpac (my bank)
Westpac has **no personal API**; Australian open banking (CDR) only lets accredited companies pull data. So:
1. **Apple Pay + Shortcuts (main, automatic, free):** iPhone "Transaction" automation runs every time I tap my Westpac card in Apple Wallet → sends amount + merchant to the app → AI picks the category. Covers everyday tap-to-pay spending.
2. **Monthly CSV import:** export transactions from Westpac online banking → drop the file into the app → AI categorises every row and skips ones already logged by Apple Pay. Catches rent, transfers, direct debits, BPAY.
3. *(Later, optional)* Accredited aggregator (e.g. Basiq) for fully automatic sync — needs a small server and may cost money.

### 💳 Revolut (second account)
- Revolut has **no public API for personal accounts** (its API is for Revolut Business only), so same approach as Westpac:
- **Apple Pay + Shortcuts:** add the Revolut card to Apple Wallet → the same Shortcut logs every tap automatically.
- **Statement import:** export a CSV statement from the Revolut app → drop into the app → AI categorises and skips duplicates.
- **Foreign-currency spending** (e.g. travel, online purchases in USD) is converted to AUD for budgets.
- **Top-ups / transfers between Westpac and Revolut** are recognised as internal transfers and *not* counted as spending.
- Money tab shows both accounts together (with a per-account filter).

### 🎓 Canvas (uni LMS) — via Canvas API
- Canvas → Account → Settings → **New Access Token** (personal token; some unis disable this, check first).
- Pulls **all units**: courses, assignments + due dates, grades/scores, announcements, modules/files list.
- Feeds School (courses, GPA, assignments), Up Next, To-Do and the AI briefing/study plans. Auto-refresh on app open.
- Canvas blocks direct calls from other websites (CORS), so a **tiny free relay** (e.g. Cloudflare Worker) passes requests through. It stores nothing.
- The token gives full access to my Canvas account → kept only on my phone / in the relay's secret settings, never in the repo.

### 🗓 Café roster from a photo
- Snap/screenshot the roster → Gemini reads it → adds my shifts to the app calendar with hours and expected pay (hourly rate from Settings). I confirm before saving.

### 🏋️ Progressive overload
- After each session the AI suggests next weights/reps per exercise (e.g. +2.5 kg when all sets hit target reps).
- PR detection + celebration 🎉, rest timer between sets, plate calculator.

### Security
- Google sign-in, Canvas token and any keys stay **only on my phone** (or the relay's secret settings), never in the repo.
- Bank data never leaves the phone except to Gemini for categorising (only merchant + amount, not account numbers).

## 8. Tech Plan (proposed)

- **Type:** installable web app (PWA) — "Add to Home Screen" on iPhone, works offline.
- **Data:** stored only on the device (IndexedDB). Export/import backup as JSON file.
- **No backend, no login.**
- **Hosting:** free static hosting (e.g. GitHub Pages).
- **Stack:** to be decided at build start (lightweight, e.g. vanilla JS or a small framework + Vite).

---

## 8b. Ideas considered and skipped
Tax-time helper, freelance invoicing/time tracking, payslip check, visa work-hour cap tracker, exchange-rate watch, budget meal plan, notes→flashcards. Can revisit later.

## 9. Open Questions

- Feedback on mockup v3 (Today / Ask / Money) — approve or adjust?
- Mockup Health and Plan screens too, or start building v1?
- Exact daily calorie & protein targets (or let the AI calculate them)?

---

## 10. Build Roadmap

1. **v1 — Core:** Today screen, local data storage, PWA install, Settings. Logging for Diet, Water, Sleep, Habits (+ streaks).
2. **v2 — Gym:** exercises, sets/reps/weight, strength charts, body weight trend, progressive overload, PRs, rest timer, plate calculator.
3. **v3 — AI:** Ask screen with Gemini function calling for all logging; AI routine builder.
4. **v4 — School & Work:** courses, timetable, assignments, grades/GPA, exam plans; shifts & pay; freelance clients/projects/invoices.
5. **v5 — Money:** expenses, income, budgets, subscriptions, savings goals, bills.
6. **v6 — Connections:** Canvas API sync, roster-from-photo, Google Calendar sync, Apple Pay Shortcut, Westpac + Revolut CSV import, internal-transfer detection.
7. **v7 — Coaching & Siri:** morning briefing, evening review, weekly report, badges, Shortcuts integration.
