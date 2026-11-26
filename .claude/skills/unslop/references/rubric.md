# Design critic rubric

The design critic's scoring rubric for unslop. Read all of it before every critique, and re-read it fresh (not from memory) when you judge your own build in solo mode. Canon IDs such as GES-PROX or A11Y-1.4.3 point to `core-design/unslop/references/canon.md`, which carries the sources. R1-R20 are the 20 rules in `core-design/unslop/references/unslop-rules.md`. Paths are relative to the repo root; `<unslop>` in the role files is `core-design/unslop`.

## Inputs and tools
- Brief and contract: `.unslop/brief.md` (who, job, voice words, named reference, real content) and `.unslop/direction.md` (its non-negotiables), plus the previous critique if one exists.
- Lessons first: run `node core-design/unslop/scripts/log.mjs lessons` and check those recurring findings before anything else.
- Render: `node core-design/unslop/scripts/shoot.mjs <entry> .unslop/shots/<n>` writes full-page shots at 390, 820 and 1440 and reports horizontal overflow. Open every image and look top to bottom.
- Measure: `node core-design/unslop/scripts/lint.mjs <source files>` and `node core-design/unslop/scripts/contrast.mjs --css <tokens file>`; use `contrast.mjs "<fg> on <bg>"` for pairs the tokens miss, such as text over photos. Habits to look for: `core-design/unslop/references/ai-slop-atlas.md`.

## How to score
- Score what is on screen and in the code, never the intent. Every score cites evidence: a shot and region ("1440, hero left"), a file and line, or a script result.
- Score each dimension at its worst width: a 4 at 1440 and a 2 at 390 is a 2.
- Each dimension lists its canon IDs and rules, then anchors from 4 down to 0, then checks marked [screenshot], [code] or [both] for where you verify them.
- Between anchors, pick the lower score; a dimension that just misses 3 is a 2, because the stop criteria depend on it.
- With little to judge (a static page has no motion), score what exists and say why: no motion at all earns a 4 on D10 only if nothing needed feedback beyond CSS states.

## The 12 dimensions

Rule coverage, matching `unslop-rules.md`: R1 D6 D12, R2 D2 D6, R3 D3, R4 D3, R5 D9, R6 D1 D6, R7 D2, R8 D5, R9 D6, R10 D2, R11 D4, R12 D9, R13 D12, R14 D9, R15 D4 D8, R16 D3 D11, R17 D5 D9, R18 D9, R19 D7, R20 D10.

### D1. Brief fit and distinctiveness
Canon: EMP-PROTO, EMP-MAYA, DIS-SPLIT, DIS-ASSETS, DIS-CATEGORY, LAW-JAKOB, CON-IMAGERY. Rules: R6, plus the brief and the direction contract.
- 4: every major choice traces to the voice words and the named reference; identity is owned (swap and category tests pass) while structure stays familiar for the category.
- 3: clearly derived from the brief, with one or two generic elements left; the swap test passes.
- 2: competent but interchangeable: a competitor could ship most of it, and the voice words are hard to find.
- 1: the category default or the AI default recipe; reference and voice words are invisible.
- 0: no brief, or the page serves a different job than the brief.
- [both] Point to where each voice word shows (type, color, imagery, copy); a word with no location is a finding.
- [screenshot] The swap and category tests pass (Quick tests).
- [screenshot] The actual product is shown: a real screenshot, a live component, or a labeled placeholder (R6).
- [both] Interaction patterns are conventional, or each unusual one has a DIS-BREAK rationale.
- [screenshot] The blurred first viewport still reads as its category (EMP-PROTO).

