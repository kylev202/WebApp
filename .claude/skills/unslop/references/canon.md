# Canon: established UI/UX principles

Reference for every unslop role. Each principle has a stable ID that other files cite (`rubric.md`, the role files in `core-design/unslop/agents/`, critiques). Each entry gives **Says** (the principle in one line), **Apply** (what to do in a web UI) and **Check** (how to verify it in a screenshot from `core-design/unslop/scripts/shoot.mjs` or in the code). Tags such as (R8) name the unslop rule a principle backs (R1-R20, full text in `core-design/unslop/references/unslop-rules.md`); where a rule is more specific than the canon, the rule wins. Paths are relative to the repo root.

ID prefixes: GES Gestalt, PER perception, HIE hierarchy, SCAN scanning, NIE Nielsen, SHN Shneiderman, NOR Norman, KRUG Krug, LAW Laws of UX, TYP type, COL color, LAY layout, INT interaction, MOT motion, A11Y WCAG 2.2 success criteria, CON content, EMP empirical aesthetics, DIS distinctive vs conventional.

Read by (section numbers): ux-strategist 2, 8, 10; art-director 1, 9, 10; typographer 3; colorist 4, 7; layout-designer 1, 5; copywriter 8; frontend-engineer 6, 7; motion-designer 6; design-critic all.

What the big curricula share: Google's UX Design Certificate runs from foundations through empathize, define and ideate, then wireframes and low-fidelity prototypes, research and testing, and high-fidelity design [S1]; IxDF pairs beginner foundations with dedicated visual design and accessibility courses [S2]; NN/g's certification groups courses into specialties such as interaction design, which includes visual design fundamentals [S3]; and all of them test early and often, since about five users per qualitative round surface most problems and iterating beats one big study [S4]. This file is that shared core, made checkable.

