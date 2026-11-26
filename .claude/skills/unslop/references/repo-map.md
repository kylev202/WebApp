# Repo map

> Paths under `_archive/retired/` are retired skills kept as evidence and history. Read them as reference only; never run them as a skill.

Where things live in this repo, what each holds, and which unslop role should open it when. Paths are from the repo root. Never open `_archive/`: it holds duplicates and stubs (see `CLAUDE.md`).

## Ground rules

- `core-design/unslop/SKILL.md` drives. Everything below is a lookup or a source of structure; when a resource contradicts the 20 rules, the rules win. Do not load a second taste skill as a driver (`frontend-design`, `design-taste-frontend`, `high-end-visual-design` and `impeccable` overlap, per `CLAUDE.md`).
- Open the smallest thing that answers the question: one brand folder, one CSV query, one reference doc. Grep long files before reading them.
- Known conflicts: `_archive/retired/minimalist-ui/`, `styles/industrial-brutalist-ui/`, `templates/web-prototype-taste-*/`, `_archive/retired/high-end-visual-design/` and `design-systems/brand-systems/atelier-zero/` hard-code eyebrow pills, mono metadata, ASCII ornament, global grain, scroll fades or italic-serif headline mixing (rules 2, 3, 4, 13, 20). Take their grids, scales and tokens, not those moves.
- Verification, run by the frontend engineer and read by the critic:
  - `node core-design/unslop/scripts/shoot.mjs <file-or-url> <outdir>`: full-page Playwright screenshots at 390, 820 and 1440px, with a horizontal overflow warning.
  - `node core-design/unslop/scripts/lint.mjs <file.html|dir>`: regex checks for rules 1, 2, 9, 12-16, 18 and 20, plus em dashes, `100vh`, scroll listeners and more than five distinct radii; exits 1 on any finding.

## Unslop's own references (read these before the rest of the repo)

- `core-design/unslop/references/unslop-rules.md`: the full text of the 20 rules with their owners. Every role.
- `core-design/unslop/references/library/color.md`, `library/typography.md`, `library/layout.md`, `library/patterns.md`, `library/aesthetics.md`: the colorist's, typographer's, layout designer's, UX strategist and engineer's, and art director's libraries. Each role starts with its own file; the sections below are where they point next.
- `core-design/unslop/references/ai-slop-atlas.md`: why models converge and the fix for each habit. Art director and critic.
- `core-design/unslop/references/canon.md` and `rubric.md`: established principles with stable IDs, and the critic's scoring rubric. Critic, and every role when a decision needs a principle.
- `core-design/unslop/references/agent-architecture.md`: how the studio runs in Claude Code. Creative director, at setup.

## ui-ux-pro-max search command

Run from the repo root. The script imports its sibling `core.py`, so call it by path:

```bash
python3 core-design/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n 3] [--json]
python3 core-design/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack> [-n 3] [--json]
python3 core-design/ui-ux-pro-max/scripts/search.py "<query>" --design-system [-p "Project Name"] [-f ascii|markdown]
```

- `--domain` (`-d`) accepts `style`, `color`, `chart`, `landing`, `product`, `ux`, `typography`, `icons`, `react`, `web`, `google-fonts`. Without it the script guesses from keywords and falls back to `style`.
- `--stack` (`-s`) accepts `react`, `nextjs`, `vue`, `svelte`, `astro`, `swiftui`, `react-native`, `flutter`, `nuxtjs`, `nuxt-ui`, `html-tailwind`, `shadcn`, `jetpack-compose`, `threejs`, `angular`, `laravel`.
- Results are BM25-ranked CSV rows, 3 by default (`-n`). Text output cuts fields at 300 characters; add `--json` for whole rows.
- The skill's own `SKILL.md` shows the path `skills/ui-ux-pro-max/...` and a `prompt` domain. In this repo the path is `core-design/ui-ux-pro-max/...`, and `--domain prompt` is rejected.
- `--persist` (with `--page`) writes `design-system/<project>/MASTER.md` into the working directory. Never run it inside this library; pass `-o <scratch dir>` if you need the files.
- `--design-system` assembles the category's modal answer (pattern, style, palette, font pair). Treat it as the default to depart from, never as the pick.
- Tested examples: `"brutalism raw" --domain style`, `"condensed industrial signage" --domain google-fonts`, `"list virtualize" --stack react`.

