# AI slop atlas

The diagnosis behind the unslop studio: why models converge on one interface, the habits that convergence produces, a fix for each habit that comes from the brief instead of from a replacement default, and the traps that anti-slop advice sets on its own. Read by the art director (Phase 2), the copywriter, and the design critic (Phase 6).

## Contents
- How to use this file
- Root causes: why models converge (RC1-RC11)
- Habits: visual (SLOP-V)
- Habits: typography (SLOP-T)
- Habits: color (SLOP-C)
- Habits: layout and section order (SLOP-L)
- Habits: components (SLOP-K)
- Habits: imagery (SLOP-I)
- Habits: copy (SLOP-W)
- Habits: data and placeholders (SLOP-D)
- Habits: interaction and motion (SLOP-M)
- Habits: process (SLOP-P)
- Master table: why, fix, principle, detection, rule
- Second-order slop (SLOP-S)
- AI writing tells in UI copy
- How the studio prevents each root cause
- Sources

## How to use this file

- **Art director:** read the root causes and "Second-order slop", then run the look test at the end of that section on each of your three directions.
- **Copywriter:** read "Habits: copy", "Habits: data and placeholders" and "AI writing tells in UI copy".
- **Design critic:** name each finding by habit ID plus rule (`SLOP-L03, rule 7`). Where the rule column says "new", no unslop rule covers the habit yet, so cite the ID alone.
- A habit is a finding only when nothing asked for it. Each entry says when the move is legitimate ("Keep when"). If you keep a flagged move, write the brief or direction line that justifies it in `.unslop/decisions.md`.
- Fix the root cause, not only the symptom. Swapping each flagged default for the next item on a list is how second-order slop starts (SLOP-P05).
- Detection shorthand: `lint` means `core-design/unslop/scripts/lint.mjs` flags it today; `grep` gives a search to run on the source; `look` means it only shows in screenshots from `core-design/unslop/scripts/shoot.mjs`; `contrast` means `core-design/unslop/scripts/contrast.mjs`.
- IDs are stable. Add new habits at the end of their category and never renumber, because critiques and the history log refer to them.

## Root causes: why models converge

### RC1 Distributional convergence
A model predicts each token from the statistics of its training data, and safe choices that work everywhere and offend no one dominate web data. Anthropic's Applied AI team names the result distributional convergence: "Without direction, Claude samples from this high-probability center", which means Inter, purple gradients on white and minimal animation [S1]. Steering alone does not end it: Anthropic's published prompt reminds the model that it will "still tend to converge on common choices (Space Grotesk, for example)" across generations [S1]. People reward the center too: sites low in visual complexity and high in prototypicality are rated most appealing, and both factors already shape judgments at exposures of 17 to 50 ms [S2]. So keep conventions where users rely on them (navigation, forms, controls), and stop the typical answer from also deciding identity (type, color, imagery, voice).

### RC2 Typicality bias and preference tuning
Tuning on human preferences narrows the range further. RLHF significantly reduced output diversity compared with supervised fine-tuning across several measures, and on some metrics made outputs similar regardless of input [S3]. Essays co-written with a feedback-tuned model (InstructGPT) were more homogeneous while the base model left diversity intact, and the loss came from the model's contributions [S4]. Zhang et al. trace mode collapse to typicality bias in preference data: raters favor familiar text, so even a perfect reward model and optimizer would pull toward the typical [S5]. The design consequence: asked for "something different", a model returns the most typical different thing. Get randomness from outside the model (`core-design/unslop/scripts/roll.mjs`), or ask for several candidates with their probabilities and choose a less likely one that still fits the brief; that prompt raised creative-writing diversity 1.6-2.1x over direct prompting [S5].

### RC3 Over-represented sources
A handful of sources were copied into millions of repositories and pages: Tailwind UI, shadcn/ui and the 2020-2024 SaaS landing template. Adam Wathan, creator of Tailwind CSS: "I'd like to formally apologize for making every button in Tailwind UI `bg-indigo-500` five years ago, leading to every AI generated UI on earth also being indigo" [S6]. NN/g's test of AI prototyping tools attributes their homogeneity to common patterns in training data and default reliance on component libraries such as shadcn and frameworks such as Tailwind [S7]. This repo's own audit names the same fingerprints: the purple-blue gradient is "the most common AI design fingerprint" and three equal card columns "the most generic AI layout" (`_archive/retired/redesign-existing-projects/SKILL.md`).

### RC4 Framework default tokens
Starters ship decisions as defaults. The `create-next-app` Tailwind template imports Geist and Geist Mono [S8]; the shadcn/ui installation docs show a `components.json` with `"iconLibrary": "lucide"` and `"baseColor": "neutral"` [S9]; Tailwind puts slate text and `rounded-xl` cards one class away. Whatever is not overridden ships identical to every other starter built on the same kit. Rule 5 covers it: work in a system, never in its default state.

### RC5 Vague briefs
"Modern and clean" rules nothing out. NN/g found that general prompts leave tools room to make assumptions and fill the gaps, while detailed prompts produced output much closer to a human design [S7], and that a vague vibe-coding prompt produced a layout that was functional but generic, the AI's own defaults under minimal specification [S10]. The cure is a brief specific enough that two designers reading it would reject the same bad ideas (`core-design/unslop/agents/ux-strategist.md`).

### RC6 No real content or assets
Without facts, the model generates things shaped like content: Acme, Jane Doe, 99.9%, three features with icons, a dashboard drawn in divs, a headline over a gradient. Anthropic's current frontend skill tells the model to "Build with the brief's real content and subject matter throughout" [S11]. Layouts sized for imagined text also break when the real text arrives, so the fix is ordering: real copy and assets, or labeled gaps, before layout.

### RC7 Template momentum
Generation is sequential and these sections co-occur in training data, so each default makes the next one likelier: a centered hero brings a badge above and two buttons below, then a logo strip, three feature cards, a 1-2-3 "how it works", testimonials, three pricing tiers, an FAQ and a gradient CTA band. No single section is wrong; the sequence is the tell. This is an observation from practice, not a measured result. Decide the section list from the job before writing markup, and run the inverse test in `core-design/impeccable/reference/brand.md`: describe the page the way a competitor would describe theirs, and restart if it fits the modal landing page of the category.

### RC8 No visual feedback loop
The model writes code it never sees. UICoder's authors report that LLMs struggle to consistently generate UI code that compiles and produces visually relevant designs, and they fix it with automated compiler and vision-model feedback [S12]. In WebGen-Agent, a vision-language model reviewed screenshots and returned improvement suggestions; Claude 3.5 Sonnet's appearance score on WebGen-Bench rose from 3.0 to 3.9, and screenshot feedback was the component that most improved appearance [S13]. Anthropic's skill asks for the same loop: critique your work "taking screenshots to review if your environment supports it" [S11].

