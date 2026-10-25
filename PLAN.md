# Life — Personal Life Manager (Plan)

A personal app to manage every part of my life — diet, exercise, sleep, school, work, habits — in one place. Built for **one user (me)**, used mainly on **iPhone**.

_Last updated: Oct 25, 2026_

---

## 1. Status

| Step | Status |
|---|---|
| Initial design mockup (desktop + mobile, strong colors) | ✅ Done, then replaced |
| iPhone-first redesign, soft pastel colors, compact layout | ✅ Done |
| Remove account/profile UI, use line charts instead of rings | ✅ Done |
| AI assistant (Gemini) — concept agreed | ✅ Planned |
| Mockup of the AI "Ask" screen | ⏳ Optional, not started |
| Build the real app | ⏳ Not started |

Current mockup: `design/mockup.html` (screenshots: `design/mockup-iphone.png`, `design/mockup-iphone-full.png`).

---

## 2. Design Decisions (confirmed)

- **Style:** Apple's recent iOS "Liquid Glass" look — translucent frosted cards, soft blurred background, rounded corners, bold large headings, floating glass tab bar.
- **Colors:** light and soft pastels, *not* strong/saturated colors. Near-white background with faint color washes.
  - Diet = mint `#8fd3a8` · Exercise = blush `#f4a7b5` · Sleep = lavender `#b4b2ef`
  - School = peach `#f7cd96` · Work = sky `#a9cdf2` · Mind = lilac `#d6b8ee`
- **Layout:** compact and small — iPhone-first (390 px wide). No desktop sidebar.
- **Charts:** **line charts** preferred over ring/pie charts. Smooth curves, thin strokes.
- **No account / profile / login.** Personal use only — no avatar, no "Me" tab.
- **Font:** system font (SF Pro on iPhone; Inter as fallback).

---

## 3. Screens

### Tab bar (floating glass)
`Today` · `Health` · `✨ Ask` (AI, center) · `Plan` · `Trends`

### Today (home) — mocked up
1. Date + greeting ("Good evening")
2. **This Week** card — today's Move / Eat / Sleep vs goal + 7-day line chart (each line as % of goal)
3. 2×2 widgets: **Diet** (kcal left, protein bar), **Sleep** (duration, quality, sparkline), **Exercise** (distance, weekly workouts), **Water** (glasses of 8)
4. **Up Next** — today's timeline, color-tagged by area (School / Work / Sleep…)
5. **To-Do** — school assignments + work tasks with due badges
6. **Habits** — daily habit toggles (Read, Vitamins, Meditate, 10k steps, No phone)
7. Floating ＋ button for quick logging

### Health
Detail views for Diet (meals, macros, water), Exercise (workouts), Sleep (nights, bedtime).

### Plan
Calendar/schedule, school classes & assignments, work tasks.

### Trends
Longer-term line charts (weeks/months) for each area.

### ✨ Ask (AI)
Chat screen with quick-prompt chips: "Log meal", "Plan tomorrow", "Weekly review".

---

## 4. AI Assistant (Google Gemini, free tier)

**What it does**
- **Natural-language logging:** "Had 2 eggs and toast" → diet entry with estimated calories/protein. "Ran 5 km in 30 min", "slept 11:30 to 7" → logged.
- **Planning:** "Calc exam Friday, work Mon–Wed — make a study plan" → creates study blocks + to-dos.
- **Coaching:** daily/weekly insights from my data (e.g. sleep vs late study sessions).
- **Q&A over my data:** "Average protein this week?"

**How it works**
- Gemini **function calling**: the app gives the AI a fixed set of tools (`add_meal`, `log_workout`, `log_sleep`, `add_task`, `add_event`, `toggle_habit`, …). The app validates each call before saving, so the AI can only do what those tools allow.
- Called directly from the phone — no server needed.

**Setup**
1. Get a free API key from Google AI Studio (aistudio.google.com).
2. Paste it into the app's **Settings** once — stored only on the phone.

**Cautions**
- **Privacy:** on the free tier, Google may use submitted data to improve its products. The paid tier doesn't, and costs very little for one user.
- **Rate limits:** free tier has per-minute/per-day caps (check AI Studio for current numbers) — fine for one person.
- **Never commit the API key** to the repo. Key lives only in on-device Settings.

---

## 5. Tech Plan (proposed)

- **Type:** installable web app (PWA) — "Add to Home Screen" on iPhone, works offline.
- **Data:** stored only on the device (IndexedDB). Export/import backup as JSON file.
- **No backend, no login.**
- **Hosting:** free static hosting (e.g. GitHub Pages).
- **Stack:** to be decided at build start (lightweight, e.g. vanilla JS or a small framework + Vite).

---

## 6. Open Questions

- Mockup the ✨ Ask screen first, or go straight to building?
- Areas: add/remove any (Finance, Mind, Social, Goals)?
- Free Gemini tier OK given the privacy note, or use the low-cost paid tier?
- Light theme only, or also dark mode (follow iPhone setting)?

---

## 7. Next Steps

1. Answer open questions above.
2. (Optional) Mockup the Ask screen.
3. Build v1: Today screen + logging for Diet/Exercise/Sleep/Water + To-Do + Habits, local storage, PWA install.
4. Add Plan & Trends screens.
5. Add Gemini AI assistant with function calling.
