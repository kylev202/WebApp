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