### RC9 Self-grading leniency
Builders see what they meant, not what they made. In Anthropic's long-running harness experiments, "agents reliably skew positive when grading their own work", while a standalone evaluator tuned to be skeptical proved "far more tractable" [S14]. That evaluator drove the live page with Playwright, took screenshots, scored design quality, originality, craft and functionality, and its criteria explicitly penalized generic AI slop patterns, naming purple gradients over white cards as a fail [S14].

### RC10 Shared models and the training loop
Homogenization is a population effect. Writers given GPT-4 story ideas wrote stories rated more creative one by one but more similar to each other, which the authors call a social dilemma [S15]; ChatGPT users produced less semantically distinct ideas than users of another creativity tool, because the model offered different people similar suggestions [S16]. SaaStr argued that most prosumer vibe-coding tools ran on the same model and inherited its design habits, so their sites looked alike [S17]. Then the loop closes: models trained on generated data lose the tails of the original distribution [S18], and today's generated sites become tomorrow's training data. Each project has to move away from the center on purpose, and away from the studio's own recent work (`core-design/unslop/scripts/log.mjs`).

### RC11 Second-order slop
Bans create substitutes, and substitutes converge. Steering away from Inter produced a new favorite face [S1]. A single rubric phrase, "the best designs are museum quality", pushed Anthropic's generator "toward a particular visual convergence" [S14]. Anthropic's own skill now lists yesterday's escapes among the clusters to avoid [S11]. See "Second-order slop" below.

## Habits: visual

### SLOP-V01 AI gradient wash
Purple, indigo or blue-to-violet gradients on hero backgrounds, buttons and CTA bands, often on white [S1]. Keep when: the brand's own palette lives in that range and the gradient means something (a range, a progression).

### SLOP-V02 Gradient text
`background-clip: text` on a headline word to make it pop. Keep when: almost never; emphasis comes from size, weight or the one accent.

### SLOP-V03 Blobs, glow and page-wide grain
Blurred color orbs, mesh gradients, neon outer glows, noise over everything to fake depth or warmth. Keep when: texture belongs to the brand's physical world and sits on the image, not on the whole UI.

### SLOP-V04 Glass by default
Frosted cards and nav over a plain or gradient background where nothing sits behind the glass. Keep when: real content scrolls under a persistent layer and text contrast still passes.

### SLOP-V05 Decorative chrome
Crosshair hairlines, corner ticks, dot grids, rotated side text, scroll cues, ornamental dividers: lines that organize nothing. Keep when: the line separates real groups, or the grid is the subject (a type specimen, a blueprint).

### SLOP-V06 The SaaS card kit
Every container with the same radius, the same faint shadow, the same 1px border, sometimes a colored left stripe [S11]. Keep when: elevation means something (draggable, modal, selected) and everything else groups by space.

### SLOP-V07 Radius without a rule
`rounded-2xl` on everything, pill buttons on square cards, inner corners equal to outer ones so the gap looks uneven. Keep when: any written radius scale, followed everywhere, with inner = outer minus padding.

## Habits: typography

### SLOP-T01 Reflex typeface
The font arrives before the brief: Inter or the system stack, the starter's font (Geist and Geist Mono in `create-next-app` [S8]), or the model's go-to "distinctive" face (Space Grotesk [S1]). The repo keeps a census of over-used families in `core-design/impeccable/reference/brand.md`; use it as a mirror, not a menu. Keep when: it is already the brand's face, or browsing for the voice words led there.

### SLOP-T02 Eyebrow on every section
Tiny uppercase tracked label over each heading ("FEATURES", "PRICING"), sometimes mono, sometimes in a pill; `core-design/impeccable/SKILL.md` reports it on 55-95% of generations regardless of brief. Keep when: once, as a named device in the direction.

### SLOP-T03 Random italic or serif word
One italic or serif word dropped into a sans headline for flavor. Keep when: the word is a title, a foreign term, or the real stress of the sentence.

### SLOP-T04 Mono as costume
Monospace nav, labels, captions and metadata to look technical on a brand that is not a developer tool. Keep when: code, keys, identifiers and aligned data in a product for developers.

### SLOP-T05 Flat or shouting scale
Steps about 1.1x apart so nothing leads, or a hero so big it wraps to four lines and hides the CTA. Keep when: never as a default; size the scale against the longest real headline.

### SLOP-T06 Bad wrapping and overflow
Single-word last lines, headings overflowing at 390 px, two-line button labels, body text over 90 characters wide. Keep when: never; check every width in the screenshots.

### SLOP-T07 Untuned text details
Proportional figures in prices and tables, Title Case On Every Heading, centered multi-line paragraphs, default tracking at display sizes. Keep when: the system specifies otherwise and applies it consistently.

## Habits: color

### SLOP-C01 Indigo default
Primary buttons and links in Tailwind indigo or violet, the color Wathan put on every Tailwind UI button [S6]. Keep when: the brand really is that hue and the palette is tuned around it as a token.

### SLOP-C02 Accent sprawl, or no accent
Several unrelated accents (a teal badge, an orange chart, a purple CTA), or an all-gray page where nothing leads. Keep when: one accent with written usage, plus semantic colors only for real states.

### SLOP-C03 Pale text on near-white
Light gray body, helper or placeholder text on a tinted off-white "for elegance". Keep when: never for text people must read; it fails 4.5:1.

### SLOP-C04 Raw framework neutrals
The starter's gray ramp used untouched, or warm and cool grays mixed on one page. Keep when: one gray family, tinted slightly toward the accent, defined as tokens.

### SLOP-C05 Category palette
Colors guessable from the industry: navy and gold finance, sage wellness, green eco, purple AI, beige and brass for anything handmade (`_archive/retired/design-taste-frontend/SKILL.md` 4.2). Keep when: the brief gives a reason beyond the category.

### SLOP-C06 Theme by reflex
Dark because tech "looks cool dark", light "to be safe", or one random dark band in a light page. Keep when: the scene sentence (who, where, what light) forces the choice (`core-design/impeccable/SKILL.md`, Color and theme).

## Habits: layout and section order

### SLOP-L01 Centered hero kit
Pill badge, centered two-line headline, gray subline, a primary and a ghost button, then a screenshot or a gradient [S19]. Keep when: the message is the design (a manifesto, an announcement) and the brief says so.

