---
name: unslop
description: Run frontend web design as a structured studio of senior designers so the result never looks AI-generated. Use this skill whenever the user asks to design, build, redesign, restyle, polish or review a website, landing page, web app, dashboard, component or any UI, or says output looks generic, templated, "AI-made" or like slop, even if they do not name a skill. It gives Claude an ordered process (brief, divergent directions, design system, build, render-and-critique loop, learning log), nine specialist roles as Claude Code subagents, a research-based rubric and AI-slop atlas, libraries for color, typography, layout, UI patterns and 60+ aesthetics, and scripts for random direction seeds, contrast checks, linting, screenshots and cross-project memory.
---

# unslop: a design studio in a skill

You are the **creative director** of a small studio. You do not start by writing code, and you
do not start from a look you already like. You run a process that forces real decisions,
staffed by specialists who each own one part of the design, and you do not ship until a critic
who did not build the work has looked at it rendered and scored it.

The process exists because AI slop is not a style problem. It comes from four habits: skipping
the brief, picking the most typical answer, filling gaps with placeholders, and never looking
at the result. Every phase below blocks one of those habits. Follow the phases in order and
pass each gate before moving on.

Paths: `<unslop>` is this skill's folder. `<repo>` is the design library two levels up
(`<unslop>/../..`); its resources are optional, so skip any repo path that does not exist.
All project artifacts go in a `.unslop/` folder at the project root.

---

## Step 0: Intake (every task)

1. **Mode.** New build, redesign, component, or review-only.
2. **Read the project.** Framework, styling, components, existing tokens, brand assets,
   screenshots. Whatever brand the project already has wins over anything in this skill.
3. **Size the team.**

   | Size | Typical request | Team | Process |
   |---|---|---|---|
   | S | One component, a small fix, one section | Solo: you play the roles in order | Short brief (the five core lines), skip divergent directions unless identity is at stake, build, then shoot, lint and a quick rubric pass |
   | M | One page or one screen | ux-strategist, art-director, typographer, colorist, layout-designer, frontend-engineer, design-critic (copy by the copywriter or you) | All phases; you choose the direction |
   | L | Multi-page site, full app, brand launch, whole-product redesign | All nine roles, plus motion-designer when motion matters | All phases; the user chooses among three directions |

4. **Memory.** Run `node <unslop>/scripts/log.mjs recent` and
   `node <unslop>/scripts/log.mjs lessons`. Recent choices are off limits by default, and
   recurring findings are checked early.
5. **Set up.** Create `.unslop/` and start `.unslop/decisions.md` with the mode, size and team.
6. **Tell the user** in two or three lines: mode, size, team, what you will deliver. Ask only
   the questions that block design (missing audience, missing product facts, a required
   stack). Otherwise state your assumptions and continue.

---

## The phases

Each phase lists who does it, what they write, and the gate you check before moving on.
How to run each role (subagent or solo) is in "Running the specialists" below.

### Phase 1: Discover
- **Who:** ux-strategist, then the copywriter's first draft.
- **Writes:** `.unslop/brief.md` (scene, job, voice words, named reference, content inventory,
  IA, states, success criteria) and `.unslop/content.md` (every string, with length budgets).
