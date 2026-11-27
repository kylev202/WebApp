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