### SLOP-L02 The default page sequence
Hero, logo strip, three features, 1-2-3 steps, testimonials, three pricing tiers, FAQ, CTA band, four-column footer, whatever the page is for (RC7). Keep when: the IA, ranked by job, produces exactly those sections.

### SLOP-L03 Three equal cards
Icon, heading, two lines, times three, all the same size: identical tiles imply identical importance. Keep when: the items really are peers and each holds real content.

### SLOP-L04 Bento by default
An asymmetric tile grid as the feature section on every brief, with empty or decorative cells. Keep when: items differ in importance or size and every cell holds a real asset.

### SLOP-L05 Monotone rhythm
Every section centered at the same width and padding, or three or more image and text zigzags in a row. Keep when: a long reading page that wants one steady column.

### SLOP-L06 Boxes instead of space
Cards that only hold text, cards inside cards, a divider under every row. Keep when: the boundary marks a real object (selectable, draggable, separate).

### SLOP-L07 Fake structure
"01 / 02 / 03" on sections that are not a sequence, or a giant headline with a tiny explainer floating top right (`_archive/retired/design-taste-frontend/SKILL.md` 4.7 and 9.F). Keep when: the order is real, or the second column carries a visual.

## Habits: components

### SLOP-K01 Library default state
shadcn, Radix or MUI exactly as installed: stock radius, neutral base, Lucide icons [S9], stock focus ring. Keep when: as a starting point only.

### SLOP-K02 Filler badges and dots
"New", "Beta", "AI-powered", "v2.0", "Now in early access", colored dots before nav items or rows. Keep when: it states a real state or count the reader acts on, once.

### SLOP-K03 CTA confusion
A primary plus ghost pair everywhere, three labels for one intent ("Get started", "Start free", "Sign up"), vague verbs ("Learn more", "Submit"). Keep when: never; one label per intent, verb plus object.

### SLOP-K04 Icon soup
A rounded icon tile over every heading, mixed families and strokes, emoji as icons, literal metaphors (a rocket for launch, a shield for security). Keep when: one family, and the icon helps scanning.

### SLOP-K05 Stock modules
Testimonial carousel with dots, FAQ accordion, three-tower pricing, sun and moon toggle, picked because pages "have one". Keep when: the content calls for the module and the system styles it.

## Habits: imagery

### SLOP-I01 Productless hero
Headline over a gradient or blob where the product should be. Keep when: the product is not visual and the direction chose type as the hero, in writing.

### SLOP-I02 Div-built fake UI
Dashboards, terminals and charts drawn with styled divs and random bars, often with a fake version footer; `_archive/retired/design-taste-frontend/SKILL.md` 9.F calls it the top LLM design tell. Keep when: never; use a real screenshot, a live component, a generated image of the real thing, or a labeled slot.

### SLOP-I03 Category stock and generic AI art
A diverse team at a laptop, a handshake, glossy 3D shapes, isometric blobs: the category, not the brand's world. Keep when: the image shows the brand's own people, place or object (`core-design/impeccable/reference/brand.md`, Imagery).

### SLOP-I04 Decorated images
Pills and tags laid over photos, fake plate numbers and photo credits. Keep when: a real caption below the image, a real credit for a real photographer.

### SLOP-I05 Throwaway alt text
`alt="image"`, `alt="hero"`, or alt that repeats the caption. Keep when: never; say what the picture shows, in the brand's voice.

## Habits: copy

### SLOP-W01 Buzzword headline
Streamline, empower, supercharge, seamless, unleash, elevate, next-generation, all-in-one. Several are measured LLM excess words [S20]. Keep when: never in a headline; name what the product literally does.

### SLOP-W02 Negation cadence
"Not just X. Y.", "It's not X, it's Y", "No X. No Y. Just Z." [S21]. Keep when: once at most, to correct a misconception users really hold.

### SLOP-W03 Reflexive triads
"Fast. Simple. Secure.", three adjectives per sentence, three features because the grid has three slots [S21]. Keep when: there are exactly three real things.

### SLOP-W04 Swappable claims
A headline or section a competitor could ship unchanged ("Built for teams that move fast"). Keep when: never; it fails the swap test.

### SLOP-W05 Dash and punctuation tics
Em dashes in a punched-up sales rhythm [S21], dramatic ellipses, exclamation marks in success messages. Keep when: never; use commas, colons, parentheses and periods.

### SLOP-W06 Inflated or performative tone
"Redefining", "the future of", "a testament to", "crafted with care", "Quietly trusted by", "Field notes" on ordinary sections (`_archive/retired/design-taste-frontend/SKILL.md` 9.F). Keep when: the claim is literal and provable.

### SLOP-W07 Generic microcopy
"Oops! Something went wrong", "Submit", "Click here", "Success!", empty states that say "No data". Keep when: never; say what happened and what to do next.

### SLOP-W08 Redundant labels
An eyebrow repeating the heading, a placeholder repeating its label, a caption repeating the alt, a unit on every row of a labeled column. Keep when: the label adds something the reader lacks.

## Habits: data and placeholders

### SLOP-D01 Placeholder identities
Acme, Nexus, Jane Doe, John Smith, lorem ipsum, one avatar reused for every person. Keep when: clearly labeled SAMPLE content in a prototype the user knows is fake.

### SLOP-D02 Too-round or too-precise numbers
99.9% uptime, 10x faster, 50k+ users, 4.9 stars, invented specs with decimals. Keep when: the number comes from the content inventory with a source.

### SLOP-D03 Invented proof
Testimonials, ratings, press and customer logos that do not exist. The FTC rule bans fake testimonials, including AI-generated ones attributed to people who do not exist [S22]. Keep when: never; leave a MISSING slot.

### SLOP-D04 Hero-metric template
Big number, small label, a row of supporting stats, gradient accent (`core-design/impeccable/SKILL.md`, Absolute bans). Keep when: one real, sourced number is the story.

### SLOP-D05 Fake liveness
"Last sync 4s ago", version footers, live counters, a clock or city and weather strip on a page with no live data. Keep when: the data is live and the user needs it.

## Habits: interaction and motion

### SLOP-M01 One reveal for everything
Every section fades up on scroll with the same distance, duration and delay. Keep when: staggering items inside one list, or one orchestrated entrance the direction asks for.

### SLOP-M02 Endless loops
Marquees, pulsing dots, floating shapes, rotating gradients that never stop. Keep when: the loop is the content (live status) and it can be paused.

### SLOP-M03 Wrong physics
Bounce and elastic easing, `transition: all`, slow feedback, linear or ease-in-out curves for UI responses. Keep when: never for feedback; rule 20 gives the envelope.