## Color

- `core-design/impeccable/reference/colorize.md`: assessing and planning a color strategy, then placing semantic, accent, surface, chart and text color. Colorist, when placing color. It allows 2-4 colors beyond neutrals; rule 11 caps you at one accent, so use its placement guidance, not its count.
- `core-design/impeccable/reference/brand.md` (Color section): naming a real reference before picking a strategy, and not converging across projects. Colorist and art director.
- `core-design/impeccable/scripts/palette.mjs`: brand-seed picker. `node core-design/impeccable/scripts/palette.mjs [--from <key> | --id seed-021]` prints one OKLCH seed with a mood and leaves the five roles to you. Colorist, only when the brief gives no brand color, and the seed must still fit the brief (rule 11).
- `core-design/ui-ux-pro-max/data/colors.csv`: 161 palettes by product type with full role columns (primary, on-primary, background, muted, border, ring). Query with `--domain color`. Colorist, as a contrast-checked starting point to depart from.
- `design-systems/theme-factory/themes/`: 10 four-color themes (arctic-frost, botanical-garden, desert-rose, forest-canopy, golden-hour, midnight-galaxy, modern-minimalist, ocean-depths, sunset-boulevard, tech-innovation). Colorist, for mood references in decks and documents.
- `design-systems/brand-systems/<brand>/tokens.css`: real brand palettes in shared role names. Colorist, when the brief names a brand.
- Color science is not bundled; `README.md` ("Worth installing separately") points to the upstream color-expert skill.

## Typography

- `core-design/impeccable/reference/brand.md` (Typography section): the font selection procedure from three voice words, the reflex-reject list of training-data fonts and the reflex-reject aesthetic lanes. Typographer and art director, before naming any font.
- `core-design/impeccable/reference/typeset.md`: replacing default type, building scale contrast, pairing. Typographer.
- `core-design/ui-ux-pro-max/data/google-fonts.csv`: 1,923 Google Fonts families with category, stroke, styles, variable axes, subsets, designers and popularity. Query `--domain google-fonts "<voice words>"`. Typographer, to browse by voice words (unslop step 2) and then reject reflex picks.
- `core-design/ui-ux-pro-max/data/typography.csv`: 73 pairings with import snippets; many lean on reflex fonts (its first row pairs Playfair Display with Inter). Typographer, for import syntax or as a list of what not to default to.
- `image-direction/canvas-design/canvas-fonts/`: 54 font files with their OFL licenses, for image and poster output. Art director, image work only.
- `design-systems/brand-systems/<brand>/DESIGN.md` (typography section): real type hierarchies. Typographer, when a brand is named.

## Layout and composition

- `core-design/impeccable/reference/layout.md`: fixing monotone spacing, weak hierarchy and identical card grids. Layout designer.
- `core-design/impeccable/reference/adapt.md`: adapting a design to other screen sizes, devices and platforms. Layout designer and frontend engineer, before the 390 and 820 passes.
- `_archive/retired/design-taste-frontend/SKILL.md` (sections 2-4): the brief-to-design-system map, default architecture and layout engineering directives. Layout designer and frontend engineer.
- `core-design/ui-ux-pro-max/data/landing.csv`: 34 landing patterns with section order and CTA placement. Query `--domain landing`. UX strategist, as structural options, not a recipe.
- `templates/web-prototype/references/layouts.md` with `templates/web-prototype/assets/template.html`: section layouts and a seed page. Layout designer, for structure only.

## UI/UX patterns and states