### D2. Visual hierarchy
Canon: HIE-FOCAL, HIE-LEVERS, PER-PREATT, LAW-VONR, LAW-HICK, SCAN-LAYER, COL-VALUE, EMP-50MS. Rules: R2, R7, R10.
- 4: one unmistakable focal element per view, then the primary action, then the rest, at every width; squint and grayscale tests are clean.
- 3: the right order, with one minor competitor in one view.
- 2: a focal point exists but two or more elements compete with it, or the CTA is not the strongest action.
- 1: equal weight everywhere (identical tiles, uniform sections); the eye has nowhere to land.
- 0: hierarchy points at the wrong thing; decoration outranks the job.
- [screenshot] Squint test: exactly one element pops per viewport, and it is the brief's focal element (R7).
- [screenshot] One primary CTA per view with the highest-contrast fill and largest hit area; secondary actions are quieter (R10).
- [screenshot] No row of equal tiles for unequal things; cells are sized by importance and filled with real content (R7).
- [both] About three type sizes and three text emphasis levels per section (HIE-LEVERS).
- [screenshot] The headings alone tell the page's story, and no eyebrow restates its heading (SCAN-LAYER, R2).

### D3. Typography
Canon: TYP-MEASURE, TYP-SIZE, TYP-LEADING, TYP-SCALE, TYP-FLUID, TYP-WRAP, TYP-CHOICE, TYP-WEIGHT, TYP-CAPS. Rules: R3, R4, R16.
- 4: families chosen for the voice words, one scale everywhere, and clean measure, leading and wrapping at all widths.
- 3: a sound system with a few off-scale sizes or one wrap flaw.
- 2: a habitual or default family with no link to the brief, or several wrap and measure problems.
- 1: mixed families without logic, random italic or serif words, mono as costume, full-width paragraphs.
- 0: text is unreadable at some width: overflow, collisions or tiny body text.
- [code] Every font-size is a scale token, with at most two families plus mono for code (TYP-SCALE, R4).
- [code] Headings use text-wrap: balance and prose uses pretty (R16; lint.mjs flags an h1 rule without it).
- [screenshot] No single-word last line, four-line hero or heading overflow at 390, 820 or 1440 (R16).
- [both] Body measure 60-75ch, body size at least 16 px, line-height in range (TYP-MEASURE, TYP-LEADING).
- [both] No lone italic or serif word in a headline, and mono only for code, keys, identifiers and aligned data (R3, R4).

### D4. Color and contrast
Canon: COL-VALUE, COL-ACCENT, COL-NEUTRAL, COL-ONCOLOR, COL-OKLCH, COL-ALBERS, COL-APCA, A11Y-1.4.3, A11Y-1.4.11. Rules: R11, R15.
- 4: neutrals plus one brand-derived accent, used only for action, links and key emphasis in every state and chart; every text pair passes with margin in every theme.
- 3: accent discipline holds, with one or two weak but passing pairs.
- 2: a second accent or decorative use of the accent, or one failing text pair outside the main content.
- 1: several accents or the category default palette; pale gray body text on a tinted ground.
- 0: body text or CTA labels fail contrast badly, or meaning depends on color alone.
- [code] The hues in the CSS are neutrals, one accent and status colors only, all as tokens (R11).
- [code] contrast.mjs on the tokens: body, muted, placeholder and helper text, links and on-accent labels at least 4.5:1; large text and UI parts at least 3:1 (R15).
- [screenshot] Text over images sits on a scrim or a calm region, spot-checked with contrast.mjs (R15).
- [code] Neutrals are tinted toward the accent hue, and no gray text sits on a colored surface (COL-NEUTRAL, COL-ONCOLOR).
- [screenshot] Each theme is checked on its own, and the accent looks equally strong on every surface (COL-ALBERS).