### SLOP-M04 Happy path only
No loading, empty, error, disabled or focus states; a lone spinner where a skeleton belongs. Keep when: never on an async surface.

### SLOP-M05 Motion without a floor
No `prefers-reduced-motion` branch, or content invisible until a scroll animation fires (blank sections in headless screenshots). Keep when: never.

### SLOP-M06 Hover theatre
Cards that scale up, spotlight borders, magnetic buttons and custom cursors on things that do nothing different when clicked. Keep when: the hover previews the real result of the click.

## Habits: process

### SLOP-P01 Code before brief
Markup before the scene, job, voice words, reference and content exist, so every open axis gets the mode.

### SLOP-P02 First idea shipped
One direction, the first that came to mind; its "different" is the most typical different thing [S5].

### SLOP-P03 Never rendered
Judging from the code and never opening screenshots at 390, 820 and 1440.

### SLOP-P04 Self-graded
The builder declares the work good, the reliable positive skew of self-grading [S14].

### SLOP-P05 Ban-list patching
Replacing each flagged default with the next one on a list (Inter to the next grotesk, purple to beige) instead of going back to the brief.

### SLOP-P06 Repeating the last project
The same font pair, palette or layout families as recent work, so the studio's taste becomes its tell.

### SLOP-P07 Layout before copy
Sections sized for imagined text; the real copy breaks them later, or never arrives and placeholders ship.

## Master table: why, fix, principle, detection, rule

"Why" points to the root causes above. Principles map to sources: Nielsen heuristics [S23], Gestalt proximity and similarity [S24], Von Restorff isolation [S25], aesthetic-usability effect [S26], Fitts's law [S27], Hick's law [S28], Bringhurst [S29], WCAG 2.2 [S30], Strunk [S31], Orwell [S32], prototypicality and first impressions [S2]. Gestalt common region, Jakob's law, diverge-then-converge and content-first are common practice, stated without a source. Second-order looks (SLOP-S) live in their own section; their fix is always the look test there.