## Contents
1. [Perception and hierarchy](#1-perception-and-hierarchy)
2. [Usability heuristics and laws](#2-usability-heuristics-and-laws)
3. [Typography](#3-typography)
4. [Color](#4-color)
5. [Layout and grids](#5-layout-and-grids)
6. [Interaction, feedback and motion](#6-interaction-feedback-and-motion)
7. [Accessibility](#7-accessibility)
8. [Content and microcopy](#8-content-and-microcopy)
9. [First impressions and aesthetics research](#9-first-impressions-and-aesthetics-research)
10. [Distinctive vs conventional (when to break patterns)](#10-distinctive-vs-conventional-when-to-break-patterns)
11. [Sources](#sources)

## 1. Perception and hierarchy

People group, rank and scan a page before they read a word. Get grouping and the focal point right first, because polish cannot rescue them.

### GES-PROX: Proximity (R8)
- Says: elements close together read as one group and distance reads as separation; proximity can overpower similarity of color or shape [S7][S9].
- Apply: keep gaps inside a group clearly smaller than gaps between groups (about 1:2 or more on the spacing scale) and put every label nearer its own field than any neighbor, so space does the grouping that boxes and lines would otherwise do.
- Check: in each screenshot, every label, caption, price and button sits closer to its own object than to anything else; nothing is equidistant between two groups.
### GES-SIM: Similarity (R12)
- Says: elements that share color, shape, size or style read as related even when apart; it is the most resilient grouping cue, though proximity and common region can override it [S7].
- Apply: give each role one look (one link treatment, one secondary button style, one icon style) and never lend a role's look to something else, such as tags styled like buttons.
- Check: list every distinct style of clickable element in the code; each maps to one behavior and nothing static shares it.
### GES-REGION, GES-CONNECT: Common region and uniform connectedness (R8)
- Says: items inside a shared boundary, or joined by lines or a shared fill, read as one group, often more strongly than proximity or similarity [S7][S9].
- Apply: use a container only when space alone cannot show the group (a pricing tier, tabs, a form section); containers add clutter, so space comes first and cards never nest (R8) [S5].
- Check: for each card or bordered box, ask whether spacing alone would show the grouping; if yes, the box is decoration, and any card inside a card is a finding.
### GES-CLOSURE, GES-CONT, GES-PRAG: Closure, continuity and Prägnanz
- Says: people complete partial shapes, follow lines past their ends, and read ambiguous figures as the simplest form available [S7][S8][S9].
- Apply: let a partly visible next item at a scroller's edge signal more content; set sequences such as steps and timelines on one continuous axis; keep marks, icons and shapes simple enough to resolve in one glance.
- Check: horizontal scrollers show a partial next item at 390; steps share one axis; no shape needs a second look.
### GES-FIGURE: Figure-ground
- Says: people split a scene into a figure to attend to or act on and a ground behind it [S8].
- Apply: give dialogs, menus and sheets a clear ground (dimmed backdrop, elevation or a contrasting surface), and put text over imagery only with a scrim or on a calm region (R15) [S67].
- Check: at each width the active layer is unambiguous, and text over a photo measures at least 4.5:1 against the worst region behind it.
### PER-PREATT: Preattentive attributes (R7, R11)
- Says: a few features (hue, luminance, size, orientation, motion and some others) are processed in parallel before an eye movement, within roughly 200-250 ms, so one odd item pops out without search [S10][S11].
- Apply: spend pop-out on one thing per view, the focal element or the primary action, through one channel (the accent or size); many pop-out signals cancel each other, and motion is the strongest, so reserve it.
- Check: squint at or blur the screenshot: exactly one element pops per viewport.
### HIE-FOCAL, HIE-BALANCE: One focal point, balanced around it (R7, R10)
- Says: visual hierarchy is the order in which the eye meets elements, built from contrast, scale and grouping; balance distributes visual weight around an axis, symmetrically or not [S5][S6].
- Apply: name the one thing to see first (from the brief's job), make it dominant by size, then the primary action, then the rest; counter a heavy element with space or a lighter mass instead of centering everything by default.
- Check: in the 1440 and 390 shots, the first stop is the named focal element and you can number the next two stops in the order the brief wants.
### HIE-LEVERS: Value, scale and grouping, in few steps (R7)
- Says: contrast in value and saturation, not hue itself, creates hierarchy [S5]; NN/g suggests no more than three sizes [S6]; Refactoring UI uses three text colors (dark, gray, lighter gray) and about two weights [S34]; Apple builds hierarchy from order, spacing and contrast, through layout and grouping rather than decoration [S14].
- Apply: per section, use a short size ladder and three text emphasis levels (each still passing A11Y-1.4.3); demote competitors with a lighter color or smaller size rather than a lighter weight [S34].
- Check: count distinct font sizes and text colors in one section; more than about four sizes or three text colors needs a reason.
### SCAN-F, SCAN-LAYER: Scanning patterns (R2, R9)
- Says: on unstructured text people scan in a rough F, favoring the top lines and the left edge; with meaningful headings they scan in a layer-cake pattern, and they spot-scan for links, numbers and keywords; good formatting reduces F-scanning [S12][S13].
- Apply: write headings and subheads that carry the content, front-load the distinctive words of headings, list items and links, and break long text into chunks with meaningful subheads instead of decorative eyebrows.
- Check: read only the headings: they tell the page's story in order, and the first two words of each item and link are the distinctive ones.

## 2. Usability heuristics and laws

Nielsen's ten heuristics (with Rolf Molich in 1990, refined in 1994 from a factor analysis of 249 usability problems) are rules of thumb, not laws [S15]. Shneiderman's and Norman's overlapping concepts are merged into the matching heuristic. The Laws of UX Gestalt entries (proximity, similarity, common region, uniform connectedness, Prägnanz) are in section 1.

### NIE-01, NOR-FEEDBACK: Visibility of system status (R19, R20)
- Says: keep people informed about what is going on through appropriate feedback within a reasonable time; Norman makes feedback one of the fundamental principles of design [S15][S17].
- Apply: every action gets a visible response where it happened (pressed state, inline confirmation, updated count), and every async surface has loading, empty and error states (R19).
- Check: in code, every fetch or submit path renders loading and error branches; in the build, every button has a pressed or busy state.
### NIE-02, NOR-MODEL: Match the real world and the user's model (R9)
- Says: speak the users' language, with familiar words, concepts and a natural order; Norman shows that a good conceptual model makes a product understandable, and that the product itself has to communicate it [S15][S17].
- Apply: name things with the user's nouns from the brief, not internal or category jargon; order steps the way the task happens; structure the page the way the user thinks about the product.
- Check: a stranger reading only the nav labels and the headline can say what the product does and where to go for the brief's job.
### NIE-03: User control and freedom
- Says: people slip and need a clearly marked way out, such as undo, cancel and back; Shneiderman's "permit easy reversal of actions" says the same [S15][S16].
- Apply: prefer undo over confirmation dialogs for reversible actions; every overlay and multi-step flow has a visible close or back, Escape closes overlays, and browser back works.
- Check: open every overlay in the build: Escape and a visible control close it; destructive actions offer undo or a confirmation that names the object.
### NIE-04: Consistency and standards (R5, R10, R12)
- Says: people should not have to wonder whether different words, situations or actions mean the same thing, so follow platform and industry conventions [S15]; Apple: things that look the same should behave the same [S14].
- Apply: one label per intent (R10), one component per job, tokens instead of one-off values (R5), web conventions for links, nav, forms and scrolling (LAW-JAKOB).
- Check: grep the copy for synonyms of one action ("Get started", "Sign up", "Start free"); grep components for raw hex values and one-off sizes.
### NIE-05, NOR-CONSTRAINT, LAW-POSTEL: Error prevention (R19)
- Says: better than a good error message is a design that prevents the problem; Norman's constraints make wrong actions hard; Postel's robustness principle accepts non-conformant input as long as the meaning is clear [S15][S17][S9].
- Apply: pick constraining controls (date picker, select, stepper, correct input type, inputmode and autocomplete), accept messy formats such as spaces in card numbers or pasted phone numbers and normalize them, and explain why an action is unavailable instead of failing silently.
- Check: paste a formatted value and submit an empty form in the build: the form normalizes or explains, it never just fails.
### NIE-06: Recognition rather than recall (R2)
- Says: minimize memory load by keeping elements, actions and options visible or easy to retrieve; Shneiderman: reduce short-term memory load [S15][S16].
- Apply: keep field labels visible (never placeholder-only, CON-LABELS), show current selections and active filters, offer recent or suggested items, and keep primary nav visible on desktop.
- Check: every field has a persistent visible label; after filtering, the active filters are listed on screen.
### NIE-07: Flexibility and efficiency of use
- Says: accelerators that novices never see speed up experts, so one design serves both [S15][S16].
- Apply: in tools, add keyboard shortcuts, bulk actions, sensible defaults and remembered preferences on top of the visible path, and do not animate high-frequency actions (MOT-PURPOSE).
- Check: the frequent actions named in the brief have a faster path that does not clutter the default view.
### NIE-08: Aesthetic and minimalist design (R1, R2, R13)
- Says: show only information that is relevant and needed, because extra information competes with the relevant information and lowers its visibility [S15].
- Apply: this is the canon behind R1, R2 and R13: delete filler badges, redundant labels and decoration; minimalist means nothing that does not serve the job, not a sparse look.
- Check: for each element ask "if I delete it, does anyone lose information?"; if not, it is a finding.
### NIE-09: Help users recognize, diagnose and recover from errors (R19)
- Says: error messages use plain language without codes, state the problem precisely and suggest a fix [S15].
- Apply: write messages per CON-ERROR and place them per A11Y-3.3.1.
- Check: trigger each error in the build: the message says what happened and how to fix it, next to the cause.
### NIE-10: Help and documentation
- Says: ideally the design needs no explanation, but help, when needed, is easy to search, focused on the task and concrete [S15].
- Apply: put help in context first: inline hints, a short definition at the first use of an unfamiliar term, empty states that teach (INT-EMPTY), then a help page.
- Check: every term a first-time user might not know has an inline explanation or link where it appears.
### SHN-1 to SHN-8: Shneiderman's eight golden rules
- Says: strive for consistency, seek universal usability, offer informative feedback, design dialogs to yield closure, prevent errors, permit easy reversal of actions, keep users in control, reduce short-term memory load [S16].
- Apply: SHN-1, 3, 5, 6 and 8 map to NIE-04, 01, 05, 03 and 06, and SHN-2 to NIE-07 plus section 7; two add something: SHN-4, every multi-step action has a clear start, middle and explicit end state; SHN-7, the interface responds to the person and does not move, autoplay or rearrange itself.
- Check: every flow ends on a designed success state, and nothing changes on screen without a user action except status the user asked for.
### NOR-SIGNIFIER, NOR-AFFORD: Signifiers over affordances (R10, R12)
- Says: affordances are the actions possible, signifiers are the perceivable signs that tell people about them, and signifiers matter far more to designers [S18]; NN/g found weak clickability signifiers cost users effort and train them to click and hover uncertainly [S25].
- Apply: interactive things look interactive (button shape or fill, links set apart from text by more than color in body copy, a hover and focus response) and static things look static.
- Check: cover the copy in the screenshot; you can still point to every clickable element, and nothing that looks clickable is inert.
### NOR-MAPPING: Mapping
- Says: the relationship between a control and its effect should be evident from layout [S17].
- Apply: put controls next to what they change (filters above the list, edit on the row, a stepper beside its value) and in the same spatial order as their targets.
- Check: for each control in the screenshot, the thing it changes is adjacent or visibly linked.
### KRUG-OBVIOUS, KRUG-SCAN: Self-evident pages for scanning visitors (R9)
- Says: Krug's first law, "Don't make me think": a page should be self-evident; people scan, satisfice and muddle through instead of reading; his second law says the number of clicks matters less than whether each click is mindless and unambiguous [S19].
- Apply: design for scanning, not reading: use conventions, make clickable things obvious, divide the page into clearly defined areas, and make every choice an easy one.
- Check: a first-time visitor answers "what is this, what can I do here, where do I start" from the first viewport without reading body text (5-second test in rubric.md).
### LAW-FITTS: Fitts's law (R10)
- Says: the time to acquire a target depends on its distance and size, and small, distant targets are slower and more error-prone [S9][S20].
- Apply: make the primary action large and near the user's current focus, give targets at least 24 x 24 CSS px (A11Y-2.5.8) and about 44 x 44 pt on touch, as Apple recommends [S14], and keep destructive targets away from frequent ones.
- Check: measure the primary CTA and the icon buttons at 390 in devtools.
### LAW-HICK, LAW-MILLER: Fewer, chunked choices (R7, R8)
- Says: decision time grows with the number and complexity of options (Hick); working memory holds only a handful of items, so people chunk, and Laws of UX warns against using "seven plus or minus two" as a hard design limit (Miller) [S9][S21][S22].
- Apply: cut options where the decision is time-sensitive (one primary CTA, a short nav), split long tasks into steps, and group long lists under labeled chunks, without simplifying into vague abstraction.
- Check: count top-level nav items and competing CTAs in the first viewport; long forms and settings are chunked under headings.
### LAW-JAKOB: Jakob's law (R5)
- Says: users spend most of their time on other sites, so they expect yours to work like the sites they already know [S9][S23].
- Apply: keep interaction conventions (logo linking home at top left, nav at top or left, recognizable links, native form controls, account and cart where the category puts them) and spend originality on identity (DIS-SPLIT).
- Check: every interaction pattern has a familiar precedent, or a written reason it is better (DIS-BREAK).
### LAW-TESLER: Conservation of complexity
- Says: every system has complexity that cannot be removed, only moved between the system and the user [S9].
- Apply: let the system carry it: smart defaults, inferred values, formatting done for the user; never "simplify" by deleting information people need to decide.
- Check: for each required input, ask whether the system could infer or default it.
### LAW-SERIAL, LAW-PEAKEND: First, last, peak and end are remembered (R10)
- Says: people best recall the first and last items in a series, and judge an experience mostly by its most intense moment and its end [S9][S24].
- Apply: put the most important items first or last in nav and lists, remove the worst friction peak, and design the end of each flow (confirmation, success, first full state) deliberately.
- Check: key nav items sit first or last; every flow ends on a designed screen, not a bare redirect or a toast that vanishes.
### LAW-VONR: Von Restorff (isolation) effect (R1, R10, R11)
- Says: among similar items, the one that differs is the one remembered [S9].
- Apply: isolate exactly what matters (the primary CTA, the recommended plan) with the accent or size; every extra highlight, badge or pill weakens the effect, and ad-like emphasis gets skipped (banner blindness) [S26].
- Check: count accent-colored or badged elements per viewport; more than one or two means emphasis has become noise.
### LAW-GOAL, LAW-ZEIGARNIK: Progress pulls people forward (R19)
- Says: motivation rises as a goal gets closer (goal-gradient), and unfinished tasks stay on people's minds (Zeigarnik) [S9].
- Apply: show real progress in multi-step flows and onboarding (step 2 of 4, a checklist of what is left), computed from real state, never faked.
- Check: multi-step flows show position and remaining steps, and the values come from state in the code.
### LAW-OCCAM, LAW-PARETO: Cut to the vital few (R1, R13)
- Says: among equally good options prefer the one with the fewest assumptions (Occam); for many events roughly 80% of effects come from 20% of causes (Pareto, an observed regularity, not a law) [S9].
- Apply: remove elements until one more removal would hurt the job, and spend effort on the few screens and states that carry most use: the first viewport, the primary flow, the most used component.
- Check: remove each section in turn, in thought or in devtools; any section whose loss nobody would notice is a finding.

## 3. Typography

Type carries most of the information. Values are ranges plus the context that decides them; choose inside them from the brief. Catalog by voice, pairing and details: `core-design/unslop/references/library/typography.md`. Treat the popular pairings in `core-design/ui-ux-pro-max/data/typography.csv` as lookups only, since a common pairing is exactly what fails the swap test.

### TYP-MEASURE: Measure (R16)
- Says: Bringhurst gives 45-75 characters per line as satisfactory for single-column text, 66 as ideal and about 40-50 in multi-column work; Butterick allows 45-90 [S27][S28].
- Apply: cap body text at 60-75ch (R16) with max-inline-size in ch units, which scale with the font (an Every Layout axiom) [S32]; captions and UI text may run shorter; no paragraph spans a 1440 viewport.
- Check: read max-inline-size or max-width in CSS, or count a body line in the 1440 shot: 60-75 characters.
### TYP-SIZE, TYP-LEADING: Body size and line spacing (R15, R16)
- Says: Butterick recommends 15-25 px for body text on the web and line spacing of 120-145% of the font size [S28]; WCAG 1.4.12 requires layouts to survive a 1.5 line height (A11Y-1.4.12).
- Apply: body at 16 px or more (larger for reading-heavy pages or older audiences), unitless line-height about 1.4-1.6 for body, tighter (about 1.05-1.25) for large display type, and looser as the measure grows.
- Check: computed body size and line-height in devtools; large headings neither collide nor float apart.
### TYP-SCALE, TYP-FLUID: A ratio-based scale, fixed or fluid (R5, R16)
- Says: a modular scale relates every size by one ratio so steps feel related [S29][S32]; Utopia interpolates a whole scale between a minimum and a maximum viewport with clamp(), using a smaller ratio at small widths and a larger one at large widths [S30].
- Apply: choose the ratio by context: tight (about 1.125-1.2) for dense product UI where many levels coexist, wider (1.25 and up) for editorial and marketing pages with few levels; fluid clamp() steps suit marketing and editorial, fixed rem steps suit app UI; define the steps as tokens and use nothing else.
- Check: every font-size in CSS resolves to a scale token, and no hero headline wraps to four lines at 390 (R16: lower the size).
### TYP-WRAP: Wrapping and alignment (R16)
- Says: text-wrap: balance evens line lengths in short blocks such as headings (browsers cap it at a few lines), and text-wrap: pretty avoids orphans in body text at some performance cost [S31].
- Apply: balance on headings, pretty on paragraphs, buttons on one line, left-aligned ragged-right body text, centered text only for short blocks, justified text only with hyphenation [S28].
- Check: no single-word last line in any heading at 390, 820 or 1440, no heading overflows its box, and no centered paragraph runs past about three lines.
### TYP-CHOICE: Typefaces chosen by context, not habit (R3, R4)
- Says: type is chosen for voice and use; Kennedy's advice to use neutral, clean faces fits most professional UI, while brands with a strong personality can carry distinctive faces [S35].
- Apply: by context: dense product UI and data wants a sturdy sans with a large x-height, several weights and tabular figures, and fails as voice on editorial or luxury surfaces; long reading wants a face drawn for text sizes, serif or humanist, and fails in tiny labels when its x-height is small; brand display wants a face that embodies the voice words at large sizes only, and fails at body sizes or when it is the category's current favorite; a system stack suits utilitarian tools and fails when the brief needs identity; mono is for code, keys and identifiers only (R4).
- Check: you can name the voice word each family serves; at most two families plus mono for code; a family that was simply the first to come to mind has been replaced (deriving tokens, `core-design/unslop/SKILL.md`).
### TYP-WEIGHT: Emphasis within one family (R3)
- Says: Refactoring UI builds hierarchy with color and weight as well as size, uses about two weights and avoids weights under 400 for UI text [S34]; Butterick: use bold or italic sparingly, never together, and underline only links [S28].
- Apply: emphasize with weight or size inside one family, on the word that is the point; italics only for titles, foreign terms and real stress; never one serif or italic word dropped into a sans headline.
- Check: grep headings for em, i or a second font-family on a single word, and count the font weights in use.
### TYP-CAPS: Capitals and tracking (R2)
- Says: strings of capitals need added letterspacing, and lowercase text should not be letterspaced without a reason [S27].
- Apply: use all caps for short labels whose role needs it (table headers, keycaps, a rare tag) and track them about 0.05-0.1em; never as an eyebrow above every section (R2).
- Check: lint.mjs flags tiny uppercase tracked labels and more than three per file; any letterspaced lowercase needs a reason.
### TYP-NUMS: Figures for data (R18)
- Says: tabular figures share one width, so columns align and changing numbers do not jitter; proportional figures read better in running text.
- Apply: font-variant-numeric: tabular-nums on tables, prices, stats, timers and counters; right-align numeric columns with consistent decimals and the unit in the header (R18, R2); confirm the chosen family ships tabular figures.
- Check: lint.mjs flags numeric classes without tabular-nums; in the screenshot, decimal points in a column line up.

## 4. Color

Color works through value first, then saturation, then hue. R11 fixes the structure (neutrals plus one accent); this section explains why and how. Method, ramps, dark mode and palettes by mood: `core-design/unslop/references/library/color.md`. Real brand tokens: `design-systems/brand-systems/<brand>/`. Measure, never guess: `node core-design/unslop/scripts/contrast.mjs`.

### COL-VALUE: Value before hue (R7, R15)
- Says: hierarchy comes from contrast in value and saturation more than from hue [S5]; Kennedy designs in black and white first, so spacing, size and contrast do the work before color arrives [S35].
- Apply: set the value structure first (ink, surfaces, the focal element's contrast) and add the accent last; any two colors meant to differ must also differ in lightness.
- Check: grayscale the screenshot: the focal element, the primary CTA and the text levels still read in the intended order.
### COL-ITTEN: Itten's seven contrasts as a working vocabulary
- Says: Itten named seven color contrasts: hue, light-dark, cold-warm, complementary, simultaneous, saturation and extension (proportion of area) [S36].
- Apply: decide which contrast does each job: light-dark for hierarchy and legibility, saturation for accent against neutral, extension for dosage (a small area of strong color balances a large quiet field), cold-warm for mood; keep complementary hues of equal value away from text edges, where they vibrate.
- Check: name the contrast that carries each section; if the answer is hue alone, the section fails grayscale and A11Y-1.4.1.
### COL-ALBERS: Color is relative (R11, R15)
- Says: Albers called color the most relative medium in art: the same color looks different depending on its neighbors and ground [S37].
- Apply: judge each color on its real ground and at its real size; re-check the accent on every surface it sits on (light, dark, tinted, photo) and tune it per theme instead of reusing one value.
- Check: in each theme's screenshots, the accent looks like the same color at the same strength everywhere it appears.
### COL-OKLCH, COL-RAMP: Scales in a perceptual space (R5, R11)
- Says: OKLCH, built on Ottosson's Oklab (2020), keeps perceived lightness steady as hue changes, unlike HSL, where equal lightness looks different across hues and generated themes lose contrast [S39][S40]; Kennedy's practical rule for shades is that darker steps gain saturation and often shift hue toward red, green or blue [S38].
- Apply: define neutral and accent ramps in oklch() with even lightness steps, derive hover and pressed states by lightness, and keep chroma inside sRGB or provide a fallback.
- Check: color tokens are oklch() or generated from it, equal steps look evenly spaced, and components contain no raw hex (R5).
### COL-ACCENT: One accent, small in area (R10, R11)
- Says: a highlight works only against what is not highlighted (LAW-VONR), and Itten's contrast of extension lets a small area of strong color balance a large quiet one [S9][S36].
- Apply: neutrals plus exactly one accent from the brand or brief, used for the primary action, links and key emphasis only, locked across states and charts (R11); status colors (error, warning, success) are a separate set used only for status; by context, product UI keeps the accent to actions, links and selection, editorial uses it as a sparse marker, marketing gives it to the primary CTA and at most one key emphasis per view; never a default blue or the purple-to-blue gradient.
- Check: list the hues in the CSS: neutrals, one accent and status colors only; the accent appears on the CTA and links and nowhere decorative.
### COL-NEUTRAL: Tinted neutrals, more steps than expected (R11, R15)
- Says: interfaces run mostly on grays for text, surfaces and controls, so you need more gray steps than you expect, starting from a very dark gray, since pure black tends to look unnatural [S33].
- Apply: build about 8-10 neutral steps tinted slightly toward the accent hue (R11), map them to roles (canvas, surface, raised, border, muted text, body text), and keep body text near the ink end (R15).
- Check: neutral tokens share a hue angle near the accent's at low chroma, and body text uses one of the two darkest steps.
### COL-ONCOLOR: No gray text on colored ground (R15)
- Says: gray text works on white by lowering contrast but looks washed out on color; use white at reduced opacity or a color of the background's own hue instead [S34].
- Apply: on tinted or colored surfaces, derive secondary text from the surface hue (darker on light surfaces, lighter on dark ones) and measure it (A11Y-1.4.3).
- Check: no neutral gray text token sits on a non-neutral surface, and secondary text on color still measures 4.5:1.
### COL-APCA: APCA is advisory, WCAG 2 is the bar (R15)
- Says: APCA was developed as a perceptual contrast method for WCAG 3 but is not part of WCAG 2.x, and the 2026 WCAG 3 working drafts still list the contrast algorithm as to be determined [S41].
- Apply: pass or fail on WCAG 2.2 ratios (A11Y-1.4.3, A11Y-1.4.11); use APCA only as an extra lens where ratios mislead, such as light weights and dark themes, never to excuse a WCAG 2 failure.
- Check: the critique reports WCAG 2 ratios from contrast.mjs, and any APCA value is labeled advisory.

## 5. Layout and grids

Layout is grouping, rhythm and alignment at page scale. Patterns by section and app type: `core-design/unslop/references/library/layout.md`.

### LAY-GRID: Grids as tools, chosen by content (R7, R8)
- Says: Müller-Brockmann treats the grid (columns, gutters, margins and modular fields) as an ordering tool that the designer adapts to the content, not a guarantee of good results [S42].
- Apply: by context: a single centered measure for reading; a 12-column grid for marketing pages with many spans; a modular grid (CSS grid areas) for editorial pages and dashboards that mix content types; an app shell (sidebar plus content) for tools; break the grid only on purpose, for the focal element (R7).
- Check: in the 1440 shot, block edges fall on a few column lines, and the one element that breaks them is the focal one.
### LAY-BASELINE: Vertical rhythm (R8)
- Says: tying spacing to the line-height unit gives a page a consistent vertical rhythm; Every Layout derives its modular spacing scale from the base line-height [S32].
- Apply: make spacing steps multiples of a base unit (4 or 8 px, or the body line-height) and set block margins from them; do not chase a strict baseline grid on the web, where content and fonts vary.
- Check: vertical gaps in CSS come only from spacing tokens, and section gaps vary with content (R8 asks for varied rhythm).
### LAY-SPACE, LAY-DENSITY: A spacing scale, dosed by context (R8)
- Says: Refactoring UI starts with too much white space and limits choices with predefined systems; Kennedy doubles the whitespace [S33][S35].
- Apply: use a small scale with clearly different steps (R8's example: 4, 8, 12, 16, 24, 40, 64), with padding inside a group smaller than gaps between groups (GES-PROX); density by context: generous on brand and marketing pages, compact but consistent in data-dense tools.
- Check: every margin, padding and gap uses a token, and no two neighboring gaps differ by only a few pixels.
### LAY-ALIGN, LAY-ZIGZAG: Few alignment lines, no zigzag (R17)
- Says: shared edges make elements read as one system; NN/g reports that zigzag image-text layouts make scanning less efficient and that horizontal attention leans left [S43].
- Apply: left-align text to shared edges, align baselines across side-by-side items, pin card actions to one row and start repeated lists at the same y (R17); keep one text column instead of alternating images left and right down the page.
- Check: trace the vertical alignment lines on the 1440 shot: few, shared across sections, and no alternating left-right feature rows.
### LAY-OPTICAL: Optical over mathematical alignment (R17)
- Says: geometric centering often looks wrong because shapes differ in visual mass, so final alignment is judged by eye.
- Apply: nudge play triangles right of center, let round and pointed shapes overshoot flat edges slightly, compensate the side bearing of large type at a left edge, balance icon-plus-label buttons optically, and check vertical centering of text in buttons, since font metrics add uneven space.
- Check: zoom the screenshot on buttons with icons, play glyphs and large headings: they look centered and flush, whatever the numbers say.
### LAY-INTRINSIC: Intrinsic layout from a few primitives (R8, R16)
- Says: Every Layout argues for algorithmic layouts that size from their content and suggest rather than prescribe, built from primitives: Stack, Box, Center, Cluster, Sidebar, Switcher, Cover, Grid, Frame, Reel, Imposter, Icon and Container [S32].
- Apply: pick by job: Stack for vertical flow, Cluster for wrapping groups of tags or buttons, Sidebar for a fixed side next to fluid content, Switcher for rows that become columns by container width, Grid for auto-fitting cards, Frame for fixed-ratio media, Reel for horizontal scrollers, Cover for a vertically centered hero; prefer gap, min(), clamp() and container queries over device breakpoints.
- Check: drag the viewport from 320 to 1440, not only the three shots: nothing breaks between breakpoints, and text containers have no fixed pixel widths.

## 6. Interaction, feedback and motion

Interaction is mostly states and timing. States, forms and flows: `core-design/unslop/references/library/patterns.md` and `core-design/impeccable/reference/interaction-design.md`. Before animating, read `motion/emil-design-eng/SKILL.md`; exact values are in `motion/review-animations/STANDARDS.md`.

### INT-RT, LAW-DOHERTY: Response-time limits (R19, R20)
- Says: 0.1 s feels instantaneous, 1 s keeps the flow of thought, and 10 s is about the limit of attention [S44]; Laws of UX cites Doherty and Thadani (1982, IBM Systems Journal) for responses under 400 ms keeping people productive [S9].
- Apply: acknowledge input within 100 ms (pressed state, optimistic update), show progress from about 1-2 s, and beyond 10 s give a percent-done indicator and a way to cancel.
- Check: throttle the network in devtools: every action shows a response at once and an indicator before the wait feels broken.
### INT-PROGRESS: Loading feedback sized to the wait (R19)
- Says: NN/g uses skeleton screens for full-page loads under 10 s, looping spinners for 2-10 s waits on a single module, and percent-done indicators for 10 s or more [S45].
- Apply: skeletons shaped like the final layout (R19), never a lone page spinner; reserve space so content does not jump when it lands; label long operations ("Uploading 3 of 12").
- Check: each async view has a skeleton, and its screenshot has the same geometry as the loaded state.
### INT-STATES: Every control has every state (R19)
- Says: controls need distinct default, hover, focus, pressed and disabled states, plus loading or selected where relevant; Material 3 draws them as state layers of 8% (hover), 10% (focus), 10% (pressed) and 16% (dragged) [S47].
- Apply: one state system for all controls, as tokens; hover is a bonus cue, never the only one (touch has none); disabled controls say why when it is not obvious; focus styles follow A11Y-2.4.7.
- Check: tab through and hover every control in the build, and grep for outline: none without a :focus-visible replacement.
### INT-EMPTY: Empty states that inform, teach and lead (R19)
- Says: NN/g's three guidelines: an empty state communicates system status, teaches what the feature does, and gives a direct path to the task that fills it [S46].
- Apply: say what the area is, why it is empty and offer one action that fills it; tell apart "nothing yet", "no results for this filter" and "failed to load".
- Check: render each list and panel with zero items: each shows a message and an action, never blank space or a bare "No data".
### MOT-PURPOSE: Motion must communicate, and frequency decides (R20)
- Says: motion serves feedback, state change, navigation (spatial continuity) and attention, and because the eye is so sensitive to motion it pulls attention for better or worse [S50].
- Apply: write a one-line purpose per animation (R20) and delete any without one; actions repeated many times a day get little or no animation (frequency table in `motion/review-animations/STANDARDS.md`).
- Check: every transition and keyframe in the code has a stated purpose, and nothing loops forever.
### MOT-DURATION, MOT-EASING: Short, decelerating, no bounce (R20)
- Says: NN/g puts simple feedback such as a checkbox near 100 ms and larger changes such as a modal at 200-300 ms, rarely past 400-500 ms [S49]; Material 3's duration tokens run from 50 to 1000 ms, with standard easing cubic-bezier(0.2, 0, 0, 1) for small utility transitions and emphasized easing for larger ones [S48].
- Apply: 120-250 ms for feedback (R20), about 200-300 ms for surfaces entering, ease-out curves for entrances, no bounce or overshoot in product UI, and only transform and opacity animate.
- Check: lint.mjs flags transition: all, ease-in-out and linear timing; any duration over 400 ms needs a reason.
### MOT-SCROLL: No scroll choreography, no autoplay (R13, R20)
- Says: NN/g reports that scroll-triggered text animations delay users and that auto-forwarding carousels annoy users and reduce visibility [S51].
- Apply: content is visible on arrival; scroll-linked motion only where it explains a sequence or a spatial relation, never the same fade-up on every section; no auto-advancing carousels; honor prefers-reduced-motion (A11Y-2.3.3).
- Check: scroll the build with reduced motion on and off: no text waits invisible for an animation, and nothing moves on its own.

## 7. Accessibility

WCAG 2.2 is the conformance bar, at AA unless the brief asks for more [S52]. These entries are the criteria a visual designer can break. Code-level checklist: `core-design/web-design-guidelines/references/guidelines.md`.

### A11Y-POUR: Perceivable, operable, understandable, robust
- Says: WCAG 2.2 organizes 13 guidelines under four principles: content is perceivable, operable, understandable, and robust enough for current and future user agents, including assistive technology [S52].
- Apply: sort each finding by principle: can it be perceived (contrast, alternatives), operated (keyboard, targets), understood (labels, errors, predictable behavior) and parsed (semantic HTML, names and roles)?
- Check: an automated scan (axe or Lighthouse) plus a manual keyboard pass, since automated tools catch only part of the problems.
### A11Y-1.4.1: Use of color, Level A (R11)
- Says: color is not the only visual means of conveying information, indicating an action or distinguishing an element [S52].
- Apply: pair color with a second cue: icon plus text for status, underline for links in body text (or 3:1 contrast against the surrounding text plus a non-color cue on hover and focus) [S54], direct labels or patterns in charts.
- Check: grayscale the screenshot: every status, error, link and chart series is still distinguishable.
### A11Y-1.4.3: Contrast (minimum), Level AA (R15)
- Says: text needs at least 4.5:1 against its background, and large text (at least 18 pt, or 14 pt bold: about 24 px, or 18.7 px bold) needs 3:1; ratios are not rounded, so 4.49:1 fails [S53].
- Apply: check body, secondary, placeholder and helper text, button labels, footer links and text over images (scrim, CON-IMAGERY) in every theme; thin or unusual faces may not count as large even at large sizes [S53].
- Check: `node core-design/unslop/scripts/contrast.mjs --css <tokens file>` for role pairs, plus `"<fg> on <bg>"` spot checks for what tokens miss, such as text over photos.
### A11Y-1.4.10, A11Y-1.4.12: Reflow and text spacing, Level AA (R16)
- Says: content works at 320 CSS px wide (1280 px at 400% zoom) without two-dimensional scrolling, except content that needs it, such as data tables [S56], and it survives line height 1.5, paragraph spacing 2x, letter spacing 0.12em and word spacing 0.16em without loss [S55].
- Apply: no fixed heights on text containers, no clipped text in fixed boxes, wrap instead of truncating, and let wide tables scroll inside their own container.
- Check: resize to 320 wide (shoot.mjs also reports horizontal overflow at its widths) and apply the four spacing overrides in devtools: nothing clips, overlaps or forces page-level horizontal scroll.
### A11Y-1.4.11: Non-text contrast, Level AA (R12, R19)
- Says: visual information that identifies components and their states, and graphics needed to understand content, need at least 3:1 against adjacent colors; inactive components are exempt, and focus indicators count [S54].
- Apply: input borders, checkbox outlines, toggle tracks, icon-only buttons, chart lines and focus rings reach 3:1; a two-color focus ring whose colors are at least 9:1 apart stays visible on any solid background [S54].
- Check: measure input borders and icon glyphs against their surface; pale hairline inputs on white are the usual failure.
### A11Y-2.1.1: Keyboard, Level A
- Says: all functionality is available from a keyboard [S52].
- Apply: native buttons, links and inputs first; custom widgets get roles, focusability and key handling; no hover-only menus; focus order follows visual order.
- Check: complete the brief's primary task with Tab, Shift+Tab, Enter, Space, Escape and the arrow keys only.
### A11Y-2.3.3: Animation from interactions, Level AAA (R20)
- Says: motion animation triggered by interaction can be disabled unless essential; changes of color, blur or opacity that do not change perceived size, shape or position do not count as motion [S60].
- Apply: wrap non-essential movement in a prefers-reduced-motion query or swap it for a fade; unslop treats this AAA criterion as required (R20).
- Check: lint.mjs flags animation without prefers-reduced-motion; toggle the OS setting and re-check the build.
### A11Y-2.4.7, A11Y-2.4.11: Focus visible and not obscured, Level AA (R19)
- Says: every keyboard-focusable element shows a visible focus indicator, and a focused element is never entirely hidden by author content such as sticky headers, footers or non-modal dialogs; 2.4.13 (AAA) adds size and contrast-change rules for the indicator [S57][S58].
- Apply: style :focus-visible with a ring that meets 3:1 (A11Y-1.4.11), never remove outlines without a replacement, and set scroll-padding to the height of sticky bars.
- Check: tab through the whole page in the build: focus is always visible, including under the sticky header and the cookie banner.
### A11Y-2.5.8: Target size (minimum), Level AA (R10)
- Says: pointer targets are at least 24 x 24 CSS px, or undersized targets are spaced so a 24 px circle centered on each touches no other target; exceptions cover inline links, equivalent controls, user-agent controls and essential cases [S59].
- Apply: icon buttons, pagination, close buttons and chips get at least a 24 px hit area (padding counts), more on touch (LAW-FITTS); prefer real size over the spacing exception.
- Check: measure the smallest interactive elements at 390 in devtools.
### A11Y-3.3.1, A11Y-3.3.2, A11Y-3.3.3: Labels, error identification, error suggestion, Levels A, A, AA (R19)
- Says: inputs have labels or instructions (3.3.2); a detected error identifies the item and describes the problem in text (3.3.1); a known correction is suggested unless that harms security or purpose (3.3.3) [S61].
- Apply: visible labels outside the field, format hints before input, error text next to the field naming the fix, and on submit move focus to the first error or to a linked summary (CON-ERROR).
- Check: submit the form empty and with bad formats: every error names the field and the fix in text, not only in red.
### A11Y-3.3.7, A11Y-3.3.8: Redundant entry and accessible authentication, Levels A and AA, new in 2.2
- Says: do not make people re-enter what they already gave in the same process, and do not demand a cognitive test such as recalling a password or solving a puzzle to log in unless there is an alternative or a helper such as password managers and paste [S61].
- Apply: prefill or offer to reuse earlier answers (shipping same as billing), allow paste and autocomplete on credential and code fields, and offer passkeys or email links where the product can.
- Check: credential fields allow paste and carry autocomplete attributes, and no multi-step flow asks the same question twice.

## 8. Content and microcopy

Copy is interface. Write from the brief's real content (R6, R9). AI writing tells: `core-design/unslop/references/ai-slop-atlas.md`; rewriting unclear UI text: `core-design/impeccable/reference/clarify.md`.

### CON-CONCISE, KRUG-OMIT: Concise, scannable, objective (R1, R9)
- Says: in Morkes and Nielsen's 1997 study, concise text scored 58% higher in measured usability, scannable text 47%, objective text (no promotional language) 27%, and all three combined 124% [S62]; Krug: omit needless words, and when users miss something the fix is often to take something away rather than add an explanation [S19].
- Apply: cut words, lead with the point, use lists and subheads, and replace hype with specifics (numbers, names, nouns); NN/g's finding that fancy formatting and fancy words look like promotion and get ignored is the case against filler badges and buzzwords [S26].
- Check: lint.mjs flags the buzzword list and em dashes; delete any sentence nobody would miss.
### CON-HEADLINE: Specific headlines (R9, R16)
- Says: headings are what scanners read (SCAN-LAYER) and the first impression forms within about 50 ms (EMP-50MS), so the headline must carry what the product does and for whom [S13][S68].
- Apply: a concrete noun and verb in the user's words (NIE-02), no statement-then-negation, none of R9's banned words, real and messy numbers, and unverified figures labeled as sample data.
- Check: could a competitor use the headline unchanged? If yes, rewrite it.
### CON-LINKS, CON-ACTION: Links and buttons say where they go and what they do (R10)
- Says: "Learn more" says little about the destination and repeats ambiguously for screen readers; NN/g's four Ss ask for link labels that are specific, sincere, substantial and succinct, with keywords first [S63].
- Apply: buttons are a verb plus an object ("Export report", "Start free trial"), links name their destination, one label per intent across the site (R10), and the primary label matches the brief's job.
- Check: list every link and button label out of context, as a screen reader's link list would show them: each is unique and makes sense alone.
### CON-PLAIN: Plain words, the user's words (R9)
- Says: speak the users' language with familiar words and concepts (NIE-02) [S15]; NN/g argues that plain language is for everyone, experts included [S62].
- Apply: the common word, short sentences, active voice; define a necessary term once at first use; no internal jargon or category cliches.
- Check: read the copy aloud as the brief's user would hear it: no word needs explaining that a simpler word could replace.
### CON-ERROR: Error messages (R19)
- Says: NN/g groups error-message guidelines under visibility (next to the cause, high contrast, never color or animation alone), communication (plain language, the precise problem, a constructive fix) and efficiency; inline field errors beat a summary used alone [S66].
- Apply: write what happened plus how to fix it next to the field ("Card number has 15 digits; it needs 16"), keep the user's input, validate on blur or submit rather than on every keystroke, and pair red with an icon and text.
- Check: trigger each error: the message sits by the field, names the fix, survives grayscale, and the input is still there.
### CON-IMAGERY: Real product, real people (R6)
- Says: NN/g found users ignore decorative and generic stock images but look at images that carry information, such as real products and real people [S65]; text over images needs a darkening treatment that works for the worst-case image [S67].
- Apply: show the actual product (screenshots, live components, photos of the physical thing), never a fake dashboard of styled divs; with no asset, leave a labeled placeholder and list what is needed (R6); put text on a floor fade or a darkened region.
- Check: every image carries information about this product or is a labeled placeholder, and text over images measures 4.5:1.
### CON-LABELS: Label only what needs it, and outside the field (R2)
- Says: Refactoring UI treats labels as a last resort when the value already explains itself [S33]; NN/g found placeholder text used as a label hurts memory, error checking and accessibility, so labels and hints belong outside the field [S64].
- Apply: drop labels the content makes obvious (R2), but every form field keeps a visible label; a placeholder, if any, shows an example format, never the label.
- Check: no placeholder repeats its label, no eyebrow repeats its heading, and every input has a visible label.

## 9. First impressions and aesthetics research

The first viewport is judged before anyone reads, and "distinctive" must not mean "unfamiliar". Only verified studies are listed.

### EMP-50MS: Appeal is judged in about 50 ms (R7, R13)
- Says: Lindgaard et al. (2006) found that visual-appeal ratings after 50 ms of exposure agreed with ratings after longer viewing, and argued that this first impression carries over to later judgments [S68].
- Apply: the first viewport must work as a blurred image: one focal element, clear figure-ground, low clutter; copy and detail are judged later.
- Check: the 5-second and squint tests (rubric.md) on the 1440 and 390 first viewports.
### EMP-BEAUTY, LAW-AESTHETIC: Beautiful is perceived as usable
- Says: Kurosu and Kashimura (1995) found apparent usability tracked aesthetics more than inherent usability, and Tractinsky et al. (2000) found perceived aesthetics and perceived usability correlated before and after using an ATM simulation [S70][S69]; NN/g adds that attractiveness makes people forgive minor problems, not major ones, and can hide problems in testing [S71].
- Apply: polish earns trust, so it is part of the job; it never replaces function, and critique tests the task separately from the look.
- Check: the critic scores interaction and states (rubric D7) independently of appeal, so a beautiful broken flow still fails.
### EMP-PROTO: Low complexity and high prototypicality win first impressions
- Says: Tuch et al. (2012) found visual complexity and prototypicality (how representative a site looks for its category) both affect first impressions within 17-50 ms, complexity first; sites low in complexity and high in prototypicality were rated most appealing, and unfamiliar sites looked worse even when simple [S72].
- Apply: keep the page's structure recognizable for its category (where nav, hero, pricing and forms sit) and its visual complexity low, and put distinctiveness in identity, not structure (DIS-SPLIT).
- Check: from the blurred first viewport a viewer can name the kind of site (shop, docs, tool, publication).
### EMP-CULTURE: Preferences vary by audience
- Says: Reinecke and Gajos (2014), with about 2.4 million ratings from nearly 40,000 participants, found that preferred colorfulness and complexity vary with age, gender, education and country; higher education correlated with preferring less colorful, less complex sites [S73].
- Apply: derive density and colorfulness from the brief's real audience and locale, not from a universal "clean" default; dense is right for an audience that expects it.
- Check: the brief names the audience, and the critique judges density against that audience, not against the critic's taste.
### EMP-MAYA: Most advanced, yet acceptable
- Says: Hekkert et al. (2003) found typicality and novelty jointly predict aesthetic preference for designed products while suppressing each other: people prefer novelty as long as it does not undermine typicality [S74].
- Apply: make one or two strong novel moves on a typical base instead of novelty everywhere.
- Check: you can name each deliberately unusual move and the voice word it serves, and everything else is familiar.

## 10. Distinctive vs conventional (when to break patterns)

The tension: slop is generic identity, yet novelty in interaction costs users time and trust. Resolve it by layer. Second-order slop (the anti-default recipe): `core-design/unslop/references/ai-slop-atlas.md`.

### DIS-SPLIT: Distinctive identity, conventional interaction (R6, R9, R11)
- Says: familiar structure helps first impressions and use (EMP-PROTO, LAW-JAKOB), owned identity makes a product recognizable (DIS-ASSETS), and the two combine best as a typical base with a few novel moves (EMP-MAYA).
- Apply: be specific in the identity layer (typeface, color, imagery, illustration, voice, one signature element) and conventional in the interaction layer (nav placement, link and button styling, forms, controls, scrolling, checkout, errors).
- Check: list each unconventional choice: identity-layer choices pass, and interaction-layer ones need a DIS-BREAK rationale.
### DIS-LEARN, DIS-FRESH: Change carries a learning cost
- Says: task time falls with practice along a power curve and then plateaus, so a new pattern competes with practiced ones and must be clearly better; NN/g advises evolving a familiar design gradually and reserving radical redesign for products with few users or a design patched into incoherence [S75][S76].
- Apply: in redesigns, keep what users learned (positions, names, flows), change identity first, and ship new interaction patterns only with evidence.
- Check: compare the old and new screenshots: every moved or renamed control has a stated reason.
### DIS-ASSETS: Distinctiveness means owned, recognizable cues
- Says: Romaniuk defines distinctive brand assets as non-name cues that trigger the brand for category buyers, judged on fame (how many link the cue to the brand) and uniqueness (how few link it to competitors) [S77].
- Apply: choose identity elements a competitor could not use without looking like you, and repeat them consistently so they can become known; drop cues the whole category shares.
- Check: swap test (rubric.md): with a competitor's logo, would the page still look right? If yes, distinctiveness is missing.
### DIS-CATEGORY: Category cues in structure, not in identity (R11)
- Says: category conventions aid recognition (EMP-PROTO), but a palette or typeface you could guess from the industry alone is a shared category cue, not an owned one (DIS-ASSETS).
- Apply: take the accent and type from the brand's own world in the brief (materials, place, product, history) rather than the industry default (for example navy for finance, teal for health, a purple gradient for AI), and keep the structural cues the category expects.
- Check: category test (rubric.md): if the palette and layout are guessable from the industry alone, rework them.
### DIS-BREAK: When breaking a pattern is justified
- Says: deviation pays only when the convention fails the brief's job and the replacement is clearly better (DIS-LEARN, NIE-04).
- Apply: break a pattern only if all of these hold: the convention fails this job in a way you can name; the new pattern keeps strong signifiers (NOR-SIGNIFIER) and full accessibility; it is used consistently; it is tested or cheap to reverse. Never break one just to look different, which is the anti-default trap.
- Check: each broken pattern has a one-line rationale in the critique or the decisions file; without one, revert to the convention.

## Sources

Entries marked (headline) were verified only at the level of the article's published headline, and the claim made from them goes no further than that headline.

- [S1] Grow with Google, Google UX Design Certificate (course list), https://grow.google/certificates/ux-design/
- [S2] Interaction Design Foundation, courses and learning paths, https://www.interaction-design.org/courses and https://public-media.interaction-design.org/pdf/IDF-Course-Learning-Paths.pdf
- [S3] Nielsen Norman Group, UX Certification Specialties, https://www.nngroup.com/ux-certification/specialties/
- [S4] Nielsen, J., "Why You Only Need to Test with 5 Users", NN/g, https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/
- [S5] NN/g, "Visual Hierarchy in UX: Definition", https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- [S6] NN/g, "5 Principles of Visual Design in UX", https://www.nngroup.com/articles/principles-visual-design/
- [S7] NN/g Gestalt articles: https://www.nngroup.com/articles/gestalt-proximity/ , https://www.nngroup.com/articles/gestalt-similarity/ , https://www.nngroup.com/articles/principle-closure/ , https://www.nngroup.com/articles/common-region/
- [S8] NN/g, "Visual Design: Glossary", https://www.nngroup.com/articles/visual-design-cheat-sheet/ , and "Figure/Ground", https://www.nngroup.com/videos/figure-ground-gestalt/
- [S9] Yablonski, J., Laws of UX, https://lawsofux.com/ (pages: /fittss-law/, /hicks-law/, /jakobs-law/, /millers-law/, /doherty-threshold/, /peak-end-rule/, /serial-position-effect/, /von-restorff-effect/, /aesthetic-usability-effect/, /zeigarnik-effect/, /postels-law/, /occams-razor/, /law-of-common-region/, /law-of-uniform-connectedness/, /articles/2024/teslers-law/)
- [S10] Healey, C. G., "Perception in Visualization", https://www.csc2.ncsu.edu/faculty/healey/PP/
- [S11] Treisman, A. and Gelade, G. (1980). A feature-integration theory of attention. Cognitive Psychology, 12(1), 97-136.
- [S12] NN/g, "F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant", https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- [S13] NN/g, "Text Scanning Patterns: Eyetracking Evidence", https://www.nngroup.com/articles/text-scanning-patterns-eyetracking/ , and "The Layer-Cake Pattern of Scanning Content on the Web", https://www.nngroup.com/articles/layer-cake-pattern-scanning/
- [S14] Apple: HIG "Design principles", https://developer.apple.com/design/human-interface-guidelines/design-principles.md ; "UI Design Dos and Don'ts", https://developer.apple.com/design/tips/ ; WWDC17 "Essential Design Principles", https://developer.apple.com/videos/play/wwdc2017/802/ ; WWDC25 "Get to know the new design system", https://developer.apple.com/videos/play/wwdc2025/356/ ; WWDC26 "Principles of great design", https://developer.apple.com/videos/play/wwdc2026/250/
- [S15] Nielsen, J., "10 Usability Heuristics for User Interface Design", NN/g, https://www.nngroup.com/articles/ten-usability-heuristics/
- [S16] Shneiderman, B., "The Eight Golden Rules of Interface Design", https://www.cs.umd.edu/users/ben/goldenrules.html ; Shneiderman, B. et al. (2016). Designing the User Interface (6th ed.). Pearson.
- [S17] Norman, D. A. (2013). The Design of Everyday Things: Revised and Expanded Edition. Basic Books. https://jnd.org/books/the-design-of-everyday-things-revised-and-expanded-edition/
- [S18] Norman, D. A. (2008). "Signifiers, not affordances", https://jnd.org/signifiers-not-affordances/ ; "Affordance, Conventions and Design (Part 2)", https://jnd.org/affordance-conventions-and-design-part-2/
- [S19] Krug, S. (2014). Don't Make Me Think, Revisited (3rd ed.). New Riders. Contents: https://sensible.com/downloads/DMMT-Revisited-TableOfContents.pdf
- [S20] Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. Journal of Experimental Psychology, 47(6), 381-391.
- [S21] Hick, W. E. (1952). On the rate of gain of information. Quarterly Journal of Experimental Psychology, 4(1), 11-26.
- [S22] Miller, G. A. (1956). The magical number seven, plus or minus two: Some limits on our capacity for processing information. Psychological Review, 63(2), 81-97.
- [S23] Nielsen, J., "End of Web Design" (Jakob's law), NN/g, https://www.nngroup.com/articles/end-of-web-design/
- [S24] Kahneman, D., Fredrickson, B. L., Schreiber, C. A. and Redelmeier, D. A. (1993). When more pain is preferred to less: Adding a better end. Psychological Science, 4(6), 401-405.
- [S25] NN/g, "Flat-Design Best Practices", https://www.nngroup.com/articles/flat-design-best-practices/ , and "Long-Term Exposure to Flat Design", https://www.nngroup.com/articles/flat-design-long-exposure/
- [S26] NN/g, "Banner Blindness Revisited: Users Dodge Ads on Mobile and Desktop", https://www.nngroup.com/articles/banner-blindness-old-and-new-findings/ ; (headline) "Fancy Formatting, Fancy Words = Looks Like a Promotion = Ignored", https://www.nngroup.com/articles/fancy-formatting-looks-like-an-ad/
- [S27] Bringhurst, R. (2012). The Elements of Typographic Style (4th ed., version 4.0). Hartley & Marks. Section 2.1.2 online: https://webtypography.net/2.1.2
- [S28] Butterick, M., Practical Typography: https://practicaltypography.com/summary-of-key-rules.html , /line-length.html , /line-spacing.html , /point-size.html , /typography-in-ten-minutes.html
- [S29] Brown, T. (2011). "More Meaningful Typography", A List Apart, https://alistapart.com/article/more-meaningful-typography/ ; Modular Scale, https://www.modularscale.com/
- [S30] Utopia, https://utopia.fyi/ ; "Clamp", https://utopia.fyi/blog/clamp/ ; type scale calculator, https://utopia.fyi/type/calculator/
- [S31] MDN, "text-wrap", https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap ; Chrome for Developers, "CSS text-wrap: pretty", https://developer.chrome.com/blog/css-text-wrap-pretty
- [S32] Pickering, H. and Bell, A., Every Layout: https://every-layout.dev/layouts/ , https://every-layout.dev/rudiments/axioms/ , https://every-layout.dev/rudiments/units/ , https://every-layout.dev/rudiments/modular-scale/
- [S33] Wathan, A. and Schoger, S. (2018). Refactoring UI. Self-published. https://refactoringui.com/ ; previews https://refactoringui.com/previews/building-your-color-palette and https://refactoringui.com/previews/labels-are-a-last-resort
- [S34] Refactoring UI, "7 Practical Tips for Cheating at Design", https://medium.com/refactoring-ui/7-practical-tips-for-cheating-at-design-40c736799886
- [S35] Kennedy, E., "7 Rules for Creating Gorgeous UI", parts 1 and 2, https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-1.html , https://www.learnui.design/blog/7-rules-for-creating-gorgeous-ui-part-2.html
- [S36] Itten, J. (1961). The Art of Color. Reinhold; condensed as The Elements of Color (1970). Van Nostrand Reinhold.
- [S37] Albers, J. (1963). Interaction of Color. Yale University Press. Josef and Anni Albers Foundation, https://www.albersfoundation.org/alberses/teaching/interaction-of-color
- [S38] Kennedy, E., "Why Color Theory Sucks (& what framework to use instead)", https://www.learnui.design/blog/color-in-ui-design-a-practical-framework.html ; "The HSB Color System: A Practitioner's Primer", https://www.learnui.design/blog/the-hsb-color-system-practicioners-primer.html
- [S39] Evil Martians, "OKLCH in CSS: why we moved from RGB and HSL", https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- [S40] Ottosson, B. (2020). "A perceptual color space for image processing" (Oklab), https://bottosson.github.io/posts/oklab/
- [S41] W3C, WCAG 3.0 Working Draft, https://www.w3.org/TR/wcag-3.0/ ; "Text contrast sufficient (minimum)" draft support material, https://www.w3.org/WAI/WCAG3/informative/text-and-wording/text-appearance/text-contrast-sufficient-minimum/ ; w3c/wcag issue 2099 on APCA and WCAG 2.x, https://github.com/w3c/wcag/issues/2099
- [S42] Müller-Brockmann, J. (1981). Grid Systems in Graphic Design. Niggli.
- [S43] NN/g (headline), "Zigzag Image-Text Layouts Make Scanning Less Efficient", https://www.nngroup.com/articles/zigzag-page-layout/ ; (headline) "Horizontal Attention Leans Left", https://www.nngroup.com/articles/horizontal-attention-leans-left/
- [S44] Nielsen, J., "Response Times: The 3 Important Limits", NN/g, https://www.nngroup.com/articles/response-times-3-important-limits/
- [S45] NN/g, "Progress Indicators Make a Slow System Less Insufferable", https://www.nngroup.com/articles/progress-indicators/ , and "Skeleton Screens 101", https://www.nngroup.com/articles/skeleton-screens/
- [S46] Kaplan, K., "Designing Empty States in Complex Applications: 3 Guidelines", NN/g, https://www.nngroup.com/articles/empty-state-interface-design/
- [S47] Material Design 3, "States: state layers", https://m3.material.io/foundations/interaction/states/state-layers
- [S48] Material Design 3, "Easing and duration: tokens and specs", https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
- [S49] NN/g, "Executing UX Animations: Duration and Motion Characteristics", https://www.nngroup.com/articles/animation-duration/
- [S50] NN/g, "The Role of Animation and Motion in UX", https://www.nngroup.com/articles/animation-purpose-ux/
- [S51] NN/g (headline), "Scroll-Triggered Text Animations Delay Users", https://www.nngroup.com/articles/scroll-animations/ ; (headline) "Auto-Forwarding Carousels, Accordions Annoy Users & Reduce Visibility", https://www.nngroup.com/articles/auto-forwarding/
- [S52] W3C, Web Content Accessibility Guidelines (WCAG) 2.2, https://www.w3.org/TR/WCAG22/ ; WCAG 2 Overview, https://www.w3.org/WAI/standards-guidelines/wcag/
- [S53] W3C, Understanding 1.4.3 Contrast (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- [S54] W3C, Understanding 1.4.11 Non-text Contrast, https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html ; technique C40, https://www.w3.org/WAI/WCAG22/Techniques/css/C40.html
- [S55] W3C, Understanding 1.4.12 Text Spacing, https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- [S56] W3C, Understanding 1.4.10 Reflow, https://www.w3.org/WAI/WCAG21/Understanding/reflow.html
- [S57] W3C, Understanding 2.4.7 Focus Visible, https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html ; Understanding 2.4.13 Focus Appearance, https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- [S58] W3C, Understanding 2.4.11 Focus Not Obscured (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html ; failure F110, https://www.w3.org/WAI/WCAG22/Techniques/failures/F110
- [S59] W3C, Understanding 2.5.8 Target Size (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- [S60] W3C, Understanding 2.3.3 Animation from Interactions, https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- [S61] W3C, Understanding 3.3.1 Error Identification, https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html ; Understanding 3.3.2 Labels or Instructions, https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html ; How to Meet WCAG (Quick Reference) for 3.3.3, 3.3.7 and 3.3.8, https://www.w3.org/WAI/WCAG22/quickref/
- [S62] Morkes, J. and Nielsen, J. (1997). "Concise, SCANNABLE, and Objective: How to Write for the Web", NN/g, https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/ ; (headline) "Plain Language Is for Everyone, Even Experts", https://www.nngroup.com/articles/plain-language-experts/
- [S63] Sherwin, K., "'Learn More' Links: You Can Do Better", NN/g, https://www.nngroup.com/articles/learn-more-links/ ; "Better Link Labels: 4Ss for Encouraging Clicks", https://www.nngroup.com/articles/better-link-labels/
- [S64] NN/g, "Placeholders in Form Fields Are Harmful", https://www.nngroup.com/articles/form-design-placeholders/
- [S65] NN/g, "Photos as Web Content", https://www.nngroup.com/articles/photos-as-web-content/
- [S66] NN/g, "Error-Message Guidelines", https://www.nngroup.com/articles/error-message-guidelines/ ; "10 Design Guidelines for Reporting Errors in Forms", https://www.nngroup.com/articles/errors-forms-design-guidelines/
- [S67] NN/g, "Ensure High Contrast for Text Over Images", https://www.nngroup.com/articles/text-over-images/
- [S68] Lindgaard, G., Fernandes, G., Dudek, C. and Brown, J. (2006). Attention web designers: You have 50 milliseconds to make a good first impression! Behaviour & Information Technology, 25(2), 115-126.
- [S69] Tractinsky, N., Katz, A. S. and Ikar, D. (2000). What is beautiful is usable. Interacting with Computers, 13(2), 127-145.
- [S70] Kurosu, M. and Kashimura, K. (1995). Apparent usability vs. inherent usability: Experimental analysis on the determinants of the apparent usability. CHI '95 Conference Companion, 292-293. https://chi1995.chistatic.hosting.acm.org/proceedings/shortppr/mk_bdy.htm
- [S71] NN/g, "The Aesthetic-Usability Effect", https://www.nngroup.com/articles/aesthetic-usability-effect/
- [S72] Tuch, A. N., Presslaber, E. E., Stöcklin, M., Opwis, K. and Bargas-Avila, J. A. (2012). The role of visual complexity and prototypicality regarding first impression of websites: Working towards understanding aesthetic judgments. International Journal of Human-Computer Studies, 70(11), 794-811. Plain-language summary: Google Research blog, "Users love simple and familiar designs: why websites need to make a great first impression", https://research.google/blog/users-love-simple-and-familiar-designs-why-websites-need-to-make-a-great-first-impression/
- [S73] Reinecke, K. and Gajos, K. Z. (2014). Quantifying visual preferences around the world. Proceedings of CHI 2014, 11-20. https://eecs.harvard.edu/~kgajos/papers/2014/reinecke14visual.shtml
- [S74] Hekkert, P., Snelders, D. and van Wieringen, P. C. W. (2003). "Most advanced, yet acceptable": Typicality and novelty as joint predictors of aesthetic preference in industrial design. British Journal of Psychology, 94(1), 111-124.
- [S75] Budiu, R., "The Power Law of Learning: Consistency vs. Innovation in User Interfaces", NN/g, https://www.nngroup.com/articles/power-law-learning/
- [S76] Nielsen, J., "Fresh vs. Familiar: How Aggressively to Redesign", NN/g, https://www.nngroup.com/articles/fresh-vs-familiar-aggressive-redesign/
- [S77] Romaniuk, J. (2018). Building Distinctive Brand Assets. Oxford University Press.