### D5. Layout, spacing and alignment
Canon: GES-PROX, GES-REGION, LAY-GRID, LAY-SPACE, LAY-BASELINE, LAY-ALIGN, LAY-ZIGZAG, HIE-BALANCE. Rules: R8, R17.
- 4: grouping reads from space alone, spacing comes from one scale with varied section rhythm, and a few shared alignment lines hold; the grid breaks only for the focal element.
- 3: clear structure with a few ambiguous gaps or one misaligned group.
- 2: boxes do grouping that space should do; section rhythm is uniform; many alignment lines.
- 1: nested cards, cards that only hold text, dividers under every row, labels equidistant between groups.
- 0: overlap, collision or a broken layout at some width.
- [screenshot] Each label and caption sits closer to its own object than to its neighbors (GES-PROX, R8).
- [both] No nested cards, and containers appear only where space cannot group (R8).
- [code] Every margin, padding and gap uses the spacing scale (LAY-SPACE).
- [screenshot] Section rhythm varies: not every section has the same padding and layout (R8).
- [screenshot] Few alignment lines shared across sections, no zigzag rows, card buttons on one row, baselines aligned (R17).

### D6. Content and copy
Canon: CON-HEADLINE, CON-CONCISE, KRUG-OMIT, CON-LINKS, CON-ACTION, CON-PLAIN, CON-LABELS, NIE-02, NIE-08. Rules: R1, R2, R6, R9 (and R10 labels).
- 4: the headline says what, for whom, with a concrete noun and verb; every label earns its place; numbers are real or labeled as samples; the voice matches the brief.
- 3: specific and clean, with one vague line or one redundant label.
- 2: a generic headline, or several redundant labels, "Learn more" links or filler.
- 1: buzzwords, statement-then-negation, invented stats or placeholder names.
- 0: lorem ipsum, or copy that misrepresents the product.
- [screenshot] The headline passes the swap test and names the product's job (R9).
- [code] lint.mjs buzzword, placeholder-name, filler-badge and em dash hits are zero or justified (R1, R9).
- [both] No invented numbers or testimonials; unverified figures are labeled as sample data (R9).
- [screenshot] No eyebrow repeats its heading, no placeholder repeats its label, no unit repeats on every row (R2).
- [screenshot] Buttons are a verb plus an object, one label per intent, and no bare "Learn more"; every badge states something the reader must act on, once (CON-LINKS, R1, R10).

### D7. Interaction and states
Canon: NIE-01, NIE-03, NIE-05, NIE-09, INT-RT, INT-PROGRESS, INT-STATES, INT-EMPTY, NOR-SIGNIFIER, NOR-MAPPING, CON-ERROR. Rules: R19.
- 4: every control has every state, every async surface has loading, empty and error states, and the brief's primary task completes with clear feedback at each step.
- 3: all states exist, and one is weak (a generic empty message, a spinner where a skeleton fits).
- 2: happy path only on one data surface, or missing hover, focus or disabled states.
- 1: no loading, empty or error states; clickable things look static, or static things look clickable.
- 0: the primary task cannot be completed.
- [code] Each async view renders loading (a skeleton shaped like the layout), empty (what, why, one action) and error (what happened, how to fix it) (R19).
- [both] Every control shows default, hover, focus-visible, active and disabled states (INT-STATES).
- [screenshot] With the copy covered you can still point to every clickable element, and nothing inert looks clickable (NOR-SIGNIFIER).
- [both] Form errors appear in text next to the field and keep the user's input (CON-ERROR).
- [both] Overlays close with Escape and a visible control; destructive actions offer undo or a confirmation that names the object (NIE-03).