| ID | Habit | Why it happens | Fix (derived from the brief) | Principle | Detect | Rule |
|---|---|---|---|---|---|---|
| SLOP-V01 | AI gradient wash | RC1, RC3: the safe default of web data [S1] | Accent from the brand or an object in the brief; flat fills unless the direction names a gradient | Nielsen 8 aesthetic and minimalist design | grep `purple-`, `violet-`, `indigo-`, `linear-gradient`; look | 11, 13 |
| SLOP-V02 | Gradient text | RC1: a cheap signal of "designed" | Emphasis by size or weight in one family; the accent on one word only if it is the point | Von Restorff | lint (gradient text) | 13 |
| SLOP-V03 | Blobs, glow, page-wide grain | RC6: decoration fills space where content is missing | Fill the space with the product or the brand's real imagery | Nielsen 8 aesthetic and minimalist design | grep `blur-3xl`, `filter: blur`, `radial-gradient`, `feTurbulence`; look | 13 |
| SLOP-V04 | Glass by default | RC3, RC11: a saturated trend in the sources | Solid surfaces; glass only over real scrolling content | WCAG 2.2 1.4.3 contrast | grep `backdrop-filter`, `backdrop-blur` | 13, 15 |
| SLOP-V05 | Decorative chrome | RC11: the "editorial" anti-slop kit | Delete; keep a rule only where it separates real groups | Gestalt proximity | lint (scroll cue); look for lines that bound nothing | 13 |
| SLOP-V06 | SaaS card kit | RC3, RC4: component defaults [S11] | Group with space first; one elevation level that means something | Gestalt common region | lint (side stripe); grep one shadow class on every container | 8, 13 |
| SLOP-V07 | Radius without a rule | RC4: library radius tokens left as shipped | Write the radius scale; inner = outer minus padding | Aesthetic-usability effect | lint (more than 5 radii); look at nested corners | 14 |
| SLOP-T01 | Reflex typeface | RC1, RC4 [S1][S8] | Typographer browses for the voice words; discards a first thought that matches recent projects | Prototypicality vs identity [S2] | grep `font-family`, `next/font`; `log.mjs check --fonts` | new |
| SLOP-T02 | Eyebrow on every section | RC3, RC7: template grammar | Delete; the heading carries the section; at most one named kicker | Nielsen 8 aesthetic and minimalist design | lint (eyebrow, eyebrow count) | 2 |
| SLOP-T03 | Random italic or serif word | RC11: an "editorial" escape move | Weight or size in one family, on the word that is the point | Von Restorff | grep `<em>`, `<i>`, `italic` inside headings | 3 |
| SLOP-T04 | Mono as costume | RC3, RC11: the dev-tool look copied everywhere | Mono for code, keys and IDs; tabular figures for data | Nielsen 2 match with the real world | grep `font-mono`, `monospace` outside `code` and `kbd` | 4 |
| SLOP-T05 | Flat or shouting scale | RC1, RC6: default sizes, no real headline to size against | Size against the longest real headline; clear steps; CTA visible at load | Von Restorff; Bringhurst scale | look at 390 and 1440 | 7, 16 |
| SLOP-T06 | Bad wrapping and overflow | RC8: never seen at real widths | `text-wrap: balance` on headings, `pretty` on prose, 60-75ch measure | Bringhurst measure | lint (h1 text-wrap, 100vh); `shoot.mjs` overflow warnings | 16 |
| SLOP-T07 | Untuned text details | RC4: defaults left on | Tabular figures in data, sentence case, left-aligned prose, tracking per size | Bringhurst | lint (tabular nums); grep `text-center` on paragraphs | 18 |
| SLOP-C01 | Indigo default | RC3 [S6] | Accent from the brand or the brief's physical world, set as a token | Von Restorff | grep `indigo-`, `violet-`, `#6366f1`, `#4f46e5` | 11 |
| SLOP-C02 | Accent sprawl or none | RC1, RC5 | One accent for primary action, links and key emphasis; semantic colors for states only | Von Restorff; Gestalt similarity | count accent hues in tokens; look | 11 |
| SLOP-C03 | Pale text on near-white | RC1, RC11: gray "for elegance" | Move text toward ink; compute every pairing | WCAG 2.2 1.4.3 contrast | lint (light gray text); contrast `--css` | 15 |
| SLOP-C04 | Raw framework neutrals | RC4 [S9] | One gray family tinted toward the accent hue | Gestalt similarity | grep mixed `slate-`, `zinc-`, `gray-`, `stone-` | 5, 11 |
| SLOP-C05 | Category palette | RC1, RC2 | Keep functional conventions (danger is red); take the identity hue from the brand's world | Prototypicality vs identity [S2] | critic category test | 11 |
| SLOP-C06 | Theme by reflex | RC1, RC5 | The scene sentence decides light, dark or mid-tone; lock it for the page | Nielsen 4 consistency and standards | look at the full-page shot | new |
| SLOP-L01 | Centered hero kit | RC3, RC7 [S19] | Lead with what the job says the visitor must see first, sized to dominate | Von Restorff | look at 1440 and 390 | 6, 7 |
| SLOP-L02 | Default page sequence | RC7 | Sections come from the IA ranked by job; cut what serves none | Hick's law | compare the section list with brief.md | new |
| SLOP-L03 | Three equal cards | RC3 [S11] | Rank by importance: one dominant item, smaller supports, or a plain list | Von Restorff | grep `grid-cols-3` with repeated card markup; look | 7 |
| SLOP-L04 | Bento by default | RC11 | A grid only when sizes differ; cells equal content | Gestalt proximity | look for empty or decorative cells | 7 |
| SLOP-L05 | Monotone rhythm | RC4, RC7 | Vary width and density from the spacing scale; no layout family repeats | Gestalt proximity | look at the full-page 1440 shot | 8 |
| SLOP-L06 | Boxes instead of space | RC3 | Spacing ratios first; boundaries only for real objects | Gestalt proximity; Gestalt common region | grep nested card classes, `divide-y`; look | 8 |
| SLOP-L07 | Fake structure | RC11 | Number only real sequences; stack headline over body | Nielsen 2 match with the real world | grep `>01<`, `01 /`; look | 13 |
| SLOP-K01 | Library default state | RC4 [S7][S9] | Install, then theme from tokens: radius, color, type, focus ring | Nielsen 4 consistency and standards | grep `components.json`, unchanged radius token, `lucide-react` | 5 |
| SLOP-K02 | Filler badges and dots | RC1, RC6 | Delete unless it states a real state or count, once | Nielsen 8 aesthetic and minimalist design | lint (filler badge) | 1 |
| SLOP-K03 | CTA confusion | RC7 | One primary per view, one label per intent, verb plus object, biggest target | Fitts's law; Hick's law | grep button labels; count primaries per view | 10 |
| SLOP-K04 | Icon soup | RC1, RC3 | One family, one stroke, one size per role; delete icons that restate text | Gestalt similarity | lint (emoji); grep icon imports from more than one package | 12 |
| SLOP-K05 | Stock modules | RC7 | Pick each module from the content it must hold | Jakob's law (keep the conventions users rely on) | look; ask what content the module holds | new |
| SLOP-I01 | Productless hero | RC6 | Real screenshot, live component, generated image of the real thing, or a labeled slot | First impressions [S2] | look at the first viewport | 6 |
| SLOP-I02 | Div-built fake UI | RC1, RC6 | Same as I01, with the asset list sent to the user | Nielsen 2 match with the real world | grep dense absolutely positioned divs in the hero; look | 6 |
| SLOP-I03 | Category stock, generic AI art | RC1, RC5 | Brief each image from the brand's world: who, which object, where, what light | Nielsen 2 match with the real world | look; read alt text and file names | 6 |
| SLOP-I04 | Decorated images | RC11 | Let the image stand; real captions below it | Nielsen 8 aesthetic and minimalist design | grep positioned spans inside `figure` | 1, 13 |
| SLOP-I05 | Throwaway alt text | RC6 | Alt says what the image shows, in the brand's voice | WCAG 2.2 1.1.1 non-text content | grep `alt="image"`, `alt="hero"` | new |
| SLOP-W01 | Buzzword headline | RC2: excess style vocabulary [S20][S33] | Product noun, literal verb, audience, from content.md | Orwell plain words | lint (buzzword copy) | 9 |
| SLOP-W02 | Negation cadence | RC2 [S21] | State the positive claim directly | Strunk positive form | grep `Not just`, `not just`, `isn't just`, `It's not` | 9 |
| SLOP-W03 | Reflexive triads | RC2 [S21] | Say as many things as are true; prove one claim | Strunk omit needless words | look for three one-word sentences or adjective trios | new |
| SLOP-W04 | Swappable claims | RC1, RC5 | Rewrite until a stranger could say what you sell and for whom | Nielsen 2 match with the real world | critic swap test | 9 |
| SLOP-W05 | Dash and punctuation tics | RC2 [S21] | Commas, colons, parentheses, periods; calm success messages | Orwell plain words | lint (em dash); grep U+2013 and `!<` | new |
| SLOP-W06 | Inflated or performative tone | RC2, RC6 | Literal claims with proof; plain functional labels | Orwell plain words | grep `testament`, `redefin`, `future of`, `crafted`, `quietly` | 9 |
| SLOP-W07 | Generic microcopy | RC6 | Errors say what happened and how to fix it, near the field [S11]; actions are verb plus object | Nielsen 9 error recovery | grep `Oops`, `went wrong`, `>Submit<`, `Click here`, `No data` | 10, 19 |
| SLOP-W08 | Redundant labels | RC7 | Delete the label when the heading or context already says it | Nielsen 8 aesthetic and minimalist design | lint (eyebrow); look | 2 |
| SLOP-D01 | Placeholder identities | RC6 | Real names from the inventory, or SAMPLE labels | Nielsen 2 match with the real world | lint (placeholder names) | 9 |
| SLOP-D02 | Too-round or too-precise numbers | RC6 | Only sourced numbers; mark the rest SAMPLE | Source every claim | grep `99.9`, `10x`, `k+`, `4.9`; check content.md | 9 |
| SLOP-D03 | Invented proof | RC6 | Real quote with name and role, or a MISSING slot | FTC 16 CFR 465 [S22] | check every quote and logo against content.md | 9 |
| SLOP-D04 | Hero-metric template | RC3 | One sourced number with context, or none | Von Restorff | look near the hero | 7, 9 |
| SLOP-D05 | Fake liveness | RC11 | Delete unless the data is live | Nielsen 1 visibility of system status | lint (version footer); grep `ago`, `last sync` | 13 |
| SLOP-M01 | One reveal for everything | RC1, RC3 | Animate only what communicates; one orchestrated moment if the direction asks | Von Restorff | grep one reveal class on every section | 20 |
| SLOP-M02 | Endless loops | RC11 | Stop loops; animate on state change | WCAG 2.2 2.2.2 pause, stop, hide | grep `infinite`, `animate-pulse`, `marquee` | 20 |
| SLOP-M03 | Wrong physics | RC4 | Transform and opacity, 120-250ms, ease-out, no bounce | Nielsen 1 visibility of system status | lint (transition all, linear, ease-in-out) | 20 |
| SLOP-M04 | Happy path only | RC6, RC8 | Skeleton loading, empty with an action, error with a fix, disabled, focus | Nielsen 1 visibility; Nielsen 9 error recovery | grep for loading, empty and error branches and `:focus-visible` | 19 |
| SLOP-M05 | Motion without a floor | RC8 | Reduced-motion branch; content visible by default | WCAG 2.2 2.3.3 animation from interactions | lint (reduced motion); blank sections in shots | 20 |
| SLOP-M06 | Hover theatre | RC11 | Hover previews what the click does; no custom cursors | Nielsen 4 consistency and standards | grep `cursor:`, `hover:scale`, `mousemove` | 20 |
| SLOP-P01 | Code before brief | RC1, RC5 [S7][S10] | Phase 1 brief: scene, job, three voice words, named reference, inventory | Define before design | `.unslop/brief.md` passes Gate 1 | new |
| SLOP-P02 | First idea shipped | RC2 [S5] | Three directions on three axes, `roll.mjs` seeds, choose for the brief | Diverge then converge | direction.md holds three directions and the seeds | new |
| SLOP-P03 | Never rendered | RC8 [S12][S13] | `shoot.mjs` at 390, 820 and 1440; open every shot | Render and look | `.unslop/shots/<n>/` exists and the critique cites regions | new |
| SLOP-P04 | Self-graded | RC9 [S14] | A separate critic scores `core-design/unslop/references/rubric.md` with evidence | Generator-evaluator split [S14] | `critique-<n>.md` by the critic, with a verdict | new |
| SLOP-P05 | Ban-list patching | RC11 | Back to the brief, then the look test | Typicality bias [S5] | decisions.md cites a brief line per look | new |
| SLOP-P06 | Repeating the last project | RC10 | `log.mjs recent` and `check` before committing | Population diversity [S15][S16] | `log.mjs check` exits 1 | new |
| SLOP-P07 | Layout before copy | RC6, RC7 | Copywriter writes content.md with length budgets before layout | Content first | content.md predates layout.md | new |