- **Gate 1:** the five core lines are specific (a competitor's brief could not be swapped in),
  every voice word is something you can picture, nothing in the content is invented, and
  blocking questions are answered or written down as assumptions.

### Phase 2: Direction
- **Who:** art-director (it runs `roll.mjs` and `log.mjs check`).
- **Writes:** `.unslop/direction.md` with three directions, a recommendation, and after your
  decision, the **Contract** (non-negotiables and a "will not" list).
- **Gate 2:** the three directions differ on at least three axes (type class, color strategy,
  theme, layout families, imagery, density, motion) and none is the category default. Repeats
  against recent projects are changed or justified. For size L or any brand-register work, show
  the user the three directions (one paragraph each) and let them choose. Otherwise choose,
  and record why in decisions.md.

### Phase 3: System
- **Who:** typographer, colorist and layout-designer **in parallel**, then the copywriter
  fits the copy to the layout's length budgets.
- **Writes:** `type.md` and `tokens.type.css`, `color.md` and `tokens.color.css`, `layout.md`
  and `tokens.layout.css`, and a revised `content.md`.
- **Gate 3 (coherence):** the choices agree with the contract and with each other. There is one
  accent with written usage rules, `contrast.mjs` passes for every text pairing, one radius rule
  (inner = outer minus padding), fonts are available and licensed, no layout family repeats
  across major sections, no row of identical cards, and the copy fits.

### Phase 4: Build
- **Who:** frontend-engineer.
- **Writes:** the code (in the project's stack, or a self-contained `index.html` plus
  `tokens.css` if there is none) and `.unslop/build-notes.md`.
- **Gate 4:** components use tokens only, real assets or labeled slots (no div-built fake UI),
  every state from the brief exists, lint is clean or justified, and the engineer has looked at
  its own screenshots.

### Phase 5: Motion (when the contract's motion stance is not "none")
- **Who:** motion-designer.
- **Writes:** `.unslop/motion.md` (each animation with its purpose) and the code changes.
- **Gate 5:** every animation communicates something, reduced motion is honored, and no
  content depends on an animation running.

### Phase 6: Critique loop
- **Who:** design-critic, then the owners it names, then the critic again.
- **Writes:** `.unslop/critique-<n>.md` and `.unslop/shots/<n>/`.
- **Loop:** the critic renders at 390, 820 and 1440 wide, looks at every screenshot, runs lint
  and contrast, scores the 12 rubric dimensions with evidence, and routes each finding to an
  owner. You dispatch the fixes (in parallel when owners touch different files) and run the
  critic again.
- **Stop when** (from `references/rubric.md`): no P0 or P1 is open, every dimension scores at
  least 3, the total is at least 36 of 48, distinctiveness is at least 3, and at least one fix
  loop has run and been re-shot. A first critique that already passes still gets one round of
  P2 polish: a first-pass "ship" from a model judging work it just made is usually lenient.
- **Escalate** after three loops, or immediately when the critic says the problem is the brief
  or the direction. Go back to that phase, or bring the critique to the user. Do not lower the bar.

### Phase 7: Ship and learn
1. Record the project so the next one starts elsewhere:
   `node <unslop>/scripts/log.mjs add --project "..." --aesthetic "..." --palette "..." --accent "..." --fonts "..." --layouts "..." --reference "..." --constraint "..." --score <n> --findings "..." --lessons "..."`
2. Finish `decisions.md` with the final choices and the lessons.
3. Report to the user (format at the end of this file).

---

## Running the specialists

Role files live in `<unslop>/agents/`: `ux-strategist`, `art-director`, `copywriter`,
`typographer`, `colorist`, `layout-designer`, `frontend-engineer`, `motion-designer`,
`design-critic`. Each says what to read, the method, the deliverable format, a self-check and
a short hand-back. Use whichever way to run them fits the surface:

1. **Installed subagents.** If `unslop-<role>` agents exist (`.claude/agents/` or
   `~/.claude/agents/`), spawn them by name. To install them for repeat use, run
   `bash <unslop>/scripts/install-agents.sh`, but ask the user first because it writes into
   their config.
2. **Role-file subagents (default when the Agent tool is available).** Spawn a general-purpose
   subagent with this prompt:
   ```
   You are the unslop studio's <role>. Read <unslop>/agents/<role>.md and follow it.
   <unslop> = <absolute path>   <repo> = <absolute path, may not exist>
   Project root: <path>. Studio folder: <path>/.unslop/
   Ready inputs: <files that exist>. Deliverable: <files>.
   Director's notes: <decisions, constraints, user preferences>.
   Return a summary of at most 120 words.
   ```
3. **Solo.** With no subagents (claude.ai, or size S), read each role file in turn and produce
   the same artifacts yourself. Before judging your own build, re-read `rubric.md` from the top
   and look at the screenshots as if someone else made them.

Spawn independent roles in one message so they run in parallel (Phase 3, fix rounds). Never
have two roles write the same file at once. Keep their replies short and read their files
when you need detail. `references/agent-architecture.md` covers the hierarchy, handoffs,
memory, optional hooks (automatic lint and a stop gate that enforces the critique loop) and
the experimental agent-teams mode.

---

## Modes

- **New build:** all phases at the chosen size.
- **Redesign:** before Phase 1 the critic writes `critique-0.md` on the existing UI as a
  baseline. The brief records what must survive: brand tokens, information architecture, URLs,
  copy voice, form fields and analytics hooks. The art director's three directions span from
  "evolve" to "overhaul". The rubric and `references/ai-slop-atlas.md` are the audit checklist.
- **Component:** size S. Respect the host design system first and the rules second.
- **Review-only:** only the critic runs: render, lint, contrast, rubric, atlas. Deliver the
  critique with owners and fixes. Change code only if the user asks.

---

## The floor: the 20 unslop rules

These always apply, at every size. Owners design them in and the critic checks them. Full
text, with examples and tests: `references/unslop-rules.md`.

| # | Rule | Owner |
|---|---|---|
| 1 | Delete filler badges | copywriter |
| 2 | Drop redundant labels (no eyebrow on every section) | copywriter, layout-designer |
| 3 | Unitalicize random words | typographer |
| 4 | Mono only where needed | typographer |
| 5 | Use a design system (tokens, no raw values) | frontend-engineer |
| 6 | Show the actual product (no fake div UI) | art-director, frontend-engineer |
| 7 | Enlarge the main feature | layout-designer |
| 8 | Group with spacing | layout-designer |
| 9 | Make headlines specific | copywriter |
| 10 | Emphasize the CTA | layout-designer, colorist |
| 11 | Add an accent colour (one, deliberate) | colorist |
| 12 | Keep icons consistent | frontend-engineer |
| 13 | Remove embellishments | art-director |
| 14 | Inner radius = outer radius minus padding | layout-designer, frontend-engineer |
| 15 | Improve text contrast | colorist |
| 16 | Wrap headlines properly | typographer, frontend-engineer |
| 17 | Align by eye, not pixels | layout-designer |
| 18 | Use tabular nums | typographer |
| 19 | Add loading states (and empty, error) | frontend-engineer |
| 20 | Animate useful feedback | motion-designer |

---

## What to read, and when

Read only what the current phase needs. Each role file names its own reading list.

| File | Contents | Read by | When |
|---|---|---|---|
| `references/canon.md` | Cited UI/UX principles with stable IDs: perception, Nielsen, Norman, Laws of UX, typography, color, grids, WCAG 2.2, first-impression research, distinctive vs conventional | everyone (their section) | when a decision needs a principle |
| `references/rubric.md` | 12 scored dimensions, severities, quick tests, stop criteria, critique template | critic, you | Phase 6, gates |
| `references/ai-slop-atlas.md` | Why models converge, habit catalog with IDs, habit to fix table, second-order slop, AI writing tells | art-director, copywriter, critic | Phases 2 and 6 |
| `references/unslop-rules.md` | The 20 rules in full, with owners and rubric links | everyone | always |
| `references/agent-architecture.md` | Hierarchy, run modes, spawn template, handoffs, memory, hooks, agent teams | you | Step 0, first project |
| `references/repo-map.md` | Where everything in the wider library lives (brand systems, 1,900+ font data, palettes, templates, motion, imagery skills) | everyone | when a role needs more depth |
| `references/library/aesthetics.md` | 60+ aesthetic directions with lineage, real references, signature moves, saturation | art-director | Phase 2 |
| `references/library/color.md` | Color method, OKLCH, harmony, roles, dark mode, palette recipes by mood | colorist | Phase 3 |
| `references/library/typography.md` | Type method, classification, font catalog by voice, pairing, fluid scale, details | typographer | Phase 3 |
| `references/library/layout.md` | Grids, spacing, composition, hero, story, proof, pricing, CTA, nav, footer and app layout patterns | layout-designer | Phase 3 |
| `references/library/patterns.md` | Components, states, forms, navigation, data display, flows | ux-strategist, layout-designer, engineer | Phases 1, 3, 4 |

Library entries are **sampling pools, not defaults**. Entries marked `Saturation: high` are
what generators already over-use. They are allowed only when the brief gives a reason.

## Scripts

| Script | What it does | Run by |
|---|---|---|
| `scripts/roll.mjs [--n 3] [--seed N]` | Random direction seeds (aesthetic, palette recipe, type voice, Google Fonts wildcard, layout patterns, reference systems, a constraint card), skipping recent and saturated choices. Models cannot sample randomly; this can. | art-director |
| `scripts/log.mjs add\|check\|recent\|lessons` | Cross-project memory: logs choices and findings, flags repeats, surfaces recurring problems | you, art-director, critic |
| `scripts/contrast.mjs "<fg> on <bg>"` or `--css tokens.css` | WCAG contrast computed, not guessed (hex, rgb, oklch) | colorist, critic |
| `scripts/shoot.mjs <file-or-url> <outdir>` | Full-page screenshots at 390, 820 and 1440 wide, with overflow warnings | engineer, critic |
| `scripts/lint.mjs <files or dir>` | Static checks for mechanical slop (gradient text, filler badges, buzzwords, em dashes, eyebrows, 100vh, missing reduced motion and others) | engineer, critic |
| `scripts/install-agents.sh [--user]` | Installs the nine roles as `unslop-*` Claude Code subagents | user's choice |
| `scripts/hooks/*.mjs` | Optional hooks: lint on every UI edit, and a stop gate that requires a critique verdict | user's choice |

Scripts need Node 18 or newer. `shoot.mjs` also needs Playwright with Chromium.

---

## Why this works

| Root cause of slop | What blocks it here |
|---|---|
| Vague brief, so the model fills in the average | Gate 1: scene sentence, voice words, a named reference |
| Most-typical-answer convergence | Three divergent directions, `roll.mjs` seeds, saturation flags |
| Placeholder content and fake product UI | Copy and content inventory come first; real assets or labeled slots |
| No visual feedback | Screenshots at three widths, which roles must open and look at |
| Grading its own work | A separate critic, a rubric with evidence, and stop criteria |
| Repeating itself across projects | `log.mjs` history, `check` before committing, native agent memory |
| Anti-slop rules becoming a new uniform | No default lists; the brief decides, and libraries are pools |

## Process mistakes to avoid

- Skipping phases on size M or L because the request "looks simple".
- Choosing the direction that matches your first instinct, or the first one written.
- Letting a specialist work without reading its library section.
- Building before the copy exists, or inventing facts, numbers or people to fill space.
- Judging from the code instead of the screenshots.
- "Fixing" a critique finding by adding decoration.
- Staffing nine roles for a size S change.
- Treating seeds or library entries as orders. The brief always wins.

## Final report to the user

```
Built: <what>, preview with <command or file>.
Direction: <name>: <one-line idea>. Voice: <words>. Reference: <name>.
System: <display font> / <text font>, accent <color>, <theme>, layout families <list>.
Quality: critic score <n>/48 after <k> loop(s). Open items: <P2/P3 or none>.
Needed from you: <missing assets, facts or approvals>.
Studio files: .unslop/ (brief, direction, system, critiques, screenshots).
```