### D8. Accessibility
Canon: A11Y-POUR, A11Y-1.4.1, A11Y-1.4.3, A11Y-1.4.10, A11Y-1.4.11, A11Y-1.4.12, A11Y-2.1.1, A11Y-2.3.3, A11Y-2.4.7, A11Y-2.4.11, A11Y-2.5.8, A11Y-3.3.1, A11Y-3.3.2, A11Y-3.3.7, A11Y-3.3.8. Rules: R15 (and R19 focus, R20 reduced motion).
- 4: WCAG 2.2 AA is met on everything checked, reduced motion is honored, and the keyboard path is complete.
- 3: AA is met, with one best-practice or AAA gap.
- 2: one AA failure outside the primary path.
- 1: AA failures on the primary path (contrast, focus, labels).
- 0: the primary task is impossible by keyboard or screen reader.
- [both] Color is never the only cue: check the grayscale shot and the code for status, links and charts (A11Y-1.4.1).
- [both] The primary task completes by keyboard alone, with focus always visible and never under sticky bars (A11Y-2.1.1, A11Y-2.4.7, A11Y-2.4.11).
- [both] Targets are at least 24 x 24 CSS px or properly spaced (A11Y-2.5.8).
- [both] At 320 wide nothing scrolls sideways, and the text-spacing overrides clip nothing (A11Y-1.4.10, A11Y-1.4.12).
- [code] Fields have programmatic labels, icon-only buttons have accessible names, images have alt text, and prefers-reduced-motion is handled wherever animation exists (A11Y-3.3.2, A11Y-2.3.3).

### D9. Craft details
Canon: LAY-OPTICAL, TYP-NUMS, GES-SIM, NIE-04, COL-OKLCH. Rules: R5, R12, R14, R17, R18.
- 4: tokens throughout, one radius rule applied exactly (inner = outer minus padding), one icon family and stroke, tabular numbers, optically aligned icons and type.
- 3: the systems hold, with one or two slips.
- 2: visible inconsistencies: mixed radii or icon styles, jittering numbers, off-center icons.
- 1: no system: ad hoc values, mixed icon families, emoji or hand-drawn SVG icons.
- 0: craft errors that break meaning: wrong or unreadable icons, clipped controls.
- [code] Components use tokens only, with no raw hex values or one-off sizes (R5).
- [code] The lint.mjs radius count passes (five values or fewer), and nested corners follow inner = outer - padding (R14).
- [both] One icon family, one stroke and one size per role; no emoji, no hand-drawn SVG, no icon restating its label (R12).
- [code] tabular-nums on prices, stats, tables and timers, and numeric columns right-aligned with consistent decimals (R18).
- [screenshot] Icons in buttons, play glyphs and large headings look optically centered and flush (R17).

### D10. Motion purpose
Canon: MOT-PURPOSE, MOT-DURATION, MOT-EASING, MOT-SCROLL, INT-RT, A11Y-2.3.3. Rules: R20 (and R13 for decorative loops).
- 4: every animation has a stated purpose (feedback, state change, spatial continuity, attention), is short and decelerating, moves only transform and opacity, and honors reduced motion; nothing loops or autoplays.
- 3: purposeful, with one transition slightly long or unnecessary.
- 2: decorative motion mixed in (one fade-up for every section), or no reduced-motion path.
- 1: motion everywhere, bouncy or slow, with content hidden until it animates.
- 0: motion that blocks reading or use, or large movement with no way to stop it.
- [code] Each transition and keyframe matches a purpose line in `.unslop/motion.md`; anything without one goes (R20).
- [code] No transition: all, ease-in-out or linear UI easing (lint.mjs); feedback at 120-250 ms, nothing over 400 ms without a reason (MOT-DURATION).
- [both] No scroll-triggered entrance on every section, no infinite loops, no auto-advancing carousels (MOT-SCROLL).
- [both] High-frequency actions are not animated (MOT-PURPOSE).
- [code] Only transform and opacity animate, and reduced motion is honored (A11Y-2.3.3).