## Second-order slop

Second-order slop is an escape from first-order slop that enough generators, prompts and skill files adopted that it now reads as "AI, with a style prompt". Anthropic's current frontend skill lists five clusters that "are defaults rather than choices, and they appear regardless of subject": a warm cream background "with a high-contrast serif display and a terracotta or warm-clay accent"; near-black with one acid-green or vermilion accent; a newspaper layout of thin rules, square corners and dense columns; identical rounded SaaS cards; and template chrome such as tracked uppercase eyebrows, middle-dot metadata, mono for small data and arrows on links and buttons [S11]. This repo shows the mechanism. `_archive/retired/high-end-visual-design/SKILL.md` makes double-bezel cards, pill buttons, a floating glass pill nav and pill eyebrow tags mandatory for premium work. `_archive/retired/design-taste-frontend/SKILL.md` (4.1) and `_archive/retired/redesign-existing-projects/SKILL.md` both replace Inter with the same short list of grotesks, one of which `core-design/impeccable/reference/brand.md` already lists as a reflex reject. Each list was an honest fix; shared by every project that loaded it, each became a uniform.

### SLOP-S01 Cream and editorial serif
Warm off-white ground, high-contrast display serif (often italic), clay or terracotta accent, hairline rules, little imagery [S11]. `core-design/impeccable/SKILL.md` calls the cream body background "the saturated AI default of 2026", and `core-design/impeccable/reference/brand.md` lists the editorial-typographic lane as saturated. Still right for: a literal publication, or a brand whose real materials are paper and ink.

### SLOP-S02 Mono micro-labels
Small monospace or tracked-caps metadata everywhere: section numbers, founding years, coordinates, build strings, middle-dot strips [S11]. Still right for: a developer tool whose labels are real identifiers (rule 4).

### SLOP-S03 Double-bezel cards
A card nested in a card, "a glass plate sitting in an aluminum tray", on every container with large squircle radii; `_archive/retired/high-end-visual-design/SKILL.md` requires it for all major cards, inputs and feature grids. Still right for: one hero object meant to read as hardware, with inner radius = outer minus padding.

### SLOP-S04 Pill nav and pill everything
A detached, fully rounded glass nav bar, pill buttons, and a pill eyebrow tag over the H1 (`_archive/retired/high-end-visual-design/SKILL.md`). Still right for: a product whose own interface already speaks that shape language.

### SLOP-S05 Agency type and marquee
Viewport-filling display type, a scrolling marquee of services or logos, rotated side text, a city and time strip (`_archive/retired/design-taste-frontend/SKILL.md` 9.F). Still right for: a studio portfolio where type is the work, done once, with real work behind it.

### SLOP-S06 Bento everything
Every feature section as an asymmetric bento grid, promoted as a cure for monotony (`_archive/retired/high-end-visual-design/SKILL.md`, "The Asymmetrical Bento") and now a monotony of its own. Still right for: items that really differ in size, each cell holding a real asset.

### SLOP-S07 Linear-style dark
Near-black UI, bold type, complex gradients and glassmorphism, the trend LogRocket names after Linear while noting that almost every SaaS site has started to look the same [S34]; near-black with one acid accent is also on Anthropic's list [S11]. Still right for: a tool used for hours in dim rooms, with contrast that passes.

### SLOP-S08 Grain and warm texture
Film grain or noise over the whole page "to break digital flatness", recommended as an upgrade in `_archive/retired/redesign-existing-projects/SKILL.md` and as an overlay technique in `_archive/retired/high-end-visual-design/SKILL.md`. Still right for: brands whose medium is physical (print, film), with texture on the image, not on the UI.

**Why deriving from the brief plus forced variety beats a new ban list**
1. A ban removes one option and leaves the mode in place, so the next most typical option becomes the new mode: Space Grotesk after Inter [S1], one shared look after "museum quality" [S14].
2. Asked for variety, a model returns the most typical variant [S5]. Variety has to be forced from outside: `core-design/unslop/scripts/roll.mjs` draws seeds at random and skips recent and saturated picks, and the art director writes three directions that differ on at least three axes.
3. A list is shared by every project that loads it, so it homogenizes the population the way shared model suggestions do [S15][S16]. A brief belongs to one project.
4. Lists date. They encode last year's saturation and say nothing about next year's; the brief and the history log stay current.
5. Bans invite the opposite failure: a page with every flagged move removed is empty, not designed. The 20 unslop rules target information and craft (does it inform, is it legible, is it real), never a style.