- `core-design/impeccable/reference/interaction-design.md`: the eight interactive states. UX strategist and frontend engineer.
- `core-design/impeccable/reference/harden.md`: errors, empty and extreme data, i18n, slow networks. Frontend engineer, before shipping any data surface (rule 19).
- `core-design/impeccable/reference/product.md`: the product register (app UI, dashboards, tools). UX strategist, when the user is in a task rather than being pitched.
- `core-design/impeccable/reference/onboard.md` and `clarify.md`: onboarding to first value, and rewriting unclear interface copy. UX strategist and copywriter.
- `core-design/ui-ux-pro-max/data/ux-guidelines.csv` (99 rules across accessibility, forms, touch, navigation, animation) via `--domain ux`; `app-interface.csv` (30) via `--domain web`; `charts.csv` (25) via `--domain chart`; `icons.csv` (105 Phosphor entries) via `--domain icons`; `data/stacks/*.csv` via `--stack`. UX strategist and frontend engineer.
- `core-design/ui-ux-pro-max/SKILL.md` (quick reference, priorities 1-10): checklist rules for contrast, touch targets, performance, forms and navigation. Frontend engineer.
- `_archive/retired/design-taste-frontend/SKILL.md` (Appendices A and B): install commands and canonical docs for Material Web, Fluent, Carbon, Radix, shadcn/ui, Primer, GOV.UK, USWDS, Atlassian, Bootstrap and Polaris. Frontend engineer, whenever rule 5 calls for an official package.
- `workflow/research-decision-room/`: turning raw research into evidence-backed decisions. UX strategist, when the brief arrives with interviews, tickets or surveys.

## Aesthetics and styles

- `core-design/unslop/references/library/aesthetics.md`: the 63-direction catalog with saturation ratings. Art director, when developing three directions.
- `core-design/impeccable/reference/brand.md`: brand register, the two slop tests and the saturated lanes. Art director and creative director.
- `core-design/ui-ux-pro-max/data/styles.csv`: 84 style rows (keywords, colors, effects, best for, do not use for, CSS keywords, checklist). Query `--domain style`. Art director, for implementation keywords after a direction is chosen; its accessibility and performance ratings are self-assessed.
- `core-design/ui-ux-pro-max/data/products.csv`: 161 product types mapped to style recommendations. Art director, to see the category default to depart from.
- `_archive/retired/minimalist-ui/` and `styles/industrial-brutalist-ui/`: two committed aesthetics (conflicts above).
- `templates/web-prototype-taste-brutalist/`, `templates/web-prototype-taste-editorial/`, `templates/web-prototype-taste-soft/`: prototype skeletons per aesthetic, each with `example.html`.
- `templates/html-ppt/assets/themes/`: 36 deck themes as CSS token files (bauhaus, swiss-grid, memphis-pop, vaporwave, y2k-chrome and more); `templates/html-ppt/references/themes.md` says when each fits. Art director, as palette and type references; they are built for slides.
- `core-design/reference-design-contract/`: turns screenshots, URLs and vague taste into a DESIGN.md contract. Creative director and art director, when the user supplies references.

## Brand systems

`design-systems/brand-systems/` holds 152 system folders plus `README.md` and `_schema/`. Three kinds:

- Real-brand systems (stripe, linear-app, wired, nike, ibm, apple and many more): DESIGN.md files of roughly 90-580 lines covering atmosphere, color roles, type hierarchy, components, do's and don'ts, responsive behavior and an agent prompt guide. They are inspirations, not official assets (README, Attribution).
- One-word style folders imported from bergside/awesome-design-skills (brutalism, editorial, glassmorphism, retro, bento and others): 71-line DESIGN.md files generated from one template with a palette, a font trio and generic rules. Starter tokens at best; some palettes are generic (`retro/` uses a stock blue).
- Hand-authored systems with real depth: `kami/`, `atelier-zero/`, `hud/`, `trading-terminal/`, `mission-control/`, `urdu/`, `totality-festival/`, `tom-modern/`, `default/`, `warm-editorial/`.

Files in a standard folder (`tom-modern/` has only DESIGN.md, components.html, manifest.json, preview/ and tokens.css):