### D11. Responsiveness
Canon: LAY-INTRINSIC, TYP-FLUID, TYP-WRAP, A11Y-1.4.10, A11Y-2.5.8, LAW-FITTS. Rules: R16 (and R7, R10 at small widths).
- 4: each width is designed, not shrunk: the focal element, hierarchy and CTA hold at 390, 820 and 1440 and in between.
- 3: all widths work, with one awkward intermediate width.
- 2: mobile is a squeezed desktop: tiny targets, overlong headlines, side-by-side content that should stack.
- 1: horizontal scroll, overflow or hidden content at one width.
- 0: broken at a primary width.
- [screenshot] At 390 the focal element and the primary CTA sit in the first viewport at full size (R7, R10).
- [screenshot] At every width, no four-line hero headline and no single-word last line (R16).
- [both] shoot.mjs reports no horizontal overflow, and wide tables scroll inside their own container (A11Y-1.4.10).
- [screenshot] 820 gets its own arrangement, not a stretched phone or a squeezed desktop.
- [code] Layout uses intrinsic primitives, clamp() and container queries rather than fixed widths, and 100dvh rather than 100vh (LAY-INTRINSIC; lint.mjs flags 100vh).

### D12. AI-slop absence
Canon: NIE-08, LAW-OCCAM, LAW-VONR, DIS-CATEGORY, CON-CONCISE, MOT-SCROLL. Rules: R1, R13 (and R3, R4, R6 tells). Habits: `core-design/unslop/references/ai-slop-atlas.md`.
- 4: nothing is there by default; no tells from the rules, the atlas or the anti-default recipe.
- 3: one minor tell (a decorative divider, one tracked label) with no pattern.
- 2: two or three tells, or one dominant one (a gradient hero, three icon cards).
- 1: the default recipe: badges, eyebrows, gradient text, glows, a fake dashboard, emoji icons.
- 0: mostly decoration and filler, with no real content.
- [code] lint.mjs is clean, or every hit has a written justification.
- [screenshot] No filler badges, status dots or tags laid over images (R1).
- [screenshot] No gradient text, glow, blobs, mesh orbs, all-over grain, crosshairs, corner ticks, rotated side text, scroll cues, clock strips, version footers or fake section numbering (R13).
- [screenshot] No hero that is only text over a gradient, and no fake dashboard built from styled divs (R6).
- [screenshot] Not the anti-default recipe either: pill buttons, glass nav and oversized radii everywhere, an eyebrow on every heading (second failure mode in `core-design/unslop/SKILL.md`).

## Severity
- P0 Blocker: the page fails its job or misleads: the primary task is impossible; content is clipped, overlapping or unreadable at a primary width; invented facts, stats or testimonials are presented as real; a keyboard trap. Fix before anything else.
- P1 Major: a WCAG 2.2 AA failure; hierarchy points at the wrong thing or the CTA is unclear; a data surface lacks loading, empty or error states; the 5-second, swap or category test fails; a direct rule violation in the first viewport; anything that breaks a non-negotiable in `.unslop/direction.md`.
- P2 Minor: a visible craft or consistency flaw that does not block use: mixed radii or icons, off-scale spacing, non-tabular numbers in a column, a single-word last line, a rule violation below the fold.
- P3 Polish: an optional refinement or a taste note. Log it, but never block on it.

## Quick tests
Run these before detailed scoring; each takes about a minute and catches the expensive failures.
- 5-second test: look at the 1440 first viewport for five seconds, look away, then answer: what is it, who is it for, what do I do next? A wrong or missing answer is a P1 (EMP-50MS, KRUG-OBVIOUS).
- Squint test: blur the shot or view it at thumbnail size; the focal element and the CTA still stand out, in that order (HIE-FOCAL, PER-PREATT).
- Swap test: could a competitor ship this page unchanged with their logo on it? If yes, D1 is at most 2 (DIS-ASSETS).
- Category test: could you guess the palette and the layout from the industry alone? If yes, D1 is at most 2 (DIS-CATEGORY).
- Grayscale test: desaturate the shot; hierarchy, links, status and charts still read (COL-VALUE, A11Y-1.4.1).
- Delete test: for each badge, label, icon and ornament, would anyone lose information if it went? If not, it is a finding (NIE-08, R1).