**The look test (art director before committing, critic when reviewing)**
- Cite it: name the line in brief.md or direction.md that asks for this look. No line, no look.
- Category test at two altitudes: could someone guess this look from the category alone, or from the category plus "but not the usual"? (`core-design/impeccable/SKILL.md`, The AI slop test.) A yes at either altitude means rework.
- History: `node core-design/unslop/scripts/log.mjs check --aesthetic "..." --fonts "..." --palette "..."` exits 1 on a repeat; change it or justify it in writing.
- Saturation: library entries marked `Saturation: high` (`core-design/unslop/references/library/aesthetics.md`) need a reason from the brief.

## AI writing tells in UI copy

Wikipedia's field guide to AI writing, an advice page from WikiProject AI Cleanup rather than policy, lists recurring signs and warns that they count only in combination, because models learned from human writing [S21]. Some tells are measurable: Kobak et al. estimate that at least 13.5% of 2024 PubMed abstracts were processed with LLMs, detected through excess style words [S20]; their published list includes seamless, streamline, elevate, enhance, leveraging, transformative, innovative, groundbreaking, unveiling, harness, realm, landscape, pivotal, intricate, showcasing, underscores and delves. Juzek and Ward found no evidence that such overuse comes from model architecture or training data, and mixed evidence pointing at instruction tuning with human feedback [S33]. In UI copy these words are not wrong because a model likes them; they are wrong because they fit any product.

| Tell | In UI copy | Fix |
|---|---|---|
| Buzzword verbs and adjectives [S20] | "Elevate your workflow", "Seamless integrations" | The literal verb and object: what moves where, how often, for whom |
| Negative parallelism [S21] | "Not just a calendar. A command center." | State what it does that the alternative does not |
| Reflexive triad [S21] | "Fast. Simple. Secure." | Keep the one claim you can prove and add the proof |
| Copula avoidance [S21] | "serves as your single source of truth" | "is", or the real verb: "keeps every contract in one folder" |
| Em dash rhythm [S21] | a punched-up afterthought set off by a dash | Two sentences, a comma, a colon or parentheses |
| Title Case and bold sprinkling [S21] | "Built For Teams That Ship", bold on every third phrase | Sentence case; bold only what a scanner must find |
| Elegant variation [S21] | one thing called "workspace", "hub" and "platform" on one page | One noun per concept, everywhere |
| Inflated significance | "Redefining how teams work", "a testament to craft" | The literal outcome, with a number from content.md |
| Vague attribution | "Loved by teams worldwide", "Experts agree" | Name the customer and the result, or cut it |
| Performative craft | "Quietly trusted by", "Field notes", "made with intention" | Plain labels: "Customers", "Writing" |
| Generic microcopy | "Oops! Something went wrong", "Submit", "No data" | What happened, how to fix it, verb plus object [S11] |
| Invented testimonial | a glowing quote from "Sarah J." | A real quote with name, role and company, or `[MISSING: customer quote]` [S22] |

**Headlines.** Say what it does, for whom, with a concrete noun and verb (rule 9). Write five, run the swap test on each, and keep the one a stranger could repeat back. Use numbers only from content.md.

**Microcopy.** Every action is verb plus object; errors say what happened and how to fix it, next to the field; empty states say what the thing is and offer the action (rules 10 and 19). Anthropic's skill puts it plainly: "Errors don't apologize, and they are never vague about what happened" [S11].

**Testimonials and proof.** Real people only, with name, role and company. Keep the specific detail (a number, a before and after) and cut the praise around it. With no real quote, propose proof the user can supply instead of writing one.

**Voice from the brief.** Turn each voice word into a writing rule: sentence length, person, vocabulary, humor or none. "Calm, clinical, careful" writes short declaratives with exact units; "warm, mechanical, opinionated" may take a side. A voice word that changes no sentence is the wrong word.

**Concrete nouns and verbs.** "Use definite, specific, concrete language" [S31], and cut the stock phrase and the long word where a short one will do [S32]. Name the thing on the screen ("invoice", "pickup window", "shift"), not its category ("solution", "experience").

**Read-aloud test.** Read every string aloud, in the voice, to someone from the brief's scene. If you would not say it across a counter, or a competitor could say it too, rewrite it. Then run `lint.mjs` for buzzwords and dashes.

## How the studio prevents each root cause

| Root cause | Phase and role | Mechanism |
|---|---|---|
| RC1 Distributional convergence | Phase 1 ux-strategist, Gate 1 | Brief gate: scene sentence, three voice words and a named reference close the open axes before any code |
| RC2 Typicality bias | Phase 2 art-director | Three divergent directions on at least three axes, `core-design/unslop/scripts/roll.mjs` random seeds, the critic's category test |
| RC3 Over-represented sources | Phase 3 typographer, colorist, layout-designer | Every choice derived from the voice words and reference, then checked against saturation flags and the look test |
| RC4 Framework defaults | Phase 4 frontend-engineer, Gate 4 | Components use tokens only; library components are themed, never shipped in default state |
| RC5 Vague briefs | Phase 1, Gate 1 | Swap test on the brief itself; one blocking question to the user, or a written assumption |
| RC6 No real content | Phase 1 copywriter and ux-strategist | Copy and real content first: content.md with MISSING and SAMPLE markers, labeled asset slots instead of fake UI |
| RC7 Template momentum | Phase 1 IA, Phase 3 layout-designer, Gate 3 | Sections ranked by job; a layout family chosen per section; no family repeats across major sections |
| RC8 No visual feedback | Phases 4 and 6 | `core-design/unslop/scripts/shoot.mjs` at 390, 820 and 1440; the engineer and the critic must open and look at every screenshot |
| RC9 Self-grading | Phase 6 design-critic | A separate critic scores `core-design/unslop/references/rubric.md` with evidence and stop criteria, and escalates instead of lowering the bar |
| RC10 Shared models, training loop | Step 0 and Phase 7, creative director | `core-design/unslop/scripts/log.mjs` cross-project history: `recent` and `check` before committing, `add` after shipping, `lessons` for recurring findings |
| RC11 Second-order slop | Phases 2 and 6 | No default lists; libraries are sampling pools; every look cites a brief line and passes the look test |

## Sources

