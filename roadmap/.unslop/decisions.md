# Decisions: Placement Roadmap app

- Mode: new build. Size: L (six-screen app). Date: 2026-11-26.
- Team: all nine unslop roles. The creative director plays the building roles solo (role files read in turn).
  The design critic runs as one fresh subagent, so the judge did not build the work.
- Project root for this app: `WebApp/roadmap/` (the repo holds several apps; Loop lives in `loops/`).
  Loop's design system is Loop's brand, not this app's: this is a separate product, so unslop directions apply.
- Platform: a published Claude artifact (one self-contained HTML page) with the `db` and `user` capabilities.
  The source lives in `roadmap/index.html` and is published from that file.
- Source of truth: the doc "AI Placement Roadmap: Week-by-Week Plan" (rev 81, read 2026-11-26).
  Seed data is generated from the doc's XML by script, so task wording is copied, never retyped.
- Memory: `log.mjs recent` and `lessons` returned no history (first unslop project here).

## Phase 2: direction chosen
- Kyle chose **A: Line 28** and accepted all eight plan assumptions (2026-11-26). Contract in direction.md.

## Phase 3: system, Gate 3 (coherence): pass
- Type: Overpass only (400/600/800), specimen-tested against Atkinson Hyperlegible Next and Public Sans.
- Colour: neutral panels, coded line colours (orange break, teal semester), one accent (signal yellow) with written usage rules; contrast.mjs passes every text pairing in both themes; the two fails are by-rule (accent never on light ground, decorative hairlines).
- Layout: six screens, six different layout families, no cards, one radius rule (10 / 16, inner = outer minus padding), 44px+ targets, safe areas.
- Copy refit to budgets; app copy has no dashes; doc wording keeps its own en dashes (doc wins, noted for the lint step).

## Phase 6: critique 1 (31/48, fix), fix loop 1
- F6 tab icons: kept a bespoke set on purpose. The direction's imagery is "the line diagram itself", and every icon now uses the same rail-and-stop vocabulary at one 2 px stroke in a 22 px box: Week = rail with stops, Roadmap = line with an interchange, Skills = the app's four status marks (empty, half, three-quarter, full), Projects = a branch line, Profile = the terminus (goal), Reports = a timetable board with stops. A stock family (Lucide, Tabler) would bring a second visual language next to the line.
- Dark-mode focus ring is signal yellow: it reads as "you are here" for the keyboard, consistent with contract 2.
- F1: semester is now a cased line (two rails) everywhere (roadmap, rails, legend), break stays solid, so the routine code survives grayscale and colour blindness.
- F23 (terminus station for the 2028 goal, a labelled gap bracket) logged as an idea, not built: no feature additions this round.

## Phase 6 result: critic gate passed
- Critique 1: 31/48 (fix) -> critique 2: 36/48 (fix) -> critique 3: 38/48 (fix) -> critique 4: 40/48, ship. Three fix loops, each re-shot.
- Final: no P0/P1/P2; every dimension 3 or 4 (Typography, Colour, Craft, AI-slop absence at 4); distinctiveness 3.
- Open P3s: focus after "Try again" lands on Remove rather than the row; under VoiceOver the Undo toast still hides after 6 s. Idea not built: a 2028 terminus station and a labelled ahead/behind bracket.
- Only Chromium was available: Undo and the failed-save revert need one check on Kyle's iPhone.

## Phase 7: ship and learn
- Final system: Overpass 400/600/800; neutral panels; orange = break line (solid), teal = semester line (cased); signal yellow for action and "you are here"; six layout families.
- Logged with `log.mjs add` (score 40).
- Lessons: simulate failed writes and keyboard focus across re-renders in the first critique; never cut doc text to fit; code routines by shape as well as hue; register listeners with addEventListener (onfocusin is not a handler property); Overpass's U+00B7 has zero advance width.

## Round 2 (2026-11-27): P3 fixes, targets, terminus
- R4-F1 fixed: a toast remembers which control had focus before it took focus; when it hides, focus goes back there (the task row after Try again), else to the fallback.
- R4-F2 fixed: action toasts (Undo, Try again) have no timer. They stay until a tap or click elsewhere, Escape, a screen change or the next toast. A drag (scroll) is not a tap. Plain confirmations still hide after 2.6 s.
- Targets: Kyle approved suggested targets and added them to the doc (rev 83, "What proves it works" for both projects). Seed v2 copies them; the seed now asserts every target string appears in the doc. Only projects/p1, projects/p2 and meta/app changed, so only those were written.
- R4-F3 built: the line runs on as dashed planned track to a terminus bar labelled "2028 placement" with the profile goal in full (wrapped, never cut). The bracket between progress and today carries the pace words along it, centred when it fits, else starting at the diamond.
- Checks: test/run.js 55/55 (new toast, terminus and bracket checks fail on the old page); lint clean; no overflow at 320/390/820, light and dark.
- Still open: the Undo and failed-save check on Kyle's iPhone (WebKit not available here).
