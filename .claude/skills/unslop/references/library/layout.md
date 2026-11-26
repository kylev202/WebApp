# Layout designer's library

You are the layout designer in the unslop studio: you turn the brief, the content inventory and the asset list into sections, grids, spacing, layers and responsive behavior, and you hand a text wireframe plus layout tokens to the frontend engineer. "Rule N" means rule N of the 20 rules in `core-design/unslop/SKILL.md`. Every catalog here is a sampling pool, not a default: entries are in no order of preference, each says when it fits and how it fails, and "Saturation: high" marks what AI generators over-use right now. If you notice you took the first entry you read, choose again from the Use when lines.

## Contents

- Method: [How the layout designer works](#how-the-layout-designer-works), [Text wireframe template](#text-wireframe-template), [Grids](#grids), [CSS layout recipes](#css-layout-recipes), [Every Layout primitives](#every-layout-primitives)
- System: [Spacing and rhythm](#spacing-and-rhythm), [Layout tokens](#layout-tokens), [Composition](#composition)
- Catalogs: [Hero](#hero-patterns), [Feature and story](#feature-and-story-patterns), [Proof](#proof-patterns), [Pricing](#pricing-patterns), [CTA](#cta-patterns), [Navigation](#navigation-patterns), [Footer](#footer-patterns), [App layout](#app-layout-patterns)
- Checks: [Layout family rotation](#layout-family-rotation), [Responsive rules and touch targets](#responsive-rules-and-touch-targets), [Repo layout sources](#repo-layout-sources), [Sources](#sources)

## How the layout designer works

Inputs: the five brief lines from `core-design/unslop/SKILL.md` (who and where, job, voice words, named reference, real content), the copywriter's text and the art director's asset list. Output: the text wireframe below and the layout tokens, which the frontend engineer builds and the design critic checks against the screenshots.

1. **Content inventory.** List every real item: product name, claims with their evidence, features, screenshots, photos, quotes with full attribution, logos you may use, prices, numbers with their source. Tag each REAL, SAMPLE (shown with a visible "sample data" label) or MISSING (a labeled placeholder slot plus a note to the user). A layout chosen before this list gets filled with invented content (rules 6 and 9).
2. **Priority ranking.** Rank every item 1-5 against the job line. Each view gets exactly one rank-1 item, and it wins by size, not only by weight (rule 7). Rank-5 items leave the page: cutting is a layout decision.
3. **One job per section.** Write the visitor question each section answers ("Does it work with Postgres?"). Two sections answering one question merge; a section that answers nothing goes.
4. **Composition per section.** Name the focal element, the supporting elements, the alignment axis and the layout family, then pick a catalog entry by its Use when line.
5. **Grid.** Choose it after the content. The column count follows the most demanding section: a three-way comparison needs columns divisible by 3, while a text-led page may need only a manuscript grid with breakouts.
6. **Spacing, tokens and layers.** Fix the scale, the proximity ratios, each section's gap, the radius pair and the z-index roles before styling.
7. **Responsive behavior.** For every multi-column section write the 390px stack order and what collapses. Order by priority; nothing important hides behind a breakpoint.
8. **Wireframe, code, render.** Write the wireframe, build, run `node core-design/unslop/scripts/shoot.mjs <file> <outdir>`, and check the screenshots against the wireframe's FOCAL and ROTATION lines.

## Text wireframe template

Write this before any markup. Reordering text is cheap; reordering built sections is not.

```text
PAGE: <name>                          JOB: <the brief's job line>
REGISTER: brand | product             REFERENCE: <named reference>
GRID: <columns, --container, --gutter>    SPACING: <tokens in use>    RADIUS: <outer>, inner = outer - pad
DEFAULT-ORDER MATCH: <n> of 7 (hero, three features, logos, testimonials, pricing, FAQ, CTA band)

S1  <section name>
    QUESTION: <what the visitor asks here>
    FAMILY: <family from Layout family rotation>    PATTERN: <catalog entry>
    FOCAL: <the rank-1 element and its span or size>
    SUPPORT: <rank 2-3 items>
    CONTENT: <REAL | SAMPLE | MISSING, per item>
    1440: <columns and spans>    820: <what changes>    390: <stack order>
    DENSITY: compact | regular | comfortable | airy    GAP ABOVE: <--space-n>
    LAYERS: <sticky, overlay or none, by z role>
    CTA: <verb + object, the one label for this intent> | none
S2  ...

ROTATION: <k> families across <N> sections; adjacent repeats: none | <list>
MISSING ASSETS: <exact list to report to the user>
```

## Grids

A grid is a promise that edges line up. Choose the type from the content's shape, and use its divisibility to make unequal splits rather than to repeat equal ones.

- **12-column.** Fits pages that need halves, thirds, quarters and unequal splits (7/5, 8/4, 5/7 with an empty column); everyone knows it, so handoff is easy. Fails when every section lands on 4/4/4 or 6/6, which is the template look. Build: `grid-template-columns: repeat(12, minmax(0, 1fr))`.
- **8-column.** Fits content-led pages and tablet widths where halves and quarters suffice; fewer, wider columns push bolder spans. Fails for three-way comparisons, since 8 does not divide by 3.
- **Asymmetric columns.** Tracks such as `minmax(0, 5fr) minmax(0, 3fr)` fit one dominant stream beside a side stream (article and notes, product shot and specs). Fails when both sides matter equally, because the widths assert a hierarchy that is false.
- **Modular.** Columns and rows form modules that items span by rank (1x1, 2x1, 2x2) [S1]. Fits catalogs, galleries, dashboards and spec sheets. Fails for reading text, and when every item takes one module: a modular grid without hierarchy is a template bento.
- **Manuscript.** One text block inside margins [S2]. Fits long-form reading, docs, legal pages, letters and case studies. Fails where things must sit side by side; add breakouts for figures instead of widening the text.
- **Hierarchical.** Zones sized to their content rather than to a repeating unit [S2]. Fits publication home pages, product detail pages and editorial landings where each zone has its own natural width. Fails when nobody can explain the widths, at which point it is ad hoc placement.
- **Baseline.** Vertical spacing in multiples of the body line-height (see "Vertical Rhythm" in `core-design/impeccable/reference/typeset.md`). Fits multi-column text whose baselines should align across columns. Fails in product UI with mixed control heights, where it fights the spacing scale for little gain.

## CSS layout recipes

**Named areas, redefined per breakpoint.** Areas move boxes visually, not for keyboard and screen reader users, so keep source order equal to reading order.

```css
.feature { display: grid; gap: var(--space-5); grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "title" "media" "body" "cta"; }
@media (min-width: 64rem) {
  .feature { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    grid-template-areas: "title media" "body media" "cta media"; } }
.feature > h2 { grid-area: title; } .feature > figure { grid-area: media; }
.feature > p { grid-area: body; } .feature > .cta { grid-area: cta; }
```

**Auto-fit peers with subgrid rows.** `repeat(auto-fit, minmax(min(17rem, 100%), 1fr))` gives peers breakpoint-free columns, and `min()` stops overflow in narrow containers; `auto-fill` instead keeps empty tracks so a lone item keeps its width. Subgrid lines up titles, bodies and buttons across cards (rule 17) and is Baseline since September 2023 [S3]. This grid sizes every item equally, so use it only for true peers (rule 7).

```css
.cards { display: grid; gap: var(--space-5);
  grid-template-columns: repeat(auto-fit, minmax(min(17rem, 100%), 1fr)); }
.card { display: grid; grid-row: span 3; grid-template-rows: subgrid; row-gap: var(--space-3); }
```

**Container queries.** Components respond to their slot, the page to the viewport. Size queries are Baseline since February 2023, and `cqi` is 1% of the container's inline size [S4]. An element cannot query itself, and `inline-size` containment on a shrink-to-fit element collapses it, so declare the container on a wrapper with a definite width.

```css
.slot { container: slot / inline-size; }
.teaser { display: grid; gap: var(--space-3); }
@container slot (min-width: 34rem) {
  .teaser { grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); align-items: center; } }
.teaser h3 { font-size: clamp(1.125rem, 1rem + 2cqi, 1.75rem); }
```

**Full-bleed breakout.** Named lines let one flow hold measure-width text, wider figures and edge-to-edge bands; Comeau's simpler original is `1fr min(42rem, 100%) 1fr` with bleeds spanning `1 / -1` [S5]. Fits articles, case studies and docs. Fails in app shells, where regions (sidebar, list, detail) are the structure.

```css
.flow { display: grid; grid-template-columns: [full-start] minmax(var(--gutter), 1fr)
    [wide-start] minmax(0, calc((var(--container) - var(--measure)) / 2))
    [content-start] min(var(--measure), 100% - 2 * var(--gutter)) [content-end]
    minmax(0, calc((var(--container) - var(--measure)) / 2)) [wide-end] minmax(var(--gutter), 1fr) [full-end]; }
.flow > * { grid-column: content; } .flow > .wide { grid-column: wide; } .flow > .full { grid-column: full; }
```

## Every Layout primitives

Pickering and Bell's primitives [S6] respond to their own space without breakpoints. Compose them instead of inventing a one-off layout per section; a Sidebar whose main part is a Stack of Clusters covers most settings screens.

- **Stack:** vertical flow via `.stack > * + * { margin-block-start: var(--space) }`; set `--space` per stack, which is how rhythm varies (rule 8).
- **Box:** padding, border and color for a real group, not a wrapper for text that needs no container (rule 8).
- **Center:** a measure-wide column: `max-inline-size: var(--measure); margin-inline: auto; box-sizing: content-box` plus inline padding.
- **Cluster:** a wrapping row (`display: flex; flex-wrap: wrap; gap`) for tags, buttons, nav links and metadata.
- **Sidebar:** a fixed-ish side element beside a main element that takes the rest and wraps under it when it would get too narrow (`flex-basis: 0; flex-grow: 999; min-inline-size: 50%` on the main element) [S6].
- **Switcher:** peers in a row that become a column below a threshold with no media query, via `flex-basis: calc((30rem - 100%) * 999)` [S6]; every item switches at once, so use it for peers only.
- **Cover:** a min-height region with one vertically centered principal element and optional top and bottom elements; the hero primitive.
- **Grid and Frame:** the auto-fit `minmax(min(), 1fr)` grid for equal peers; media cropped to an aspect ratio with `aspect-ratio` and `object-fit: cover`.
- **Reel:** a horizontally scrolling row for browsable sets; let a cut-off item show that more exists, and give the scroller a label and focusability when it holds nothing focusable.
- **Imposter and Icon:** an element positioned over the center of a container, for overlays scoped to one region; an inline icon sized in `em` to its text with a fixed gap (rules 12 and 17).
- The site's index also lists a Container layout; its recipe was not verified for this library, so do not cite it.

## Spacing and rhythm

- **Scale.** Use rule 8's example steps as `--space-1` to `--space-7`, and add `--space-8` and `--space-9` only for section gaps on brand pages (values in Layout tokens). Product UI keeps fixed rem steps; brand pages may make section gaps fluid with `clamp()` pairs, as in Utopia's space pairs [S7]. Nothing outside the scale.
- **Proximity ratios.** The gap between groups is at least twice the gap inside a group; the gap between sections is at least three times the largest gap inside them; a heading sits at least twice as far from the block above as from its own content. Check these in the screenshot, not in the code.
- **Varying section rhythm.** Derive each section gap from the relationship: sections continuing one argument sit at `--space-7`, a change of subject gets `--space-9`, a full-bleed band may touch its neighbor. Equal padding on every section flattens the page into slabs (rule 8, and the spacing bans in `core-design/impeccable/reference/layout.md`). Give the page's rank-1 section the most room.
- **Density modes.** Pick one per surface and apply it as a multiplier (`--density: .75 | 1 | 1.25`) through `calc()` on paddings and gaps; never mix modes inside one table. Compact (tables, trading, editor-like tools) fits experts who repeat tasks all day and fails on touch and for occasional users, because targets fall under 44px. Regular fits most product screens and fails on marketing pages, which then read like admin panels. Comfortable (forms, onboarding, consumer apps) fits first-time and touch use and fails for comparison work, where fewer rows fit. Airy (brand pages) fits one idea per section and fails when it pads thin content to look premium.

## Layout tokens

Token names are fixed so every role can find them; the values are examples to replace with values derived from the brief.

```css
:root {
  --space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem;
  --space-5: 1.5rem; --space-6: 2.5rem; --space-7: 4rem;
  --space-8: clamp(4rem, 3rem + 4vw, 6rem); --space-9: clamp(5rem, 3.5rem + 6vw, 8rem);
  --measure: 65ch;                            /* reading line length, rule 16 */
  --container: 75rem;                         /* widest content row, taken from the grid */
  --gutter: clamp(1rem, .5rem + 2vw, 2rem);   /* page edge padding and column gap */
  --radius-outer: 1rem;                       /* the one outer radius, rule 14 */
  --z-base: 0; --z-raised: 100; --z-sticky: 200; --z-dropdown: 300;
  --z-overlay: 400; --z-modal: 500; --z-toast: 600; --z-tooltip: 700;
}
.container { inline-size: min(100% - 2 * var(--gutter), var(--container)); margin-inline: auto; }
.nest { --pad: var(--space-2); padding: var(--pad); border-radius: var(--radius-outer);
  --radius-inner: max(0px, calc(var(--radius-outer) - var(--pad))); }
.nest > * { border-radius: var(--radius-inner); }
```

- **Radius pair.** Declare `--radius-inner` on the element that sets the padding, as above: a custom property computed on `:root` cannot see a `--pad` changed lower in the tree. `max(0px, ...)` stops a negative radius when the padding exceeds the outer radius. One level deeper, the inner radius becomes the next outer.
- **Layers.** Use role names, never raw numbers (row 15 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv`; section 6.F of `_archive/retired/design-taste-frontend/SKILL.md`); roles 100 apart leave room to insert one later. Components that stack their own children set `isolation: isolate`, so internal values never compete with the page. A `<dialog>` opened with `showModal()` and any `popover` render in the top layer above every z-index, so `--z-modal` and `--z-tooltip` serve fallbacks only, and a toast that must show over an open modal has to be a popover itself.

## Composition

- **Focal point.** One per view, from the priority ranking. Blur or squint at the 1440 screenshot: the first thing you see must be the rank-1 element. If two things compete, shrink or quiet one.
- **Scale contrast.** About 3:1 between the focal element and its supporters reads as clear hierarchy; under 2:1 reads as hesitation (hierarchy table in `core-design/impeccable/reference/layout.md`). Apply it to images and tiles, not only to type.
- **Asymmetric balance.** Visual weight comes from size, darkness, saturation, texture and isolation, so a large light mass balances a small dark one placed farther from the center [S8]. Use asymmetry when the content has a clear primary; use symmetry for ceremonial moments (an event title, a single statement) where stillness is the message.
- **Alignment axes.** Pick one or two vertical axes per page (for example the text start and the media edge) and snap everything to them. Count distinct left edges in the screenshot; past three or four, the page reads unplanned.
- **White space.** Active space isolates the focal element and separates groups; leftover space around a floating block is a bug. Try more space before adding a divider, border or card (rule 8).
- **Overlap and layering.** Overlap image and text only to show they belong together, on a scrim or solid panel that keeps text at 4.5:1 (rule 15). No overlap for depth alone, and never three or more stacked layers.
- **Cropping.** Tight crops give scale and intimacy, wide crops give context. Use `aspect-ratio`, `object-fit` and `object-position`, and check at 390 that faces and product edges survive. Crop screenshots to a meaningful region, never through UI text.
- **Directional cues and reading.** Gaze in photos, the angle of a product shot and leading lines point into the page and toward the CTA, not off the edge; literal decorative arrows and scroll cues stay out (rule 13). Pages without cues get scanned in an F-shape, while headings that carry the message on their own support the layer-cake scan, where readers jump from heading to heading [S9].

## Hero patterns

### Product-in-use split
- **Use when:** the product has a real UI or physical form that proves the headline at a glance.
- **Build:** text on 5 of 12 columns and media on 7 (or mirrored); the media is a real screenshot or photo cropped to the part that proves the claim; headline at most 2 lines at 1440; one primary CTA; at 390 the headline, subline and CTA come first, then the media.
- **Slop risk:** a 50/50 split with a stock gradient or a fake dashboard built from divs (rule 6); equal halves claim equal weight, so give the media more area.
- **Saturation:** medium
### Centered claim over product shot
- **Use when:** a short, specific claim (8 words or fewer) plus a legible real screenshot tell the whole story, as in launches and single-capability tools.
- **Build:** a Center primitive around a 20-24ch headline, one CTA, then a wide real screenshot whose top edge shows in the first viewport.
- **Slop risk:** the most generated hero on the web: pill badge above the headline, gradient text, two equal buttons, browser frame with a glow (rules 1, 10 and 13). Still legitimate with no badge, no glow, one primary CTA and a real screenshot.
- **Saturation:** high
### Full-bleed photograph
- **Use when:** the brief is image-led (hotel, restaurant, travel, fashion, a physical product in its place) and one decisive photo carries the mood.
- **Build:** a Cover primitive at 85-100dvh, `object-fit: cover` with a deliberate `object-position`, the headline in the photo's quiet area or on a scrim at 4.5:1, an art-directed mobile crop through `<picture>`.
- **Slop risk:** category stock ("luxury hotel lobby") instead of the brand's own physical world (rule 6); white text on a busy photo without a scrim (rule 15).
- **Saturation:** medium
### Type-led manifesto
- **Use when:** the brief is a statement (a campaign, an open letter, a studio's point of view) and real work or product imagery appears directly below, inside the first scroll.
- **Build:** very large type, 2-3 lines, left-aligned on a manuscript or hierarchical grid, one supporting line, one CTA, generous space before the first image.
- **Slop risk:** rule 6 forbids a hero that is only text over a gradient; with no real visual nearby this pattern is the wrong choice. Also a headline that fits any competitor (rule 9) and one italic word for flavor (rule 3).
- **Saturation:** medium
### Live demo hero
- **Use when:** the product can run in the page (converter, editor, calculator, generator) and trying it beats reading about it.
- **Build:** the real component as the focal element (7 of 12 columns or full width), prefilled with realistic input, with loading, empty and error states (rule 19); the CTA continues from the demo's state ("Save this palette").
- **Slop risk:** a screenshot with a fake play button; a demo that demands signup before it shows anything.
- **Saturation:** low
### Search-first hero
- **Use when:** the visitor's first act is a query: marketplaces, directories, docs, travel, jobs.
- **Build:** one wide labeled input with a submit button, a Cluster of real popular queries below it, categories or first results directly underneath.
- **Slop risk:** a decorative search box that searches nothing; the placeholder doubling as the label.
- **Saturation:** low
### Editorial cover
- **Use when:** a publication, report or annual review where a story or an issue is the product.
- **Build:** a hierarchical grid with the lead story's image and headline across 8 columns and two or three secondary stories, with real titles and dates, in a narrow column.
- **Slop risk:** the saturated editorial-typographic lane: italic display serif, small mono metadata, ruled columns, no imagery (lane list in `core-design/impeccable/reference/brand.md`; rules 3 and 4). Still legitimate for an actual publication with real stories and images.
- **Saturation:** high
### Motion loop hero
- **Use when:** the product is motion (a camera, a game, a vehicle, a performance) and a still cannot show it.
- **Build:** a muted inline loop with a poster frame and a visible pause control, the poster alone under `prefers-reduced-motion`, the headline outside the video or on a scrim.
- **Slop risk:** abstract stock loops (particles, ink, waves); text over moving footage without contrast control (rules 15 and 20).
- **Saturation:** medium
### Before and after
- **Use when:** the value is a visible transformation (photo repair, renovation, cleanup, translation).
- **Build:** a comparison slider whose handle is a keyboard-operable range input, real paired assets at identical crops, "Before" and "After" labels outside the image; a static side-by-side as fallback.
- **Slop risk:** an "after" the product cannot actually produce; sample results without a sample label (rule 9).
- **Saturation:** low
### Catalog shelf hero
- **Use when:** commerce or menus where the products are the pitch and people browse rather than read.
- **Build:** one short headline line, then the first row of real products with prices in tabular figures (rule 18), filters one tap away.
- **Slop risk:** a lifestyle banner that pushes every product below the fold; an auto-advancing promo carousel.
- **Saturation:** low
### Two-audience split
- **Use when:** a two-sided product (buyers and sellers, hosts and guests) whose first question is "which one are you?".
- **Build:** the one case where equal halves are honest; each half carries its own specific headline and one CTA; stacked at 390 with the larger audience first.
- **Slop risk:** inventing a second audience to justify a split; two CTAs with the same intent (rule 10).
- **Saturation:** low
### Asymmetric collage
- **Use when:** a brand with several real assets of different sizes (a studio, a festival, a collection) and a rich or playful voice.
- **Build:** a hierarchical grid with 3-5 real images at clearly different sizes, one dominant, the headline anchored to one axis; at 390 only the dominant image and one more.
- **Slop risk:** tilted polaroids, floating stickers and scattered rotated cards with no logic (rule 13); grey boxes standing in for images.
- **Saturation:** medium

## Feature and story patterns

### Three equal icon cards
- **Use when:** exactly three peers of genuinely equal weight, each with real content, in a secondary position on the page.
- **Build:** no icons that restate the title (rule 12), real evidence in each card (a sourced number, a screenshot crop, a quote), buttons aligned with subgrid.
- **Slop risk:** the default to avoid (rule 7): rounded-square icon, two-word title, two lines of filler, three times. Still legitimate when the three really are equal and each holds evidence.
- **Saturation:** high
### One large plus supporting list
- **Use when:** one feature matters most and three to six others support it, which is the usual real situation.
- **Build:** the focal feature spans 7-8 columns with a real visual; the rest form a plain Stack list (title plus one line) in the remaining columns, with no cards; the focal feature first at 390.
- **Slop risk:** a "large" item that is barely larger; give it about twice the area of any supporter.
- **Saturation:** low
### Ranked bento
- **Use when:** 4-7 features of different importance, each with its own real visual (UI crop, photo, small live component).
- **Build:** a 6-column modular grid with cell size by rank, exactly as many cells as items (cell count rule in `_archive/retired/design-taste-frontend/SKILL.md` section 4.7), at least two image cells, nested radii by rule 14.
- **Slop risk:** the current template look: equal rounded tiles on off-white, icon plus text in each. Still legitimate when size encodes rank and every cell shows a real thing.
- **Saturation:** high
### Alternating media rows
- **Use when:** two features that each need a real screenshot and a paragraph of explanation.
- **Build:** at most two consecutive rows (zigzag cap in `_archive/retired/design-taste-frontend/SKILL.md` section 4.7), a different media size per row, text tops aligned with media tops.
- **Slop risk:** four or more alternating rows, where attention ends at the second. Still legitimate for two rows broken up by a different family.
- **Saturation:** high
### Sticky media with steps
- **Use when:** one interface changes across 3-5 steps, and the same frame in different states explains more than separate images.
- **Build:** a Stack of step texts beside a `position: sticky` media frame that swaps state as each step enters view; instant swaps under reduced motion; at 390 an image inline with each step and no pinning.
- **Slop risk:** scroll-jacking that changes scroll speed; a pinned frame that never changes.
- **Saturation:** medium
### Annotated screenshot
- **Use when:** one real screen holds the story and 3-5 details need explaining.
- **Build:** a large real screenshot with numbered markers tied to a list beside or below it (the numbers are a real reference, so rule 13 allows them); at 390 the list with cropped detail images.
- **Slop risk:** markers on a div-built fake UI; a screenshot too small to read.
- **Saturation:** low
### Tabbed feature explorer
- **Use when:** 3-6 parallel features, each with a substantial visual, of which a visitor needs one or two.
- **Build:** real tabs (Tabs entry in `core-design/unslop/references/library/patterns.md`), each panel a real screenshot with two lines of text, a stable panel height so the page does not jump.
- **Slop risk:** the key feature hidden in the fourth tab; tabs that rotate on a timer (rule 20).
- **Saturation:** medium
### Problem and fix pairs
- **Use when:** buyers know the pain precisely (operations, finance, compliance) and each feature answers a named problem.
- **Build:** two-column rows with the problem in the customer's words and the product's behavior beside it with a crop, or a two-column "today / with the product" table.
- **Slop risk:** straw-man problems; statement-then-negation copy (rule 9).
- **Saturation:** low
### Grouped spec sheet
- **Use when:** hardware, materials or technical products where specifications are the argument.
- **Build:** 3-4 key specs as large values with units and a one-line reason each, the rest in 2-3 titled groups with one divider per group or behind a "Full specifications" disclosure.
- **Slop risk:** a long table with a hairline under every row (`_archive/retired/design-taste-frontend/SKILL.md` section 4.9); invented precision.
- **Saturation:** low
### Comparison with the old way
- **Use when:** visitors are switching from a known alternative and want concrete differences.
- **Build:** a real table with 3-8 rows, the product's column emphasized with the accent at low strength, words instead of check icons where nuance matters, a source for every competitor claim.
- **Slop risk:** all checks for us and all crosses for them; claims nobody can verify.
- **Saturation:** medium
### Process sequence
- **Use when:** there is a true order (how the service works, setup, delivery), so numbering carries information.
- **Build:** an ordered list named by verbs ("Measure", "Cut", "Deliver"), horizontal at wide widths only for 3-4 steps, vertical otherwise.
- **Slop risk:** "01 / 02 / 03" on things that are not a sequence (rule 13); "Step 1" labels with no content behind them.
- **Saturation:** medium
### Gallery of real outputs
- **Use when:** the output is visual (templates, portfolios, generated results, dishes).
- **Build:** a masonry or modular grid of real items with title and maker, filters as a Cluster, set dimensions on lazy-loaded images so nothing shifts.
- **Slop risk:** grey placeholder rectangles; information shown only on hover, which touch never triggers.
- **Saturation:** medium
### Narrative with breakouts
- **Use when:** reasoning sells better than a list: founder letters, case studies, methodology pages.
- **Build:** a manuscript grid at 60-75ch with breakout figures and full-bleed images (breakout recipe above) and headings that work as a scan path.
- **Slop risk:** walls of text with no headings; pull quotes that repeat the paragraph above them.
- **Saturation:** low
### Code with output
- **Use when:** the audience is developers and code shows the product's ergonomics.
- **Build:** real code in a mono block (rule 4 allows mono for code) with a copy button, language tabs only for languages actually supported, the real output beside or below.
- **Slop risk:** fake terminal windows with traffic-light dots as decoration; code that would not run.
- **Saturation:** medium

## Proof patterns

### Logo wall
- **Use when:** the logos are real customers this audience recognizes, used with permission.
- **Build:** one row of 5-8 single-color logos at optically equal size (match visual weight, not height) directly under the hero, logos only with no category labels (`_archive/retired/design-taste-frontend/SKILL.md` section 4.8), light variants in dark mode.
- **Slop risk:** walls of unknown or invented brands; a grayscale marquee scrolling forever (rule 20). Still legitimate with real, recognizable logos.
- **Saturation:** high
### Quote beside its claim
- **Use when:** one specific quote from a named person proves one specific claim.
- **Build:** at most 3 lines of quote (`_archive/retired/design-taste-frontend/SKILL.md` section 4.10), name, role and company, a real photo or none, placed in the section whose claim it proves.
- **Slop risk:** vague praise ("Game changer!"); first-name-only attribution; stock headshots.
- **Saturation:** medium
### Review wall
- **Use when:** volume is the signal (consumer apps, courses, products with many public reviews).
- **Build:** the aggregate rating to one decimal with its count and platform on top, then a masonry of real reviews with source and date, no autoplay, a link to the full source; place it near the purchase decision.
- **Slop risk:** six identical five-star cards; "4.9 stars" with no count or source; avatars and names that are invented (rule 9). Still legitimate when every review links to a real source.
- **Saturation:** high
### Case study band
- **Use when:** B2B with long sales cycles, where one customer story with a measured result outweighs ten quotes.
- **Build:** customer name and logo, an outcome with unit, timeframe and source, 2-3 lines of story, a real photo or screenshot, a link to the full study.
- **Slop risk:** "3x faster" with no baseline; a case study that cannot name its customer.
- **Saturation:** medium
### Stats band
- **Use when:** 2-4 real, sourced numbers that matter to the buyer (uptime linked to the status page, money processed, active customers).
- **Build:** each figure with unit, period and source, in tabular figures, one size step below the page's focal element, inside a section rather than floating alone.
- **Slop risk:** the decorative strip of "10k+ users, 99.9% uptime, 24/7 support" (rule 9). Still legitimate when every number is sourced and dated.
- **Saturation:** high
### Compliance strip
- **Use when:** regulated buyers (health, finance, public sector) need certifications before they engage.
- **Build:** the real certifications with their scope, linked to the security or trust page, placed near the CTA or the pricing.
- **Slop risk:** a row of unearned seals; padlock icons as decoration.
- **Saturation:** low

## Pricing patterns

### Three tiers, one recommended
- **Use when:** there really are three plans for three customer sizes and one of them fits most visitors.
- **Build:** subgrid so price, feature and CTA rows align across tiers; recommend through border and position, with a "Recommended" label only if true (rule 1); prices in tabular figures with consistent decimals; an annual toggle only when both prices exist.
- **Slop risk:** the stock SaaS trio with a glowing middle card and a "Most popular" pill on an invented plan. Still legitimate when the tiers are the real price list.
- **Saturation:** high
### Single price
- **Use when:** one plan or one product, where any tier structure would be invented.
- **Build:** one large price with currency, unit and billing period, the inclusions as a two-column list, one CTA, and the refund or cancellation terms in one line.
- **Slop risk:** inventing extra tiers so the page looks complete.
- **Saturation:** low
### Usage or seat calculator
- **Use when:** the price depends on volume or seats and a static table would hide the real cost.
- **Build:** typed numeric inputs paired with sliders, a live total and per-unit price in tabular figures, a line-item breakdown, a link to the full rate table.
- **Slop risk:** a total whose width jumps as digits change (rule 18); a slider that only works by dragging.
- **Saturation:** low
### Plan comparison matrix
- **Use when:** buyers compare plans feature by feature, as procurement does.
- **Build:** a real `<table>` with a sticky header row and first column, grouped rows with group headings, words instead of icons where nuance matters, plan CTAs in the sticky header.
- **Slop risk:** forty rows of check marks; icons without text alternatives.
- **Saturation:** medium
### Enterprise row
- **Use when:** enterprise terms are negotiated alongside public self-serve plans.
- **Build:** a full-width row below the tiers listing the concrete differences (SSO, SLA, invoicing, data residency) and one "Talk to sales" CTA, worded the same everywhere (rule 10).
- **Slop risk:** a fourth card reading "Custom" with a vague list, competing with the real tiers.
- **Saturation:** medium

## CTA patterns

### Closing color band
- **Use when:** a long page needs a final chance to act and the band's color is part of the brand.
- **Build:** a full-bleed band in the brand color or a deep neutral that restates the specific outcome, with the same CTA label as the hero.
- **Slop risk:** the stock ending: purple-to-blue gradient, "Ready to get started?", two buttons (rules 9, 10 and 11). Still legitimate with a brand color, specific copy and one button.
- **Saturation:** high
### Inline next step
- **Use when:** a section has just settled a doubt (security, price, integration) and the visitor may be ready right there.
- **Build:** a text link or secondary button inside the section, after the evidence, using the page's single label for that intent.
- **Slop risk:** a CTA after every section, each worded differently.
- **Saturation:** low
### Form in the page
- **Use when:** the conversion is a short form (waitlist, a demo request with 2-3 fields, contact).
- **Build:** visible labels, the right input types and autocomplete, inline errors, a success state that replaces the form in place.
- **Slop risk:** an email field whose placeholder is its only label; a "Submit" button (rule 10).
- **Saturation:** low
### Sticky action bar
- **Use when:** long product or pricing pages on mobile, where the primary action scrolls out of reach.
- **Build:** a bottom bar with the price and one CTA that appears once the in-page CTA leaves the viewport, padded for safe areas, at `--z-sticky`, never covering a focused field.
- **Slop risk:** a sticky header, sticky bar, cookie banner and chat bubble together leaving a slit of content.
- **Saturation:** medium
### Choice of path
- **Use when:** two real intents meet at the end (self-serve or sales, buyer or seller).
- **Build:** two differently labeled options side by side, visibly ranked with one primary.
- **Slop risk:** two buttons with the same intent, such as "Get started" and "Sign up free" (rule 10).
- **Saturation:** low

## Navigation patterns

### Inline top bar
- **Use when:** a site or small app with 3-6 top-level destinations.
- **Build:** 56-72px tall with the logo, inline links and one primary CTA on one line at 1024 (`_archive/retired/design-taste-frontend/SKILL.md` section 4.7); `aria-current="page"` plus a visible current state; a menu button below the width where the links fit.
- **Slop risk:** vague labels ("Solutions", "Resources") over thin pages; two CTAs with the same intent.
- **Saturation:** low
### Floating glass pill
- **Use when:** a brand page whose full-bleed visual hero needs a detached bar that stays legible over imagery.
- **Build:** a near-solid background tested for contrast over every section it passes, not blur alone, with the same links and height as an inline bar.
- **Slop risk:** the current "premium" tell: rounded pill, backdrop blur, centered links, on every site (the anti-default failure mode in `core-design/unslop/SKILL.md`). Still legitimate over an image-led hero when contrast holds at every scroll position.
- **Saturation:** high
### Mega menu
- **Use when:** large sites where seeing second-level pages at once saves a level of clicking [S10].
- **Build:** a disclosure button that opens on click or Enter (not hover only), grouped link columns with headings, Escape to close, a short delay before closing when the pointer leaves.
- **Slop risk:** a mega menu for a six-page site; promo images crowding out the links.
- **Saturation:** medium
### Menu button only
- **Use when:** narrow viewports, or apps where navigation is secondary to the task.
- **Build:** a button labeled "Menu" (or carrying an `aria-label`), a full-height panel with focus management, the current page marked.
- **Slop risk:** hiding desktop navigation: in NN/g's study, hidden navigation on desktop was used in 27% of cases against 48-50% for visible or combined navigation [S11].
- **Saturation:** medium
### Bottom tab bar
- **Use when:** mobile apps or app-like web with 3-5 primary destinations visited repeatedly (row 10 of `core-design/ui-ux-pro-max/data/app-interface.csv`).
- **Build:** 3-5 items with icon and text label, 44px targets, safe-area padding, the current tab marked.
- **Slop risk:** six or more tabs; icon-only tabs.
- **Saturation:** low
### Docs rails
- **Use when:** documentation, guides and long reference pages.
- **Build:** grouped nav on the inline start, the article at 60-75ch, a sticky "On this page" index on the inline end (`templates/docs-page/SKILL.md`), `scroll-margin-top` on headings, the nav as a disclosure at 390.
- **Slop risk:** two rails around a page with three headings.
- **Saturation:** low

## Footer patterns

### Minimal legal row
- **Use when:** small sites, single-product pages, apps.
- **Build:** one wrapping row with the legal entity and year, privacy, terms and contact; one labeled email field only if a newsletter actually exists.
- **Slop risk:** padding it with filler columns or icons for social accounts nobody runs.
- **Saturation:** low
### Sitemap footer
- **Use when:** sites with enough pages (roughly 20 or more) that the footer works as secondary navigation.
- **Build:** 3-5 grouped link columns with headings, then the legal row; link text at 4.5:1 (rule 15).
- **Slop risk:** five columns for a six-page site; pale links; version strings and local-time strips (rule 13). Still legitimate when every link leads to a real page.
- **Saturation:** high
### Contact and hours
- **Use when:** businesses with a physical place (restaurants, clinics, shops, venues).
- **Build:** the address with a map link, opening hours as a small table in tabular figures, a `tel:` link, the booking CTA.
- **Slop risk:** an atmospheric city-and-clock strip for a business with no place (rule 13).
- **Saturation:** low
### Oversized wordmark footer
- **Use when:** a brand whose wordmark is strong enough to close the page as a visual moment.
- **Build:** the real wordmark at large scale inside the footer, with the functional links above it and still usable.
- **Slop risk:** a giant cropped wordmark is now a template ending on studio and startup sites. Still legitimate when the mark is the real logo and the links stay first.
- **Saturation:** high

## App layout patterns

### Sidebar shell
- **Use when:** apps with 5-12 top-level areas used daily.
- **Build:** a 220-260px sidebar (`templates/dashboard/SKILL.md`) collapsible to icons with tooltips, the content region with its own header, `grid-template-columns: auto minmax(0, 1fr)`.
- **Slop risk:** the shell is a convention and familiarity helps; the risk is filling it with a stock dashboard instead of the user's real job.
- **Saturation:** low
### Top bar shell
- **Use when:** apps with 2-5 areas, editors and consumer tools where horizontal space is precious.
- **Build:** a 48-56px bar with area links, search and account, and the content full width below.
- **Slop risk:** eight areas squeezed into the bar.
- **Saturation:** low
### Command palette
- **Use when:** power-user apps with many objects and actions, where keyboard users want to jump.
- **Build:** Ctrl or Cmd+K opens a combobox with a labeled input and grouped results, recent items first, shortcuts in `<kbd>`; every action stays reachable through visible UI.
- **Slop risk:** the palette as the only path to features; a palette in a three-screen app.
- **Saturation:** medium
### Split view
- **Use when:** editing with live preview or comparing two things (markdown and output, an email builder, a diff).
- **Build:** two panes with a keyboard-operable resizable separator, the ratio remembered, tabs instead of panes at narrow widths.
- **Slop risk:** a second pane that repeats the first.
- **Saturation:** low
### Master-detail
- **Use when:** users scan a list and inspect one item at a time (mail, tickets, files, contacts).
- **Build:** a 280-400px list with a selection state and a detail pane filling the rest, separate screens with back navigation at 390, the selected id in the URL.
- **Slop risk:** opening details in a modal, which hides the list the user is working through.
- **Saturation:** low
### Canvas and panels
- **Use when:** creation tools (design, diagrams, maps) where the canvas is the work.
- **Build:** the canvas fills the viewport, tools sit on one edge, a collapsible properties panel on the other, zoom has keyboard shortcuts, and panels never cover the selection.
- **Slop risk:** floating glass panels over a dotted grid as decoration.
- **Saturation:** low
### Triage inbox
- **Use when:** users work a stream of items down to zero (support, moderation, approvals).
- **Build:** dense rows with status, source, subject and age, bulk selection, keyboard shortcuts with a visible reference, an empty state that confirms zero in plain words.
- **Slop risk:** card rows so tall that five items fill the screen; celebration animations at zero.
- **Saturation:** low
### Settings
- **Use when:** user or workspace configuration.
- **Build:** section navigation on the side (or tabs for 3-5 groups), each group a Stack of label, control and help text at 60-75ch, instant toggles kept apart from fields saved with a button, destructive actions grouped apart with confirmation.
- **Slop risk:** every setting in its own card; instant toggles and Save-button fields mixed in one group.
- **Saturation:** low
### Board
- **Use when:** work moves through 3-6 fixed states that a team discusses (`templates/kanban-board/SKILL.md`).
- **Build:** columns with counts, cards with title, assignee and date, drag and drop plus a "Move to" menu as the non-drag alternative, horizontal scroll with a visible cue at narrow widths.
- **Slop risk:** drag as the only way to move cards; a board for data that is really a table.
- **Saturation:** medium
### Metrics home
- **Use when:** users decide from 3-5 metrics they check daily, each with a comparison period.
- **Build:** each metric with its delta and named comparison period, one primary chart chosen with `core-design/ui-ux-pro-max/data/charts.csv`, a table of the items that need action, skeletons shaped like the final layout.
- **Slop risk:** the template home of four KPI cards with green arrows, an area chart and "Recent activity", whatever the product does. Still legitimate when those are the metrics the user acts on.
- **Saturation:** high

## Layout family rotation

Families for the wireframe's FAMILY field: Statement (type-led, single column), Split (two columns with different jobs), Full-bleed media, Ranked grid (one large, several small), Peer grid (equal items such as logos or a gallery), List or table, Sequence (steps, sticky media, timeline), Interactive (demo, calculator, explorer), Proof (quote, case, stats), Form.

- **How many.** A page with N sections uses at least half as many families, rounded up, so 8 sections need 4 or more (consistent with `_archive/retired/design-taste-frontend/SKILL.md` section 4.7). Adjacent sections never share a family; Split appears at most twice per page and Peer grid at most once.
- **Widths rotate too.** At least one section breaks the content width (breakout or full bleed) and at least one sits at reading measure.
- **The default order.** Hero, three features, logos, testimonials, pricing, FAQ, CTA band is the sequence encoded in rows 1 and 14 of `core-design/ui-ux-pro-max/data/landing.csv`, in `templates/saas-landing/SKILL.md` and in the rhythm notes of `templates/web-prototype/references/layouts.md`. Following it unchanged is what makes a page read as generated, so use those files for structure and markup, not for order.
- **Breaking it.** Write the visitor's questions in the order this audience asks them (from the brief's who and job lines), order the sections by those questions, then fill in DEFAULT-ORDER MATCH. At 5 of 7 or more, change at least two decisions: move proof beside the claim it supports, fold features into a demo, answer FAQ items inline where each doubt arises, drop the closing band.
- **Sample orders.** Each fails when its condition is false.
  - Demo first (live demo, what just happened, integrations, pricing, docs): tools whose value shows in one try.
  - Problem led (the problem in customer words, the fix, proof from that customer, how it works, CTA): buyers who already feel the pain.
  - Proof led (one customer's sourced outcome, how they got it, walkthrough, pricing): risk-averse and regulated buyers.
  - Catalog led (products, filters, one story, delivery and returns, reviews): commerce and menus.
  - Letter (one argued narrative with breakouts and a single CTA): launches and founder-led brands with something to say.
  - Utility first (booking or search widget, then hours, location, policies): venues, travel and services.

## Responsive rules and touch targets

- Write the 390 arrangement first, then widen with `min-width` queries; add a breakpoint where the render breaks, not at device names.
- Check 390, 820 and 1440 with `core-design/unslop/scripts/shoot.mjs`, plus 320: content must reflow at 320 CSS px without scrolling in two directions; data tables are exempt but still get a scroll container [S12].
- State the stack order for every multi-column section. If the visual order must differ from the source order, change the source order rather than using `order`, so focus order and reading order match.
- Components respond to their container (container queries) and page structure to the viewport (media queries). Brand pages: fluid type and section gaps with `clamp()`. Product UI: fixed rem steps, with structural changes such as collapsing the sidebar or switching the table (`core-design/impeccable/reference/product.md`; `core-design/impeccable/reference/adapt.md`).
- Full-height sections use `min-block-size: 100dvh`, not `100vh`, and only when the content fits. Every image gets `width` and `height` or an `aspect-ratio` so nothing shifts; change the crop with `<picture>` when the subject would be lost.
- Wide tables: a labeled scroll container with a sticky first column, or stacked records only when rows are independent of each other.
- Sticky elements: keep their total height small on phones and set `scroll-padding-top` to the sticky header's height, so a focused element is never hidden behind it (WCAG 2.4.11) [S13].
- Switch the top bar to a menu button at the width where its links stop fitting on one line.
- Nothing essential depends on hover, since touch screens have none (row 11 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv`).
- Headings get `text-wrap: balance` and prose `text-wrap: pretty`; balancing only works on short blocks, so keep it off paragraphs [S14]. Check every width for single-word last lines (rule 16).
- **Touch targets.** WCAG 2.2 AA (2.5.8) asks for 24x24 CSS px, or spacing such that a 24px circle centered on each small target does not touch another target or circle, with exceptions for inline text links, an equivalent control elsewhere, browser-drawn controls and essential cases [S15]. The AAA criterion (2.5.5) asks for 44x44 [S16]. Platform guidance is 44x44pt on Apple and 48x48dp on Material (summarized in `core-design/ui-ux-pro-max/SKILL.md`). Build primary touch controls (buttons, tabs, nav items, form controls) at least 44px tall on touch layouts; dense desktop tables may go down to 24px with spacing; enlarge a hit area with padding or a pseudo-element instead of growing the visual (recipe in `core-design/impeccable/reference/layout.md`); keep 8px between adjacent targets (row 23 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv`).

## Repo layout sources

- `core-design/unslop/SKILL.md` (the 20 rules cited here by number) and `core-design/unslop/references/library/patterns.md` (component states, forms, data display and flows inside these layouts).
- `core-design/impeccable/reference/layout.md`: spacing scale, hierarchy table, container query example, card-monotony fixes, hit-area recipe, density params.
- `core-design/impeccable/reference/brand.md` and `core-design/impeccable/reference/product.md` (layout per register, saturated aesthetic lanes, imagery), `core-design/impeccable/reference/adapt.md` (rethinking a layout for another device instead of scaling it), `core-design/impeccable/reference/typeset.md` (vertical rhythm, measure, modular scale).
- `_archive/retired/design-taste-frontend/SKILL.md`: sections 4.3 (centered-hero bias), 4.7 (hero fit, nav height, eyebrow restraint, bento cell count, zigzag cap, family repetition), 4.9 (density, spec sheets), 4.10 (quotes), 6.F (z-index restraint) and 10 (pattern vocabulary).
- `_archive/retired/high-end-visual-design/SKILL.md` section 3.B: further layout archetypes to sample from, each with its mobile collapse.
- `core-design/ui-ux-pro-max/data/landing.csv`: 34 section orders with CTA placement; read it to see the expected order, then depart from it. `core-design/ui-ux-pro-max/data/products.csv` maps 161 product types to landing patterns, mostly Feature-Rich Showcase variants, so treat it as a list of conventions, not a decision. Query either with `python3 core-design/ui-ux-pro-max/scripts/search.py "<terms>" --domain landing` (or `--domain product`).
- `design-systems/brand-systems/<brand>/DESIGN.md`: sections 5 (Layout Principles) and 8 (Responsive Behavior) show how a real system sets widths, grids and breakpoints.
- `_archive/retired/minimalist-ui/SKILL.md` (flat asymmetric bento) and `styles/industrial-brutalist-ui/SKILL.md` section 5 (rigid modular grids, bimodal density): committed lanes, only when the brief names them.
- `templates/web-prototype/references/layouts.md` (8 section skeletons), `templates/saas-landing/SKILL.md`, `templates/pricing-page/SKILL.md`, `templates/waitlist-page/SKILL.md`, `templates/faq-page/SKILL.md`, `templates/docs-page/SKILL.md`: markup starting points, reordered per the rotation rules.
- `templates/dashboard/SKILL.md`, `templates/live-dashboard/references/layouts.md`, `templates/kanban-board/SKILL.md`, `templates/mobile-app/references/layouts.md` (6 screen archetypes): app layouts.
- `templates/wireframe-greybox/SKILL.md` and `templates/wireframe-annotated/SKILL.md` render the text wireframe as a greybox when the user wants structure first; `image-direction/imagegen-frontend-web/SKILL.md` generates one reference image per section when assets are missing.
- `_archive/retired/redesign-existing-projects/SKILL.md`: changing the layout of a live site without breaking it.

## Sources

- [S1] Josef Müller-Brockmann, Grid Systems in Graphic Design, 1981.
- [S2] Timothy Samara, Making and Breaking the Grid, 2002.
- [S3] web-features explorer, subgrid: https://web-platform-dx.github.io/web-features-explorer/features/subgrid
- [S4] MDN, CSS container queries: https://developer.mozilla.org/docs/Web/CSS/CSS_container_queries ; Frontend Masters on container queries and units: https://frontendmasters.com/blog/container-queries-and-units/ ; Baseline status summary: https://specification.website/spec/foundations/container-queries.md
- [S5] Josh W. Comeau on full-bleed layout with CSS Grid: https://joshwcomeau.com/css/full-bleed/ ; Ryan Mulligan on layout breakouts with CSS Grid: https://ryanmulligan.dev/blog/layout-breakouts/
- [S6] Heydon Pickering and Andy Bell, Every Layout: https://every-layout.dev/layouts (Sidebar: https://every-layout.dev/layouts/sidebar/ ; Switcher: https://every-layout.dev/layouts/switcher/)
- [S7] Utopia fluid space calculator: https://utopia.fyi/space/calculator/
- [S8] Rudolf Arnheim, Art and Visual Perception, 1954.
- [S9] Nielsen Norman Group on the F-shaped pattern: https://nngroup.com/articles/f-shaped-pattern-reading-web-content/ ; on text scanning patterns: https://nngroup.com/articles/text-scanning-patterns-eyetracking/
- [S10] Nielsen Norman Group on mega menus: https://www.nngroup.com/articles/mega-menus-work-well/
- [S11] Nielsen Norman Group on hidden navigation on desktop: https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/
- [S12] Deque University, 1.4.10 Reflow: https://dequeuniversity.com/resources/wcag2.1/1.4.10-reflow
- [S13] W3C, Understanding SC 2.4.11 Focus Not Obscured (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- [S14] MDN, text-wrap: https://developer.mozilla.org/docs/Web/CSS/text-wrap
- [S15] W3C, Understanding SC 2.5.8 Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- [S16] Deque University, WCAG 2.2 overview: https://dequeuniversity.com/resources/wcag-2.2