- [S1] Anthropic Applied AI team (Prithvi Rajasekaran, Justin Wei, Alexander Bricken), "Improving frontend design through Skills", Claude blog, 12 November 2025. https://claude.com/blog/improving-frontend-design-through-skills
- [S2] Tuch, A. N., Presslaber, E. E., Stöcklin, M., Opwis, K., Bargas-Avila, J. A. "The role of visual complexity and prototypicality regarding first impression of websites: Working towards understanding aesthetic judgments." International Journal of Human-Computer Studies 70(11), 794-811, 2012.
- [S3] Kirk, R., Mediratta, I., et al. "Understanding the Effects of RLHF on LLM Generalisation and Diversity." ICLR 2024. arXiv:2310.06452.
- [S4] Padmakumar, V., He, H. "Does Writing with Language Models Reduce Content Diversity?" ICLR 2024. arXiv:2309.05196.
- [S5] Zhang, J., Yu, S., Chong, D., Sicilia, A., Tomz, M. R., Manning, C. D., Shi, W. "Verbalized Sampling: How to Mitigate Mode Collapse and Unlock LLM Diversity." arXiv:2510.01171, 2025 (ICML 2026). Code: https://github.com/CHATS-lab/verbalized-sampling
- [S6] Adam Wathan, post on X, 7 August 2025. https://x.com/adamwathan/status/1953510802159219096
- [S7] Wang, H.-H., Brown, M. "Good from Afar, But Far from Good: AI Prototyping in Real Design Contexts." Nielsen Norman Group, 24 October 2025. https://www.nngroup.com/articles/ai-prototyping/
- [S8] Vercel, `create-next-app` template `app-tw/ts/app/layout.tsx` (imports Geist and Geist_Mono). https://raw.githubusercontent.com/vercel/next.js/canary/packages/create-next-app/templates/app-tw/ts/app/layout.tsx
- [S9] shadcn/ui documentation, "Manual Installation" (sample `components.json`). https://ui.shadcn.com/docs/installation/manual
- [S10] Moran, K. "GenUI vs. Vibe Coding: Who's Designing?" Nielsen Norman Group, 27 March 2026. https://www.nngroup.com/articles/genui-vs-vibe/
- [S11] Anthropic, `frontend-design` skill, SKILL.md, main branch as read in November 2026. https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md
- [S12] Wu, J., Schoop, E., Leung, A., Barik, T., Bigham, J., Nichols, J. "UICoder: Finetuning Large Language Models to Generate User Interface Code through Automated Feedback." NAACL 2024.
- [S13] Lu, Z., Ren, H., et al. "WebGen-Agent: Enhancing Interactive Website Generation with Multi-Level Feedback and Step-Level Reinforcement Learning." arXiv:2509.22644, 2025 (ICLR 2026).
- [S14] Rajasekaran, P. "Harness design for long-running application development." Anthropic, 24 March 2026. https://www.anthropic.com/research/harness-design-long-running-apps
- [S15] Doshi, A. R., Hauser, O. P. "Generative AI enhances individual creativity but reduces the collective diversity of novel content." Science Advances 10(28), eadn5290, 2024.
- [S16] Anderson, B. R., Shah, J. H., Kreminski, M. "Homogenization Effects of Large Language Models on Human Creative Ideation." Creativity and Cognition (C&C '24), 2024. arXiv:2402.01536.
- [S17] SaaStr, "Gemini 3 Solves One of the Biggest Headaches With Vibe Coding: Now Your Site Doesn't Have to Look Like It Was ... Vibe Coded" (opinion piece). https://www.saastr.com/gemini-3-solves-one-of-the-biggest-headaches-with-vibe-coding-now-your-site-doesnt-have-to-look-like-it-was-vibe-coded/
- [S18] Shumailov, I., et al. "AI models collapse when trained on recursively generated data." Nature 631, 755-759, 2024.
- [S19] Superdesign, "Why AI Design Looks Generic (2026)" (vendor blog). https://superdesign.dev/blog/why-ai-design-looks-generic
- [S20] Kobak, D., González-Márquez, R., Horvát, E.-Á., Lause, J. "Delving into LLM-assisted writing in biomedical publications through excess vocabulary." Science Advances 11(27), eadt3813, 2025. Word list: https://raw.githubusercontent.com/berenslab/llm-excess-vocab/main/results/excess_words.csv
- [S21] Wikipedia, "Wikipedia:Signs of AI writing" (WikiProject AI Cleanup advice page, not policy). https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
- [S22] US Federal Trade Commission, "Federal Trade Commission Announces Final Rule Banning Fake Reviews and Testimonials", 14 August 2024 (16 CFR Part 465). https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- [S23] Nielsen, J. "Enhancing the explanatory power of usability heuristics." CHI 1994. Current wording: Nielsen Norman Group, "10 Usability Heuristics for User Interface Design". https://www.nngroup.com/articles/ten-usability-heuristics/
- [S24] Wertheimer, M. "Untersuchungen zur Lehre von der Gestalt II." Psychologische Forschung 4, 301-350, 1923.
- [S25] von Restorff, H. "Über die Wirkung von Bereichsbildungen im Spurenfeld." Psychologische Forschung 18, 299-342, 1933.
- [S26] Kurosu, M., Kashimura, K. "Apparent usability vs. inherent usability: experimental analysis on the determinants of the apparent usability." CHI '95 Conference Companion, 292-293, 1995.
- [S27] Fitts, P. M. "The information capacity of the human motor system in controlling the amplitude of movement." Journal of Experimental Psychology 47(6), 381-391, 1954.
- [S28] Hick, W. E. "On the rate of gain of information." Quarterly Journal of Experimental Psychology 4(1), 11-26, 1952.
- [S29] Bringhurst, R. The Elements of Typographic Style. Hartley & Marks, 1992.
- [S30] W3C. Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation, 2023.
- [S31] Strunk, W., Jr. The Elements of Style. 1918 (later editions with E. B. White).
- [S32] Orwell, G. "Politics and the English Language." Horizon, 1946.
- [S33] Juzek, T. S., Ward, Z. B. "Why Does ChatGPT 'Delve' So Much? Exploring the Sources of Lexical Overrepresentation in Large Language Models." COLING 2025.
- [S34] LogRocket blog, "Linear design: The SaaS design trend that's boring and bettering UI." https://blog.logrocket.com/ux-design/linear-design

Repo files cited by path: `core-design/impeccable/SKILL.md`, `core-design/impeccable/reference/brand.md`, `_archive/retired/design-taste-frontend/SKILL.md` (sections 4 and 9), `_archive/retired/high-end-visual-design/SKILL.md`, `_archive/retired/redesign-existing-projects/SKILL.md`, `core-design/unslop/agents/ux-strategist.md`. Pages on x.com, en.wikipedia.org, nngroup.com, saastr.com, superdesign.dev, blog.logrocket.com, ftc.gov and ui.shadcn.com were verified through search results because direct fetching was blocked in the session that wrote this file; the papers were verified through search and are cited by venue. Template momentum (RC7) is an observation from practice with no source.
