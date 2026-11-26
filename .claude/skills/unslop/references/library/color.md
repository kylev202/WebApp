# Color library

For the colorist. Read it after the brief exists (SKILL.md step 1) and before any token is written. Nothing here is a default: the recipes are sampling pools to adapt, never palettes to paste, and every option says when it fits and when it fails.

## Contents

1. [How the colorist works](#how-the-colorist-works)
2. [Working theory](#working-theory)
3. [Roles and tokens](#roles-and-tokens)
4. [Accessibility checks](#accessibility-checks)
5. [Palette recipes](#palette-recipes)
6. [Repo palette sources](#repo-palette-sources)
7. [Color slop checks](#color-slop-checks)
8. [Sources](#sources)

## How the colorist works

Work in this order; each step constrains the next, and a skipped step is where a default slips in.

1. **Write the scene sentence.** From the brief's "who and where" line, write one sentence of physical scene: who, where, what light, what mood ("a dispatcher on a night shift, two monitors, a dark room"). Light or dark comes from that sentence, never from habit (core-design/impeccable/SKILL.md, Color & Theme). If it does not force the answer, add detail.
2. **Turn the three voice words into value before hue.** Decide the value structure: high-key (mostly light, soft steps), low-key (mostly dark) or full-range (black to white, hard steps). Mark where the darkest and lightest areas sit. A page that works in grayscale survives any hue; check a screenshot with `filter: grayscale(1)` on `html` in DevTools.
3. **Read the named reference.** If it has a folder in `design-systems/brand-systems/`, take its tokens (see Repo palette sources). Otherwise study how many hues it uses, how much area each gets, and what carries the brand: the surface, the accent, or the imagery.
4. **Pick a strategy by register** (the four steps in core-design/impeccable/SKILL.md):
   - **Restrained:** tinted neutrals plus one accent at 10 percent or less. Product UI, brand minimalism.
   - **Committed:** one saturated color carries 30-60 percent of the surface. Identity-led pages.
   - **Full palette:** 3-4 named hues, each with one job. Campaigns, illustration, data viz.
   - **Drenched:** the surface is the color. Heroes, campaigns, single statement chapters.

   Product register stays Restrained unless one screen earns more (core-design/impeccable/reference/product.md); brand register may use all four (core-design/impeccable/reference/brand.md).
5. **Choose the accent hue from the brief**, not blue or violet by reflex (rule 11). Write the reason in one clause ("ribbon red, from the typewriter reference").
6. **Sample, then decide by looking.** Pull two or three recipes from different families whose Mood matches the voice words, re-hue and re-light them for this brief, swatch them on a real screen of the page, and choose. Never ship the first recipe you read or the last project's.
7. **Write tokens, check, render.** Fill the template below, run the contrast script, then look at the screenshots. A swatch on white lies; judge every color in place [S1].
8. **Log it:** strategy, accent hue and why, and any check you kept failing on purpose.

## Working theory

**OKLCH.** `oklch(L C H)`: L is perceived lightness from 0 (black) to 1 (white), C is chroma (0 is gray; inside sRGB the ceiling is about 0.32 and depends on hue), H is the hue angle in degrees. The sRGB primaries sit near red H 29, orange H 53, yellow H 110, green H 142, cyan H 195, blue H 264, magenta H 328. Equal L steps look like equal lightness steps, which HSL cannot give you (HSL yellow and blue at "50%" look nothing alike). Peaks differ by hue: pure blue reaches C 0.31 at L 0.45, pure yellow C 0.21 at L 0.97, pure cyan only C 0.16 at L 0.91. Out-of-gamut values get clipped or mapped by the browser, so resolve every token to hex and look.

**Even ramps.** Hold H, step L evenly, taper C toward both ends. A ten-step ladder that suits most hues: L 0.97, 0.93, 0.87, 0.78, 0.68, 0.58, 0.48, 0.39, 0.31, 0.24, with C at roughly 15, 30, 50, 75, 95, 100, 90, 75, 60 and 45 percent of that hue's usable peak. Slide the peak to where the hue is strongest (yellow high, blue low). Yellows turn olive as they darken: rotate H a few degrees toward orange at the dark end. The math gets you close; your eye finishes it.

**Tinted neutrals.** Give every neutral (bg, surfaces, ink, muted ink, border) chroma 0.005-0.015 at the accent's hue so gray and brand read as one family (core-design/impeccable/reference/colorize.md). Tint toward this project's accent, never toward a stock warm or cool. Chroma-0 gray beside a saturated accent looks like it came from elsewhere.

**Harmony methods.** Pick the one the voice words ask for; each has a failure mode.
- Monochrome (one hue, vary L and C): calm and unified, strong for brands that own one color. Fails when states need to differ; give semantic states their own hues.
- Analogous (neighbors within about 30-60 degrees): moods, natural subjects. Fails into mud when every member shares one L; spread the lightness.
- Complementary (about 180 degrees apart): maximum tension for one focal point. Fails when both take equal area or equal chroma; let one dominate.
- Split-complementary (a base plus the two hues beside its complement): contrast with less vibration. Fails when all three compete to be the accent.
- Triadic (three hues 120 degrees apart): playful illustration systems. Fails on UI chrome; keep two of the three inside illustration.
- Accent on neutral (tinted neutrals plus one hue): the product default and rule 11's shape. Fails when the accent is timid (low C at mid L) and nothing leads.

**Itten's seven contrasts, used as tools** [S2]. Name the contrast you are using; it tells you what to adjust.
- Hue: distinct hues side by side. For categories, never for body text.
- Light-dark: value difference, the backbone of hierarchy and of every contrast ratio.
- Cold-warm: warm comes forward, cool recedes. Use it for depth and focus.
- Complementary: opposites intensify each other; one small complement on a large field is an accent.
- Simultaneous: a color shifts toward the complement of its neighbor, as Chevreul described [S4]; gray on orange looks bluish. Test text and icons on every background they touch.
- Saturation: one saturated color among dull ones reads loudest. This is Restrained's mechanism.
- Extension: area balances strength. Itten gives Goethe's light values (yellow 9, orange 8, red 6, green 6, blue 4, violet 3) and the inverse areas (yellow to violet 1:3, orange to blue 1:2, red to green 1:1). Brighter colors need less area.

**Albers' relativity** [S1]. One color can be made to look like two, and two like one, by changing what surrounds them. Approve a color on the bg, surface and image it will actually touch, at real size, never as an isolated chip.

**Small bright, large quiet.** Imhof's cartographic rule as presented by Tufte [S3]: strong colors work in small areas on muted grounds and become unbearable when large and adjacent. Drenched breaks it on purpose with one color and nothing loud beside it.

**60-30-10.** A starting proportion by visual weight: 60 percent dominant (bg and surfaces), 30 percent secondary (ink, borders, secondary areas), 10 percent accent. Restrained pushes the accent under 10, Committed moves the brand color into the 30 or the 60, Drenched makes it the
60. It is a first guess for the eye, not a number to measure.

## Roles and tokens

These names are what `scripts/contrast.mjs` reads. Use exactly these, nothing invented.

| Token | Job | Must reach |
|---|---|---|
| `--bg` | page background | the reference for the rest |
| `--surface` | cards, panels, inputs | ink 7:1 and ink-muted 4.5:1 on it |
| `--surface-2` | second level: sidebars, nested panels, table headers | same as surface |
| `--ink` | body text and headings | 7:1 on bg (4.5:1 is the WCAG floor) |
| `--ink-muted` | secondary text, captions, placeholders, helper text | 4.5:1 on bg and both surfaces |
| `--border` | edges of inputs, checkboxes, toggles | 3:1 on bg; mix toward bg for decorative dividers |
| `--accent` | primary action fill, links, selection, key emphasis | 3:1 on bg as a fill; 4.5:1 if links use it |
| `--on-accent` | text and icons on accent fills | 4.5:1 on accent |
| `--focus` | focus ring | 3:1 on bg and on the component it surrounds |
| `--success`, `--warning`, `--danger`, `--info` | states only, never decoration | 3:1 as icons or fills, 4.5:1 as text |

Lightness ladder, measured for low-chroma tints: on a white bg, `--ink` needs OKLCH L 0.46 or lower for 7:1, `--ink-muted` 0.56 or lower for 4.5:1, `--border` 0.66 or lower for 3:1. On a dark bg at L 0.17, `--ink` needs 0.70 or higher, `--ink-muted` 0.59 or higher, `--border` 0.49 or higher. Saturated colors drift from these numbers; compute them.

Template: fill every blank and write hex (keep the OKLCH in a comment). Hex is always inside sRGB and every tool parses it.

```css
:root {
  color-scheme: light;
  --bg:        #______; /* L 0.96-1.00, C 0-0.015 at accent hue; the brand color when Drenched */
  --surface:   #______; /* one visible step from bg: L +/- 0.02-0.04 */
  --surface-2: #______; /* a second step, same hue */
  --ink:       #______; /* L 0.15-0.30, tinted */
  --ink-muted: #______; /* L 0.42-0.52 on a light bg; check every surface */
  --border:    #______; /* L 0.55-0.64, the 3:1 component edge */
  --accent:    #______; /* hue from the brief; C 0.10 or more, or clearly dark or light */
  --on-accent: #______; /* white or ink, whichever passes 4.5:1 */
  --focus:     #______; /* the accent if it passes 3:1, else a separate high-contrast color */
  --success:   #______;
  --warning:   #______;
  --danger:    #______;
  --info:      #______;
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg:        #______; /* L 0.13-0.20, C 0.005-0.015 at the same hue; not #000 */
  --surface:   #______; /* lighter than bg: higher elevation means higher L */
  --surface-2: #______; /* lighter again */
  --ink:       #______; /* L 0.92-0.96; pure white glares in long text */
  --ink-muted: #______; /* L 0.68-0.78 */
  --border:    #______; /* L 0.50-0.58 */
  --accent:    #______; /* same hue, C down 10-25 percent, L up until 3:1 on bg */
  --on-accent: #______; /* often flips to dark ink */
  --focus:     #______;
  --success:   #______; /* states: L 0.70-0.82, lower C than in light mode */
  --warning:   #______;
  --danger:    #______;
  --info:      #______;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* repeat the dark values here */ }
}
```

Check it with `node scripts/contrast.mjs --css <tokens.css>` from `core-design/unslop/` (from the repo root: `node core-design/unslop/scripts/contrast.mjs --css <tokens.css>`). Fix every failure or write down why it stays.

**Dark mode is a remap, not an inversion.** Keep each hue and rebuild each lightness. Depth comes from lighter surfaces, not shadows (a ladder such as L 0.17, 0.21, 0.25). Cut accent chroma 10-25 percent so it does not glow, raise its L until it holds 3:1 on the dark bg, and expect `--on-accent` to flip to dark ink. Light text on dark reads heavier: drop body weight a step or open leading by 0.05-0.1 (core-design/impeccable/reference/typeset.md). Run the contrast script per theme; a passing light theme says nothing about the dark one. Inversion (white to black, same accent) gives vibrating accents and flat, depthless panels.

**Mapping other token sets.** brand-systems: `--fg` is `--ink`, `--fg-2` or `--muted` is `--ink-muted`, `--accent-on` is `--on-accent`, `--warn` is `--warning`, `--surface-warm` is `--surface-2`, the color inside `--focus-ring` is `--focus`. html-ppt themes: `--text-1` is `--ink`, `--text-2` is `--ink-muted`, `--good` is `--success`, `--bad` is `--danger`. Never leave a role as `rgba()` alpha: resolve it to a solid so its contrast is predictable.

## Accessibility checks

- **Text (WCAG 2.x 1.4.3, AA):** 4.5:1 for normal text, 3:1 for large text (24px regular or 18.66px bold and up, that is 18pt and 14pt). AAA (1.4.6) asks 7:1 and 4.5:1; aim for AAA on body ink. Placeholders, helper text, footer links and labels on buttons all count (rule 15).
- **Non-text (1.4.11):** 3:1 for anything needed to perceive a control or its state: input edges, checkbox and toggle tracks, focus rings, meaningful icons, chart marks against their neighbors. Decorative dividers are exempt, which is why `--border` and dividers are separate.
- **Never color alone (1.4.1):** links in body text get an underline, errors get an icon and a sentence, chart series get direct labels or patterns, required fields get a word or symbol. Test in grayscale and with DevTools' vision-deficiency emulation (red-green is most common).
- **Text over images:** a scrim or solid panel under every line; measure against the lightest pixels behind the text, not the average.
- **Text on color:** use a darker shade of the background's own hue, never gray.
- **States:** hover and pressed differ from rest by more than hue; disabled is exempt from contrast but must still read as disabled rather than missing.
- **Both themes, every surface:** check `--ink-muted` on `--surface-2` in dark mode, the most common silent failure.
- **APCA** (Somers' perceptual contrast model, developed for future WCAG work) is a useful second opinion for thin type and dark themes. It does not replace the WCAG 2 ratios, which remain the baseline audits use.

## Palette recipes

Sampling pools, not defaults. Choose two or three from different families whose Mood fits the voice words, re-hue (10-20 degrees) and re-light them for the brief, swatch them in place, and pick by looking. Ship one verbatim only when the brief names that exact reference. Reference names the brand or artwork whose logic the recipe borrows; hex values are this library's own unless a repo path is given.

Every recipe was checked with WCAG 2 math: `--ink` 7:1 or better on `--bg`, `--ink-muted` 4.5:1 on `--bg` and `--surface`, `--on-accent` 4.5:1 on `--accent`, `--accent` 3:1 on `--bg`, `--border` 3:1 on `--bg`. Recheck after any change, then add `--surface-2`, `--focus` and the four states yourself. Saturation rates how often AI generators already ship the look: high means use it only when its Fits line is literally true of the brief.

### Calm clinical: Braun white
- **Mood:** Appliance white, gray controls, one lit switch. Careful, exact, unhurried.
- **Strategy:** Restrained. Neutrals carry nearly everything; green appears only on the primary action, links and the active state.
- **Roles:** --bg #FFFFFF, --surface #F2F2F0, --ink #1C1D1F, --ink-muted #54575B, --border #8D9095, --accent #2E7A4E, --on-accent #FFFFFF
- **Fits:** Health, lab and measurement tools, hardware companion apps, settings-heavy product UI where trust comes from order.
- **Fails:** Brand pages that need a point of view (it reads as nothing chosen); green can be misread as success, so give success a different green and an icon.
- **Reference:** Dieter Rams' products for Braun, 1950s-1970s: neutral bodies, color only where it codes a function.
- **Saturation:** low

### Calm clinical: Corbusier ciel
- **Mood:** Pale architectural sky, cool plaster, deep ultramarine ink. Measured and airy.
- **Strategy:** Restrained, tinted. The bg carries the accent's hue at very low chroma; ultramarine marks actions and links.
- **Roles:** --bg #EEF3F8, --surface #FFFFFF, --ink #14213A, --ink-muted #46536A, --border #7C8AA0, --accent #2A45A8, --on-accent #FFFFFF
- **Fits:** Architecture and engineering firms, research institutes, calm documentation, any scene of daylight in a quiet room.
- **Fails:** Warm or appetizing briefs; blue on blue drifts toward the generic SaaS look, so keep the ultramarine deeper and more violet than #2563EB.
- **Reference:** Le Corbusier's Polychromie Architecturale (1931, 1959): pale architectural blues against deep ultramarine.
- **Saturation:** medium

### Warm mechanical: Leica red dot
- **Mood:** Black enamel, brass showing at worn edges, one red dot. Precise, tactile, a little proud.
- **Strategy:** Restrained on dark. Warm graphite neutrals; red is a small, rare signal for the primary action and live state.
- **Roles:** --bg #141312, --surface #1F1D1B, --ink #F4F1EC, --ink-muted #ADA79E, --border #6F6A63, --accent #D42A28, --on-accent #FFFFFF
- **Fits:** Camera, audio and tool brands, photographer portfolios, product pages where the object photographs well on dark.
- **Fails:** Long reading (light on dark tires); error states, because red is the brand: give danger another hue or always pair it with an icon and text.
- **Reference:** Leica M cameras: black or chrome bodies and the red dot logo.
- **Saturation:** low

### Warm mechanical: Typewriter ribbon
- **Mood:** Struck paper, black ink, a bichrome ribbon switched to red for emphasis. Plain, direct, old-office.
- **Strategy:** Restrained. Near-white paper at chroma under 0.005 (so not cream), true black ink, ribbon red only for actions and corrections.
- **Roles:** --bg #FAFAF7, --surface #FFFFFF, --ink #151515, --ink-muted #565656, --border #8E8E8B, --accent #B8222B, --on-accent #FFFFFF
- **Fits:** Writing tools, newsletters, legal and archival services, editorial products with a utilitarian voice.
- **Fails:** Playful or youthful briefs; with mono type everywhere it becomes the typewriter costume rule 4 warns about.
- **Reference:** Black and red bichrome ribbons on mid-century typewriters such as the Olivetti Lettera 22.
- **Saturation:** low

### Loud youthful: Brat lime
- **Mood:** Flat acid lime, black lowercase type. Loud, deadpan, very of its moment.
- **Strategy:** Drenched. The lime is the page; the primary action inverts to a black button with lime text.
- **Roles:** --bg #8ACE1C, --surface #9FDA45, --ink #0B0B0B, --ink-muted #22300A, --border #3B5210, --accent #0B0B0B, --on-accent #8ACE1C
- **Fits:** Music, events, drops and campaigns with a short shelf life; youth brands that want to look deliberately unpolished.
- **Fails:** Anything that must age well or carry long text; the reference is so specific that it reads as a meme quote rather than an identity.
- **Reference:** Charli XCX, Brat album cover (2024).
- **Saturation:** medium

### Loud youthful: Verge magenta night
- **Mood:** Black screen, hot magenta, white type. Fast, opinionated, media-native.
- **Strategy:** Committed on dark. Magenta carries links, rules and the primary action; at chroma 0.27 it vibrates, so never set body text in it.
- **Roles:** --bg #050505, --surface #111111, --ink #FFFFFF, --ink-muted #A6A6A6, --border #6B6B6B, --accent #FF00A8, --on-accent #050505
- **Fits:** Media, culture and tech commentary, podcasts, creator tools used at night.
- **Fails:** Calm or clinical briefs; add a second neon (cyan) and it slides into the synthwave default.
- **Reference:** The Verge (design-systems/brand-systems/theverge/tokens.css).
- **Saturation:** medium

### Luxe restrained: Hermès orange drench
- **Mood:** A whole wall of saturated orange, dark brown type, nothing else. Confident, warm, expensive by refusal.
- **Strategy:** Drenched. Orange is the surface; the primary action is a near-black pill with orange text; photography sits on it unframed.
- **Roles:** --bg #F4802F, --surface #F79650, --ink #170C05, --ink-muted #3A1A07, --border #6A300E, --accent #170C05, --on-accent #F4802F
- **Fits:** Fashion, leather and gift brands, campaign heroes, one statement page inside a calmer site.
- **Fails:** Product UI, dense forms and dashboards (no room left for states); red errors on orange are unreadable, so errors need a dark panel.
- **Reference:** Hermès orange boxes.
- **Saturation:** low

### Luxe restrained: Anodised aluminium
- **Mood:** Brushed metal, smoked glass, graphite. Cold, engineered, quietly expensive.
- **Strategy:** Restrained and monochrome. The accent is graphite used as a filled shape; hierarchy comes from value steps and material photography.
- **Roles:** --bg #ECEDEE, --surface #F8F8F9, --ink #111315, --ink-muted #4A4F55, --border #7F848B, --accent #24282C, --on-accent #FFFFFF
- **Fits:** Audio, hardware, automotive and architecture brands whose product photography supplies all the color.
- **Fails:** Without strong imagery it reads as an unstyled wireframe; links need underlines because the accent is not a hue; design-taste-frontend 4.2 offers "cold luxury" as a stock alternative, so it is becoming a reflex.
- **Reference:** Bang & Olufsen's anodised aluminium products.
- **Saturation:** medium

### Luxe restrained: Black tie gold
- **Mood:** Black lacquer, gold foil, ivory type. Opulent by formula.
- **Strategy:** Restrained on dark; gold on links, rules and the primary action.
- **Roles:** --bg #080706, --surface #151310, --ink #FFF8EA, --ink-muted #B8AE9A, --border #6E6658, --accent #C6A15B, --on-accent #080706
- **Fits:** Still legitimate when the brand already owns black and gold (a supercar marque, a casino, an awards night) and the brief says so.
- **Fails:** As the default for "luxury": AI hotel, watch and real-estate pages ship it constantly, and gold at chroma 0.10 reads beige-brown on screens with no foil to catch the light.
- **Reference:** Lamborghini (design-systems/brand-systems/lamborghini/tokens.css) and the repo's luxury style folder.
- **Saturation:** high

### Earthy: Morandi dust
- **Mood:** Chalky rose-gray, faded umber, one fired-clay red. Hushed, still, considered.
- **Strategy:** Restrained, tinted. Everything sits in a narrow value band; the clay red is the only chroma above 0.02.
- **Roles:** --bg #E6DEDC, --surface #F2EBEB, --ink #2C2725, --ink-muted #5C5350, --border #827876, --accent #934B33, --on-accent #FFFFFF
- **Fits:** Ceramics, galleries, interiors, slow retail, anything photographed in soft north light.
- **Fails:** Products that need urgency or vivid states; it borders the cream band, so keep the hue under 40 degrees and the chroma low or it turns into the beige default.
- **Reference:** Giorgio Morandi's still lifes of bottles and boxes.
- **Saturation:** medium

### Earthy: Lascaux ochre
- **Mood:** Charcoal dark, red and yellow earth pigments, torchlight. Ancient, raw, warm.
- **Strategy:** Committed on dark. Yellow ochre carries headings, illustration and the primary action; a red ochre may join as a named illustration hue only.
- **Roles:** --bg #241D18, --surface #2F2620, --ink #F1EAE0, --ink-muted #BDB2A4, --border #7D7064, --accent #D9A441, --on-accent #1A1410
- **Fits:** Outdoor, archaeology, coffee and spirits, craft food, documentaries.
- **Fails:** Corporate or clinical briefs; add brass details and a soft serif and it collapses into the warm-craft default.
- **Reference:** The Lascaux cave paintings: ochres and charcoal on limestone.
- **Saturation:** low

### Nocturnal technical: Bloomberg amber
- **Mood:** Black terminal, amber data, nothing decorative. Dense, urgent, professional.
- **Strategy:** Restrained on dark. Amber marks the primary action, focus and key figures; numbers use tabular figures (rule 18).
- **Roles:** --bg #0B0A08, --surface #171511, --ink #F2EDE4, --ink-muted #ABA497, --border #6D675D, --accent #F59E2E, --on-accent #0B0A08
- **Fits:** Trading, monitoring, logistics and ops consoles used for hours at a desk.
- **Fails:** Consumer finance and marketing pages (impeccable names terminal-native dark as the second-order fintech reflex); swap amber for #00FF41 green and it becomes the cybersecurity cliché in colors.csv rows 80 and 87.
- **Reference:** The Bloomberg Terminal.
- **Saturation:** medium

### Nocturnal technical: Warm graphite
- **Mood:** Warm charcoal, chalk-blue highlights, off-white type. Focused, low-glare, slightly analog.
- **Strategy:** Restrained on dark. Elevation comes from lighter surfaces; the pale chalk accent fills the primary button with dark text.
- **Roles:** --bg #161412, --surface #201E1B, --ink #F4F1EC, --ink-muted #A9A39B, --border #6F6963, --accent #C4DDF0, --on-accent #161412
- **Fits:** Developer tools, editors and terminals that want out of the blue-black-violet default; night-shift work tools.
- **Fails:** Brand heroes that need energy; the accent is pale, so underline links and draw focus rings in ink.
- **Reference:** Warp's warm-dark terminal UI (design-systems/brand-systems/warp/).
- **Saturation:** low

### Nocturnal technical: Linear-style dark violet
- **Mood:** Near-black, gray luminance steps, one indigo-violet. Engineered, quiet, startup-serious.
- **Strategy:** Restrained on dark; luminance steps instead of shadows; violet only on primary actions and selection.
- **Roles:** --bg #08090A, --surface #191A1B, --ink #F7F8F8, --ink-muted #8A8F98, --border #5B5F67, --accent #5E6AD2, --on-accent #FFFFFF
- **Fits:** Still legitimate for Linear itself and for products that must sit beside it as integrations.
- **Fails:** As the default for any dev or AI tool: it is one of the looks AI generators reproduce most, and with a mesh glow behind the hero it is instant slop.
- **Reference:** Linear (design-systems/brand-systems/linear-app/tokens.css); the border here is raised to 3:1 because Linear's own hairline is a divider, not an input edge.
- **Saturation:** high

### Civic trustworthy: GOV.UK plain
- **Mood:** White, near-black, link blue, a yellow focus bar. Plain, accessible, hard to misread.
- **Strategy:** Restrained. Blue marks links and the primary action (GOV.UK itself gives its start button a separate green; this recipe keeps one accent per rule 11); focus is a #FFDD00 band behind ink text.
- **Roles:** --bg #FFFFFF, --surface #F3F2F1, --ink #0B0C0C, --ink-muted #505A5F, --border #888C8F, --accent #1D70B8, --on-accent #FFFFFF
- **Fits:** Government, health, tax, utilities, any form-heavy service used by everyone, often under stress.
- **Fails:** Brand storytelling; copied wholesale outside government it borrows authority it does not have, so re-hue the accent.
- **Reference:** The GOV.UK Design System (its text, secondary text, light grey, link blue and focus yellow).
- **Saturation:** low

### Civic trustworthy: Generic SaaS blue on slate
- **Mood:** Slate-50 page, slate-900 text, blue-600 buttons. Competent and interchangeable.
- **Strategy:** Restrained; the stock Tailwind recipe (border raised to 3:1 here).
- **Roles:** --bg #F8FAFC, --surface #FFFFFF, --ink #0F172A, --ink-muted #64748B, --border #8190A5, --accent #2563EB, --on-accent #FFFFFF
- **Fits:** Still legitimate for internal tools and admin back-offices where familiarity beats identity, or when the product's existing tokens already are this.
- **Fails:** Any brand surface: #2563EB is the primary in 15 of 161 colors.csv rows and the style folders professional, simple, flat, corporate, contemporary, perspective and bento ship it; its muted ink passes at 4.55:1 with no margin.
- **Reference:** Tailwind CSS v3 default palette (blue-600, slate-50, slate-500, slate-900).
- **Saturation:** high

### Playful: Matisse cut-outs
- **Mood:** Cut paper in ultramarine, orange, leaf green and magenta on white. Joyful, hand-made, generous.
- **Strategy:** Full palette. Ultramarine is the one UI accent; orange, green and magenta are illustration and category hues that never touch controls.
- **Roles:** --bg #FFFFFF, --surface #F1F3F6, --ink #141414, --ink-muted #555555, --border #8A8A8A, --accent #2340C0, --on-accent #FFFFFF
- **Fits:** Children's learning, museums, arts festivals, consumer apps with a real illustration system.
- **Fails:** Without real illustration it is just a blue site; bright hues on buttons and badges destroy the accent's meaning (rule 11).
- **Reference:** Henri Matisse, The Snail (1953), gouache on cut and pasted paper.
- **Saturation:** low

### Playful: Cavendish yellow
- **Mood:** Wall-to-wall warm yellow, black type, cheeky illustration. Friendly, bold, a little mischievous.
- **Strategy:** Drenched or Committed. Yellow carries the hero and section bands; the primary action is a black button with yellow text.
- **Roles:** --bg #FFDB2E, --surface #FFE873, --ink #1C1A12, --ink-muted #463E10, --border #6B5E14, --accent #1C1A12, --on-accent #FFDB2E
- **Fits:** Small-business software, marketing tools, onboarding moments, campaign pages.
- **Fails:** Long reading on full yellow (glare); warnings vanish against it, so give them a dark chip and an icon.
- **Reference:** Mailchimp's Cavendish Yellow identity (2018).
- **Saturation:** low

### Retro print: Penguin bands
- **Mood:** Orange band, white band, black title. Democratic, bookish, mid-century confident.
- **Strategy:** Committed. Orange spans full-width bands (header, footer, section breaks) and fills the primary action with black text.
- **Roles:** --bg #FFFFFF, --surface #F3F3F3, --ink #1A1A1A, --ink-muted #585858, --border #8C8C8C, --accent #E8661C, --on-accent #1A1A1A
- **Fits:** Publishers, libraries, reading apps, education, podcasts about books.
- **Fails:** Luxury and clinical briefs; white text on this orange is only 3.3:1, so labels stay black.
- **Reference:** Penguin Books' tri-band covers (Edward Young, 1935).
- **Saturation:** low

### Retro print: Risograph duotone
- **Mood:** Fluorescent pink and blue inks on white stock, slight misregistration. Indie, zine, hands-on.
- **Strategy:** Full palette of two inks. Blue is the ink for all text; pink fills shapes and the primary action, with dark blue text on it.
- **Roles:** --bg #FFFFFF, --surface #FFE6F2, --ink #1D3A8F, --ink-muted #4B5A8E, --border #7D88B5, --accent #FF4FA8, --on-accent #141C4D
- **Fits:** Zines, small presses, design schools, music venues, community events.
- **Fails:** Corporate trust; real fluorescent ink sits outside the screen gamut, and pink on white (3:1) is for large shapes only, never text.
- **Reference:** Risograph-printed zines in fluorescent pink and blue ink.
- **Saturation:** medium

### Industrial: International orange
- **Mood:** Fog gray, steel, a red-orange that holds in bad weather. Engineered, civic, sturdy.
- **Strategy:** Committed. The orange carries large structural shapes and the primary action; fog gray is the ground.
- **Roles:** --bg #E7EAEC, --surface #F6F7F8, --ink #16191B, --ink-muted #4B5156, --border #80878D, --accent #B8352A, --on-accent #FFFFFF
- **Fits:** Construction, infrastructure, aerospace, engineering consultancies, apps for field crews.
- **Fails:** Soft lifestyle brands; it sits close to error red, so errors need an icon, a sentence and a darker red.
- **Reference:** The Golden Gate Bridge's International Orange (1937).
- **Saturation:** low

### Industrial: Cat yellow
- **Mood:** Machine yellow on black, hazard-stripe energy. Heavy, safe, built to last.
- **Strategy:** Committed on dark. Yellow carries the primary action, active states and large numerals, with black text on yellow fills.
- **Roles:** --bg #121212, --surface #1D1D1C, --ink #F5F5F0, --ink-muted #B3B3AC, --border #6E6E69, --accent #FFC62E, --on-accent #121212
- **Fits:** Heavy equipment, logistics, fleet and fieldwork apps, workwear.
- **Fails:** Warning states collide with the accent; hazard stripes as decoration are rule 13 embellishment.
- **Reference:** Caterpillar machine yellow.
- **Saturation:** medium

### Botanical: Redouté rose
- **Mood:** Rose petals and leaf greens on clean white paper. Precise, natural, quietly romantic.
- **Strategy:** Restrained. Leaf green tints the neutrals, rose is the one accent, botanical illustration carries the rest.
- **Roles:** --bg #FCFCFC, --surface #EFF4F0, --ink #1B2420, --ink-muted #4E5B54, --border #84918A, --accent #B3395C, --on-accent #FFFFFF
- **Fits:** Florists, skincare with real botanical claims, gardening, natural history.
- **Fails:** Industrial or technical briefs; move it onto cream and it becomes the generic wellness look.
- **Reference:** Pierre-Joseph Redouté, Les Roses (1817-1824).
- **Saturation:** low

### Botanical: Forest green on cream
- **Mood:** Deep green on cream paper, near-black ink. Sustainable, organic, trustworthy by formula.
- **Strategy:** Restrained or Committed; green actions on a warm tinted ground.
- **Roles:** --bg #F4EFE4, --surface #FBF8F1, --ink #1F2A22, --ink-muted #56604F, --border #878C7D, --accent #2F5D46, --on-accent #FFFFFF
- **Fits:** Still legitimate when the brand already owns green on warm white, as Starbucks does, or the reference is a literal paper field guide.
- **Fails:** As the default for anything eco, wellness, plant-based or outdoor; impeccable's palette script names forest-green-on-cream as an AI attractor zone.
- **Reference:** Starbucks (design-systems/brand-systems/starbucks/tokens.css).
- **Saturation:** high

### Oceanic: Great Wave
- **Mood:** Prussian blue, white foam, pale sky. Powerful, graphic, cool.
- **Strategy:** Committed. Deep blue fills large planes (hero, feature bands, footer) and the primary action; white space is the foam.
- **Roles:** --bg #F1F5F8, --surface #FFFFFF, --ink #0E2236, --ink-muted #43576A, --border #7B8FA2, --accent #1E4C7A, --on-accent #FFFFFF
- **Fits:** Maritime, water, travel, insurance that wants depth instead of "trust blue".
- **Fails:** In small doses it is generic navy; it needs big blue planes and a strong image to read as a print rather than a bank.
- **Reference:** Katsushika Hokusai, The Great Wave off Kanagawa (about 1831), printed with Prussian blue.
- **Saturation:** low

### Oceanic: Hockney pool
- **Mood:** Pool aqua, flat Californian light, a pink wall, a yellow diving board. Sunny, flat, leisurely.
- **Strategy:** Full palette. Pool blue is the UI accent; pink and yellow are flat planes in illustration and section bands only.
- **Roles:** --bg #F8FAFB, --surface #E2F3F8, --ink #10232B, --ink-muted #475B64, --border #7D919A, --accent #1773A1, --on-accent #FFFFFF
- **Fits:** Hospitality, swimwear, summer campaigns, leisure booking.
- **Fails:** Winter or serious financial briefs; aqua and coral without the flatness become beach clip art.
- **Reference:** David Hockney, A Bigger Splash (1967).
- **Saturation:** low

### Desert: O'Keeffe adobe
- **Mood:** Rose adobe, bleached bone, a hard high-desert sky. Sunbaked, spare, spiritual.
- **Strategy:** Restrained, tinted. The ground carries a rose tint at hue under 40 degrees, outside the cream band; sky blue is the accent.
- **Roles:** --bg #F9E2DE, --surface #FEF3F1, --ink #2A1F1B, --ink-muted #63514A, --border #90796F, --accent #2A64A0, --on-accent #FFFFFF
- **Fits:** Southwest hospitality, ceramics, retreats, landscape photography.
- **Fails:** Shift the ground toward sand (hue 60-90) and it becomes the boho terracotta default; do not add terracotta as a second accent.
- **Reference:** Georgia O'Keeffe's New Mexico paintings.
- **Saturation:** medium

### Desert: Barragán pink
- **Mood:** A sun-struck pink wall, deep shadow, a yellow plane. Bold, architectural, joyful.
- **Strategy:** Drenched. Pink is the page, deep aubergine is the primary action, yellow appears only as one large flat plane in imagery or a section band.
- **Roles:** --bg #F27AA0, --surface #F590B1, --ink #1C0711, --ink-muted #4A1428, --border #6E1F3C, --accent #3A0B22, --on-accent #FFD1E0
- **Fits:** Architecture, design festivals, hospitality, fashion campaigns that want warmth without beige.
- **Fails:** Product UI and long reading; gray text on the pink looks washed out, so use the darker pinks given.
- **Reference:** Luis Barragán, Casa Gilardi, Mexico City (1976).
- **Saturation:** low

### High-contrast editorial: Economist red
- **Mood:** Black text, white page, one red block. Authoritative, brisk, opinionated.
- **Strategy:** Restrained. Red marks the masthead block, the primary action and section keys; everything else is black on white.
- **Roles:** --bg #FFFFFF, --surface #F2F2F2, --ink #121212, --ink-muted #595959, --border #8C8C8C, --accent #D4161C, --on-accent #FFFFFF
- **Fits:** News, analysis, research publishers, policy institutes, serious newsletters.
- **Fails:** Errors share the hue (pair them with icons and text); red sale badges turn it into a retail flyer.
- **Reference:** The Economist's red masthead.
- **Saturation:** low

### High-contrast editorial: FT salmon
- **Mood:** Salmon newsprint, dark slate ink, claret accents. Financial, establishment, readable for an hour.
- **Strategy:** Restrained on a tinted ground. The tint is literal paper, which is the only reason it may sit in the warm near-white band.
- **Roles:** --bg #FCEADB, --surface #FFF6EE, --ink #262A33, --ink-muted #555B66, --border #84868C, --accent #8E1538, --on-accent #FFFFFF
- **Fits:** Financial news and research where the newspaper reference is the point.
- **Fails:** Any other brief: core-design/impeccable/SKILL.md names the warm tinted near-white body as the saturated AI default, and the FT's paper without its journalism is costume.
- **Reference:** The Financial Times, printed on salmon paper since 1893.
- **Saturation:** medium

### High-contrast editorial: IKB drench
- **Mood:** Saturated ultramarine, white type, nothing else. Absolute, artistic, unforgettable.
- **Strategy:** Drenched. The blue is the page, white the only other color; the primary action is a white button with blue text.
- **Roles:** --bg #002FA7, --surface #0A3CBC, --ink #FFFFFF, --ink-muted #CCD6F6, --border #8DA2E3, --accent #FFFFFF, --on-accent #002FA7
- **Fits:** Galleries, manifestos, launch pages, a single chapter of a longer site.
- **Fails:** Forms, data and anything with many states; use a true ultramarine so it reads as Klein, not as a default link blue.
- **Reference:** Yves Klein, IKB 191 (1962), International Klein Blue.
- **Saturation:** low

### Neon night: Nighthawks diner
- **Mood:** Dark street, pale fluorescent light spilling from a corner diner. Lonely, cinematic, warm inside cold.
- **Strategy:** Restrained on dark; the pale yellow-green is the one light source (primary action, focus, highlights).
- **Roles:** --bg #0E1A1C, --surface #172628, --ink #EDEFE6, --ink-muted #A6B0A6, --border #66716B, --accent #D9E36B, --on-accent #0E1A1C
- **Fits:** Bars, late-night food, film and literary projects, night-shift apps.
- **Fails:** Daytime or family briefs; push the green to neon with a glow and it becomes the cyberpunk default.
- **Reference:** Edward Hopper, Nighthawks (1942).
- **Saturation:** low

### Neon night: Blade Runner neon
- **Mood:** Rain-black, hot magenta and cyan signage, haze. Synthetic, dramatic, overfamiliar.
- **Strategy:** Committed on dark; magenta on actions, cyan as a second neon.
- **Roles:** --bg #07060F, --surface #12101F, --ink #F2EEFF, --ink-muted #A69FC4, --border #635C80, --accent #FF3EA5, --on-accent #07060F
- **Fits:** Still legitimate for an actual cyberpunk game, a synthwave label or a film night that names the reference.
- **Fails:** As "futuristic" for AI, crypto or dev tools; with glows, gradients and grid floors it is the synthwave template (rule 13).
- **Reference:** Blade Runner (1982).
- **Saturation:** high

### Saturated default: Purple-blue gradient
- **Mood:** White page, indigo-to-violet gradient buttons and hero text, lavender tints. "AI-powered" by reflex.
- **Strategy:** Committed gradient, the look design-taste-frontend 4.2 (the LILA rule) discourages as a default.
- **Roles:** --bg #FFFFFF, --surface #F5F3FF, --ink #1E1B4B, --ink-muted #5B5A7A, --border #8C89B6, --accent #4F46E5, --on-accent #FFFFFF
- **Fits:** Still legitimate when the brand owns violet, executed as one solid color with no gradient text, the way Stripe uses #533AFD.
- **Fails:** As the default for AI, SaaS or crypto: 26 of 161 colors.csv rows give a purple or indigo primary, gradient text fails the lint (rule 13), and indigo-500 #6366F1 with white text is 4.47:1, a quiet contrast failure.
- **Reference:** Stripe's single violet (design-systems/brand-systems/stripe/tokens.css) is the legitimate version of this hue.
- **Saturation:** high

### Saturated default: Cream, brass and espresso
- **Mood:** Warm cream paper, brass or clay accents, espresso ink, a soft serif. "Premium artisan" by reflex.
- **Strategy:** Restrained on a warm tinted ground.
- **Roles:** --bg #F5F1EA, --surface #FBF8F1, --ink #1A1714, --ink-muted #5E564C, --border #8F8473, --accent #7D5621, --on-accent #FFFFFF
- **Fits:** Still legitimate when the brand already owns it or the brief names these colors, with a reason tied to the voice words.
- **Fails:** As the default for cookware, wellness, coffee, craft or "editorial": design-taste-frontend 4.2 bans these exact hexes, the style folders warm-editorial, refined, elegant, storytelling, cafe, artistic, editorial, paper, vintage, spacious and premium ship variants, and impeccable's palette script lists claude-beige and navy-cream-with-orange as attractor zones.
- **Reference:** Claude's own site (design-systems/brand-systems/claude/tokens.css), the look impeccable's palette script calls claude-beige.
- **Saturation:** high

## Repo palette sources

**colors.csv** (`core-design/ui-ux-pro-max/data/colors.csv`): 161 product types, 19 columns (No, Product Type, Primary, On Primary, Secondary, On Secondary, Accent, On Accent, Background, Foreground, Card, Card Foreground, Muted, Muted Foreground, Border, Destructive, On Destructive, Ring, Notes). The search script matches only Product Type and Notes, so query by product type, not by mood. Its SKILL.md shows `skills/ui-ux-pro-max/...` paths; in this repo use:

```bash
python3 core-design/ui-ux-pro-max/scripts/search.py "fintech" --domain color -n 5
```

Read rows as role maps, not palettes. Nearly every value is a stock Tailwind step: #2563EB is the primary in 15 rows and #7C3AED in 14, 26 rows have a purple or indigo primary, Muted Foreground is #64748B or #94A3B8 in 160 of 161 rows, Destructive is #DC2626 in 143. Keep a row's structure (which role is dark, which carries the color) and re-hue from the brief. Map: Background to `--bg`, Card to `--surface`, Muted to `--surface-2`, Foreground to `--ink`, Muted Foreground to `--ink-muted`, Border to `--border`, Primary or Accent (pick one) to `--accent`, its On column to `--on-accent`, Ring to `--focus`, Destructive to `--danger`.

**Seed picker** (`core-design/impeccable/scripts/palette.mjs`): `node core-design/impeccable/scripts/palette.mjs --from "<brief name>"` returns one OKLCH seed from 129 curated ones, a mood line, composition rules and the attractor zones to avoid. Use it to break a reflex, keep the hue only if it fits the brief, and resolve its OKLCH to hex.

**theme-factory** (`design-systems/theme-factory/themes/*.md`): 10 themes of four named hex colors with system fonts (DejaVu, FreeSans) meant for slides and documents. They define no muted ink, border or states; treat each as a hue pair to build ramps from, and check contrast before any pair carries text.

**brand-systems** (`design-systems/brand-systems/<slug>/tokens.css`, prose in that folder's `DESIGN.md` section 2, Color Palette & Roles): real brand folders hold real values (stripe, linear-app, apple, notion, ibm, wise, spotify, theverge, wired and about 70 more); map names as in Roles and tokens. The adjective-named style folders mostly share a few stock recipes and count as saturated: warm-editorial, refined, elegant, storytelling, cafe, artistic, editorial, paper, vintage, spacious and premium are cream plus brass-brown; professional, simple, flat, contemporary, corporate, perspective and bento are #F5F8FF with #2563EB; dramatic, futuristic, sleek, mission-control and agentic pair a blue-black with #60A5FA; cosmic, neon, fantasy and totality-festival pair #070711 with #C084FC; colorful, creative, energetic, friendly, vibrant and doodle are #FFF8D7 with #FF6B00.

**html-ppt themes** (`templates/html-ppt/assets/themes/*.css`, 36 files, catalog in `templates/html-ppt/references/themes.md`): each defines `--bg`, `--bg-soft`, `--surface`, `--surface-2`, `--border`, `--text-1/2/3`, `--accent`, `--accent-2/3`, `--good`, `--warn`, `--bad`. The editor-theme ports (nord, dracula, catppuccin-latte, catppuccin-mocha, solarized-light, gruvbox-dark, tokyo-night, rose-pine) are well-tested technical ladders: borrow their neutral steps, drop the `--grad` gradients, and resolve their alpha borders to solids.

## Color slop checks

Run against the tokens and the screenshots. Each is a yes or no; any yes needs a fix or a written reason.

- The accent hue is blue (H 230-270) or violet (H 270-310) and the brief did not ask for it.
- A gradient on text, or a purple-to-blue or pink-to-violet gradient on buttons or the hero (rule 13).
- The body bg sits in the cream band (OKLCH L 0.84-0.97, C 0.008-0.06, H 40-100) without a literal paper reference (core-design/impeccable/SKILL.md). Token names like `--cream`, `--paper`, `--sand`, `--bone`, `--linen` or `--parchment` are the same tell.
- More than one saturated hue across buttons, links, badges and chart series (rule 11).
- Neutrals at chroma 0 beside a saturated accent, or tinted toward a different hue than it.
- `--ink-muted` under 4.5:1 anywhere, especially on `--surface-2` and in dark mode (rule 15).
- Gray text on a colored background.
- Glow, neon shadow, mesh orbs or blurred color blobs behind content (rule 13).
- Semantic colors used as decoration (green for "growth" headings, red for "hot" badges).
- Dark mode made by inversion: pure black, pure white, unchanged accent.
- Role colors left as `rgba()` alpha instead of resolved solids.
- Raw hex in components instead of tokens (rule 5), or charts on a different palette than the page.
- The palette can be guessed from the category alone (fintech navy and gold, wellness sage and cream), the category-reflex check in core-design/impeccable/SKILL.md.
- The same recipe family as the previous project.

## Sources

- [S1] Josef Albers, Interaction of Color, 1963.
- [S2] Johannes Itten, The Art of Color, 1961.
- [S3] Edward Tufte, Envisioning Information, 1990.
- [S4] Michel Eugène Chevreul, The Principles of Harmony and Contrast of Colours, 1839.

Repo files are cited by path and were read for this library. No web source could be opened while it was written, so none is cited; WCAG criteria are named by number for you to verify.