## Stop criteria
Ship only when all of these hold:
- No P0 or P1 is open.
- Every dimension scores at least 3.
- The total is at least 36 of 48.
- D1, brief fit and distinctiveness, is at least 3.
- At least one fix loop has run (the user's pre-ship checks require one) and its fixes were re-shot and re-checked; if critique 1 already meets everything else, the verdict is fix with the open P2 findings.

Otherwise the verdict is fix, routed to owners, while loops remain. Escalate after three fix loops that still miss the criteria, or at once when the cause sits upstream in the brief or the direction (for example the swap or category test fails at the concept level): the creative director takes the critique back to that phase or to the user. Never lower the bar to ship. A labeled placeholder for an asset only the user can supply (R6) is not a finding, but it goes under "Needs from the user".

## Routing findings to owners

| Finding about | Owner |
|---|---|
| Task flow, structure, conventions, states the brief requires (D1 structure, D7 flows) | ux-strategist |
| Direction, distinctiveness, focal point, imagery, slop tells (D1 identity, D2, D12) | art-director |
| Headlines, labels, CTAs, errors, empty-state text (D6) | copywriter |
| Families, scale, measure, wrapping, emphasis, figures (D3, R18) | typographer |
| Accent, neutrals, contrast, themes (D4) | colorist |
| Grid, spacing, grouping, alignment, breakpoint layout (D5, D11 layout) | layout-designer |
| States in code, tokens, radii, icons, semantics, keyboard, responsive code (D7 code, D8, D9, D11 code) | frontend-engineer |
| Animation purpose, timing, easing, reduced motion (D10) | motion-designer |

Give each finding one owner and name any others as consulted. Every fix is concrete enough to act on without a follow-up question ("raise --ink-muted to 4.5:1 on --surface", not "improve contrast"). The critic routes and never edits product code.

## Report template
Write `.unslop/critique-<n>.md` from this template. Replace the verdict line with exactly one word (`Verdict: ship`, `Verdict: fix` or `Verdict: escalate`); never leave the template line in place, because the stop-gate hook reads a line starting "Verdict: ship" as a ship.

```markdown
# Critique <n> (fix loops so far: <n-1> of 3)
Brief: <who and where> | Job: <one job> | Voice: <w1>, <w2>, <w3> | Reference: <named reference>
Evidence: .unslop/shots/<n>/ at 390, 820, 1440 (overflow: <none or px>) | lint: <hits, justified> | contrast: <failing pairs> | lessons checked: <which>
Quick tests: 5-second <pass or fail, and what a viewer would say> | Squint <...> | Swap <...> | Category <...> | Grayscale <...> | Delete <...>

## Scores
| Dimension | Score | Evidence |
|---|---|---|
| D1 Brief fit and distinctiveness | /4 | |
| D2 Visual hierarchy | /4 | |
| D3 Typography | /4 | |
| D4 Color and contrast | /4 | |
| D5 Layout, spacing and alignment | /4 | |
| D6 Content and copy | /4 | |
| D7 Interaction and states | /4 | |
| D8 Accessibility | /4 | |
| D9 Craft details | /4 | |
| D10 Motion purpose | /4 | |
| D11 Responsiveness | /4 | |
| D12 AI-slop absence | /4 | |
| Total | /48 | |

## Findings (P0 first)
| ID | Sev | Dim | Rule / canon | Evidence | Fix | Owner |
|---|---|---|---|---|---|---|
| F1 | P1 | D2 | R7, HIE-FOCAL | 1440 hero: three equal cards outrank the product shot | Make the live product view two thirds wide and turn the cards into a short list below it | layout-designer |

Kept on purpose: <lint hits or rule deviations kept, each with its reason>
Needs from the user: <missing assets, copy or decisions, with the placeholders now in place>

Verdict: ship | fix | escalate
Reason: <the stop criteria met, or which ones failed>
Next: <owner task list for fix, or the question for the user on escalate>
Log: <recurring findings for `log.mjs add --findings`, for example "rule-15 contrast, rule-2 eyebrows">
```