- `DESIGN.md`: the system in prose for agents. The first H1 is the title and the `> Category:` line groups it. Read this first.
- `USAGE.md`: the package's read order and do and avoid list.
- `tokens.css`: `:root` custom properties in shared role names (`--bg`, `--surface`, `--fg`, `--fg-2`, `--muted`, `--meta`, `--border`, `--accent`, `--accent-hover`, `--accent-on`, `--focus-ring`, `--font-display`, `--font-body`, `--font-mono`, `--text-xs` to `--text-4xl`, `--space-1` to `--space-12`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`, `--elev-flat`, `--elev-raised`, `--motion-fast`, `--motion-base`, `--ease-standard`); hand-authored systems add extras. Paste the block into the first `<style>` and reference only `var(--name)` (rule 5).
- `tailwind-v4.css`: `@import "tailwindcss"` plus an `@theme` layer that maps the same tokens; derived from tokens.css, which stays the source of truth.
- `design-tokens.json`: machine-readable token report (format `od-design-tokens/v1`).
- `components.html`: a standalone fixture of buttons, inputs, cards and states rendered only from tokens.css; `components.manifest.json` is its compact inventory.
- `manifest.json`: the `od-design-system-project/v1` entry (id, name, category, file list).
- `preview/` (colors, typography and spacing pages) and `system/` (`index.html`, `kit.html`, `kit.dark.html`, `tokens.default.json`, and `artifacts/` with deck, email, form, landing, newsletter and poster samples).
- `_schema/`: `manifest.schema.ts`, `tokens.schema.ts`, `defaults.css` and `AGENTS.md`, the contracts every folder follows.

Who reads it: the art director, to study how a real system decides; the colorist and typographer, to lift real tokens when the brief names a brand (unslop step 2); the frontend engineer, to paste `tokens.css`; the critic, to check output against the DESIGN.md do's and don'ts. Shooting `components.html` or `system/kit.html` with shoot.mjs gives a quick visual reference.

## Motion

- `motion/emil-design-eng/`: whether and how to animate: decision framework, springs, transforms, clip-path, gestures, performance, accessibility, review checklist. Motion designer, before adding any animation.
- `motion/gsap-core/`, then `motion/gsap-timeline/`, `motion/gsap-scrolltrigger/`, `motion/gsap-plugins/` (Flip, Draggable, SplitText, ScrambleText, CustomEase), `motion/gsap-react/`, `motion/gsap-frameworks/` (Vue, Svelte), `motion/gsap-utils/`, `motion/gsap-performance/`: the official GSAP skills. Motion designer and frontend engineer, when CSS transitions are not enough.
- `core-design/impeccable/reference/animate.md`: motion that conveys state, feedback and hierarchy. Motion designer.
- `motion/review-animations/` (with `STANDARDS.md`): strict review of motion code, flagging by default. Critic, after motion is written.
- Rule 20 bounds all of these: 120-250ms for feedback, transform and opacity, ease-out, no identical scroll fades, no endless loops, `prefers-reduced-motion` always.

## Imagery

- `image-direction/imagegen-frontend-web/`: art-directed website reference images, one per section. Art director, when references are needed before the build.
- `image-direction/imagegen-frontend-mobile/`: the same for app screens in phone mockups.
- `image-direction/brandkit/`: brand identity boards, logo systems, visual-world decks.
- `image-direction/canvas-design/`: original static posters and art as PNG or PDF, with local fonts.
- `workflow/image-to-code/`: generate design images, analyze them, then implement the site to match.
- `templates/image-poster/` and `templates/video-shortform/`: single key-art images and 3-10 second video clips.
- `core-design/impeccable/reference/brand.md` (Imagery section) and `core-design/impeccable/reference/codex.md` (visual direction and asset production when image generation is available). Art director.
- Rule 6 governs: show the real product or leave labeled placeholder slots, and photograph the brand's physical world, not its category.

## Deliverable templates

`templates/` holds 60 starting points, each with a `SKILL.md` (many add `example.html`, `assets/` or `references/`). The creative director picks one at kickoff; the layout designer takes its structure; the chosen direction replaces its default look (rule 5).

- Web pages: `saas-landing/`, `pricing-page/`, `waitlist-page/`, `docs-page/`, `blog-post/`, `faq-page/`, `contact-widget/`, `email-marketing/`
- Product UI: `dashboard/`, `live-dashboard/`, `kanban-board/`, `mobile-app/`, `mobile-onboarding/`, `login-flow/`, `gamified-app/`
- Prototypes and wireframes: `web-prototype/` and its three `web-prototype-taste-*` variants, `wireframe-sketch/`, `wireframe-greybox/`, `wireframe-annotated/`, `wireframe-mobile-flow/`
- Decks: `html-ppt/` (engine with 36 themes), `simple-deck/`, `guizang-ppt/`, `kami-deck/`, `deck-swiss-international/`, `deck-open-slide-canvas/`
- Documents: `invoice/`, `resume-modern/`, `meeting-notes/`, `pm-spec/`, `weekly-update/`, `team-okrs/`, `finance-report/`, `data-report/`, `release-notes-one-pager/`, `article-magazine/`, `doc-kami-parchment/`, `kami-landing/`
- Social and graphics: `card-twitter/`, `card-xiaohongshu/`, `social-x-post-card/`, `social-carousel/`, `poster-hero/`, `image-poster/`, `magazine-poster/`, `mockup-device-3d/`
- Video and motion: `hyperframes/`, `motion-frames/`, `video-shortform/`, `webgl-experience/`, `frame-data-chart-nyt/`, `frame-flowchart-sticky/`, `frame-glitch-title/`, `frame-light-leak-cinema/`, `frame-liquid-bg-hero/`, `frame-logo-outro/`, `frame-macos-notification/`

## Review and audit

- `core-design/unslop/scripts/shoot.mjs` and `core-design/unslop/scripts/lint.mjs` (see Ground rules): mandatory on every build.
- `core-design/impeccable/scripts/detect.mjs`: anti-pattern detector. `node core-design/impeccable/scripts/detect.mjs [--json] <file|dir|url>`; static analysis for files, a headless browser for URLs. Critic, as a second automated pass after lint.mjs.
- `core-design/critique/`: five-dimension scored review (philosophy, hierarchy, detail, functionality, innovation) with an HTML report. Critic, as a scoring gate.
- `core-design/web-design-guidelines/` with `references/guidelines.md` (pinned Vercel Web Interface Guidelines): findings in `file:line` form. Critic and frontend engineer.
- `core-design/impeccable/reference/critique.md`, `audit.md`, `polish.md`, `distill.md`, `quieter.md`, `bolder.md`: design critique, technical audit, final polish, and passes for too much, too loud or too timid. Critic.
- `motion/review-animations/`: motion review. Critic.
- `_archive/retired/redesign-existing-projects/`: audit checklist (typography, color, layout, states, content, components, icons, code) and fix priority for existing sites. Creative director, on redesigns.

## Artifacts

- `artifacts/artifacts-builder/`: multi-component claude.ai artifacts (React, Tailwind, shadcn/ui) with `scripts/init-artifact.sh` and `scripts/bundle-artifact.sh`. Frontend engineer.
- `artifacts/full-output-enforcement/`: complete output with no placeholders or truncation. Frontend engineer, on large builds.
- `artifacts/tweaks/`: wraps an HTML artifact in live controls (accent, type scale, density, motion, theme). Creative director, when the user wants to compare variants.
- `design-systems/theme-factory/`: applies one of its 10 themes, or a generated one, to an artifact. Colorist, for decks and documents.
- `design-systems/stitch-design-taste/`: generates an agent-friendly DESIGN.md; its "perpetual micro-motion" conflicts with rule 20. Creative director, when the project needs a written system file.
- `design-systems/brand-extract/`: extracts a brand kit from a live site through a browser. Colorist and typographer, when the brand lives only on its website.
