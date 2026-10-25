# Loop

My personal life manager for iPhone: diet, gym, sleep, uni, work and money in one place, in a soft pastel "Liquid Glass" style.

The full plan, decisions and roadmap are in [PLAN.md](PLAN.md). Design mockups are in [`design/`](design/).

## What's in v1

- **Today:** greeting, weekly line chart (eat / sleep / water as % of goal), Diet, Sleep, Water and Weight cards, today's food, habits with 🔥 streaks
- **Health:** Diet (calories chart, macros, meal history), Sleep (14-day chart, nights), Body (weight trend for bulking)
- **Quick log (＋):** meal (with recent meals), glass of water, sleep, weigh-in
- **Settings:** daily goals, edit habits, backup / restore, erase data
- Works **offline**, installs to the Home Screen, **no account**, all data stays on the phone

Plan and Money tabs are placeholders until later versions.

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
| `js/app.js` | Screens, logging sheets, actions, routing |
| `js/store.js` | IndexedDB storage, backup export/import |
| `js/charts.js` | SVG line charts and sparklines |
| `sw.js` | Offline cache (bump `CACHE` when releasing) |
| `manifest.webmanifest`, `icons/` | Home Screen install |
