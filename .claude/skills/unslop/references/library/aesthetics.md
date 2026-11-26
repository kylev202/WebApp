# Aesthetic library

The art director's sampling pool: 63 visual directions, each with lineage, real references, fit, signature moves, a token sketch, slop risk, saturation and repo resources. Nothing here is a default. The brief chooses, and the 20 rules in `core-design/unslop/SKILL.md` override any move listed below.

## Contents

- How the art director uses this file
- Catalog (63 entries, one `###` heading each)
- Saturation notes
- Sources

Families, for sampling across lineages (names match the `###` headings):

- Print and art history: Constructivism, Bauhaus, Art Deco, Swiss International, Mid-century modern, Retro 70s, Memphis, Postmodern new wave
- Hand-made and counterculture: Risograph zine, Collage, Hand-drawn, Craft heritage
- Publishing: Editorial magazine, Newspaper, Warm editorial minimal, Document-like, Academic
- Luxury, film and photo: Luxury fashion, Quiet luxury, Cinematic, Documentary photo-led
- Interface eras: Retro computing, Pixel, Skeuomorphic, Frutiger Aero, Y2K, Vaporwave, Flat, Material, Corporate Memphis, Glassmorphism, Neumorphism, Claymorphism, Gradient mesh, Bento product, Brutalist web, Neo-brutalism, Dark SaaS precision, Soft premium SaaS, AI-native assistant
- Screens and futures: Data-dense terminal, HUD sci-fi, Cyberpunk, Solarpunk, Immersive 3D, Kinetic type, Dithered low-tech
- Cultures: Japanese minimal, Scandinavian, Script-native bilingual
- Industries and moods: Civic, Enterprise systematic, Industrial, Transit wayfinding, Architectural, Sports, Food warm, Organic natural, Botanical, Playful kids, Gamified, Maximalist, Monochrome

## How the art director uses this file

**Start from the brief, not the catalog.** Open this file only after the five brief lines from unslop step 1 exist (who and where, job, three voice words, named reference, real content). Without them you will pick by habit.

**1. Shortlist by fit, then by failure.** Pull 6-8 entries whose `Fits` clause matches the audience, the job and the content you actually have. Strike every entry whose `Fails` clause describes this brief, for example an image-led direction when no real photography exists.

**2. Develop three divergent directions.** Draw them from at least two families and make them differ on at least three axes: type class, palette strategy, density, radius, imagery mode, motion stance. Light, dark and colorful versions of one layout are one direction, not three. For each direction write:

- a name and a one-line thesis built from the voice words ("calm, clinical, careful" becomes "a pharmacy label, not a spa");
- the named reference it moves toward;
- the entry's token sketch rewritten for this brand;
- the one signature move a stranger would recognize;
- two moves from the entry you refuse, and why.

**3. Never pick by habit.** A direction you used on the previous project, or one rated `high`, needs a written reason tied to the brief before it can be one of the three. At least one of the three is rated `low` or `medium`. If all three feel safe, replace the safest one.

**4. Choose and record.** The creative director picks one direction. Write one line on why each of the other two lost, so later passes do not drift back toward the default.

**Blending two directions.** One direction owns structure: grid, density, type hierarchy and radius. The other lends at most two signature moves, such as its palette strategy, its imagery treatment or its motion stance. Name the blend in five words or fewer ("Swiss grid, Risograph color"). Density and radius must agree, or you state the logic (rule 14). Test by deleting the borrowed moves: the page should still stand. If it collapses, you built a collage of costumes.

**Make it the brand's own, not a costume.** A costume uses every move of a movement at full strength. A brand keeps the two or three moves that carry its message and translates them into its own material.

- Swap period props for real ones: the product's real model numbers instead of fake plate numbers, a real sequence instead of decorative "01 / 02 / 03" (rule 13).
- Take the accent from the brand or brief (rule 11), never from the movement's stock palette: Constructivist red only if the brand is red.
- Typefaces named under Lineage or Real references are history, not picks. Choose fonts by browsing for the voice words (unslop step 2).
- Shoot or render the brand's own physical world in the direction's manner (rule 6). A direction is a lens, not a stock-photo filter.
- Compare the result with the brief's named reference: it should feel closer to that reference than to the movement's textbook page.
- If the brand already has tokens, components or a DESIGN.md, they win (rule 5); use the catalog only for the gaps.

**Reading an entry.** `Lineage` says where the look comes from. `Real references` are makers to study, not to copy. `Fits` ends with a `Fails:` clause. `Token sketch` gives classes and strategies, never exact fonts or hex values. `Slop risk` describes how generators fake the look and names the unslop rules it collides with. `Saturation` rates how often generators produce the look unprompted in 2024-2026 (`low` rare, `medium` common, `high` reads as AI on sight). `Repo resources` are paths from the repo root.

**Repo caveats.** The one-word style folders in `design-systems/brand-systems/` (brutalism, editorial, glassmorphism, retro and similar) are thin: a palette, a font trio and generic rules, so treat them as starter tokens. Several repo skills hard-code moves the unslop rules reject, such as eyebrow pills, mono metadata, ASCII ornament, global grain and scroll fades: `_archive/retired/minimalist-ui/`, `styles/industrial-brutalist-ui/`, `templates/web-prototype-taste-brutalist/`, `templates/web-prototype-taste-editorial/`, `templates/web-prototype-taste-soft/`, `_archive/retired/high-end-visual-design/`, `design-systems/brand-systems/atelier-zero/`. Take structure and tokens from them; unslop stays the driver.

## Catalog

Every entry is a `###` name followed by the same eight lines. Keep the format; a script reads the names and the Saturation values.

### Constructivism
- **Lineage:** Russian avant-garde after 1917: artists turned to posters, books and film publicity for the new state, using diagonals, photomontage and a red and black palette [S1]; El Lissitzky's and Rodchenko's book design fed Jan Tschichold's "Die neue Typographie" [B1].
- **Real references:** El Lissitzky's "Beat the Whites with the Red Wedge" (1919) and his design of Mayakovsky's "For the Voice" (1923); Alexander Rodchenko's Dobrolet and Mosselprom advertising (1923-1925) [S1]; Vladimir and Georgii Stenberg's film posters, such as "Man with a Movie Camera" (1929).
- **Fits:** Manifestos, campaigns, unions and activist groups, film and festival programs, launches built on one argument. Fails: calm services, healthcare, luxury and anything whose voice words say "gentle"; vague copy in this style reads as propaganda.
- **Signature moves:** Type: heavy condensed sans set in blocks and on diagonals, words used as shapes; color: red and black on unbleached paper, at most one more spot color; layout: dynamic diagonals, overlapping planes, cut photomontage; imagery: high-contrast photography, cropped and angled; motion: hard cuts and slides along the main diagonal.
- **Token sketch:** Type class: condensed grotesque, two weights; palette: ink plus one brand-derived spot color on paper; radius: 0; density: medium, large type blocks against open ground.
- **Slop risk:** Generators paste a red wedge and a tilted headline onto an ordinary SaaS layout. The diagonal must organize content, rotated text that is not reading content breaks rule 13, and red is the accent only if the brand is red (rule 11).
- **Saturation:** low
- **Repo resources:** none (closest structure: `templates/poster-hero/`)

### Bauhaus
- **Lineage:** The Bauhaus school ran in Weimar (1919-1925), Dessau (1925-1932) and Berlin (1932-1933); László Moholy-Nagy's arrival in 1923 moved typography to the center, and Herbert Bayer's lowercase "universal" alphabet became its emblem [S2][B2].
- **Real references:** Herbert Bayer's universal alphabet and Bauhaus print work [S2]; Moholy-Nagy's "typophoto" layouts; Joost Schmidt's poster for the 1923 Bauhaus exhibition; Marianne Brandt's metalwork.
- **Fits:** Art and design schools, architecture and maker institutions, tools for builders, learning products that want geometry instead of cartoons. Fails: romantic or luxury brands, dense data apps, and any palette that needs nuance; the primary triad turns childish fast.
- **Signature moves:** Type: geometric sans, lowercase experiments, thick rules and bars beside type; color: red, yellow and blue with black on white; layout: asymmetric balance on a clear grid, circle, square and triangle as structural blocks; imagery: photography combined with type, products on plain ground; motion: shapes translating or rotating in exact steps.
- **Token sketch:** Type class: geometric sans, one family; palette: one brand-derived primary as the accent, the other primaries as rare structural fills; radius: 0, or full circles only; density: low to medium.
- **Slop risk:** The costume is confetti of circles and triangles around a centered headline. Shapes must carry structure (sections, numbers, navigation), and three equal primaries break rule 11.
- **Saturation:** low
- **Repo resources:** `templates/html-ppt/assets/themes/bauhaus.css`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Bauhaus")

### Art Deco
- **Lineage:** Machine-age luxury of the 1920s and 1930s in posters, architecture and ocean liners, named retrospectively after the 1925 Paris Exposition internationale des arts décoratifs [B2].
- **Real references:** A. M. Cassandre's "Normandie" poster for the French Line (1935) [S3] and his rail posters; the Chrysler Building by William Van Alen (1930).
- **Fits:** Hotels, bars, cinemas and theaters, jewelry, spirits, invitations, anything with a 1920s-30s story or a hospitality ritual. Fails: tech products without a period story, children's products, accessibility-first services; ornament at small sizes becomes noise.
- **Signature moves:** Type: tall geometric display capitals with strong stroke contrast, wide spacing on short lines only; color: black, cream and a metallic gold or one jewel tone; layout: vertical symmetry, stepped frames, sunburst and chevron geometry; imagery: streamlined machines and buildings seen from below; motion: slow symmetrical reveals.
- **Token sketch:** Type class: geometric or Didone display capitals plus a plain text face; palette: dark ground, one metallic-feeling accent from the brand, cream text; radius: 0 with stepped corners; density: low.
- **Slop risk:** Gold gradient text and fan ornaments on every section break rule 13 twice. Keep ornament to one hero frame or menu, use a flat ochre that passes contrast instead of a shine, and keep body text plain and large (rule 15).
- **Saturation:** low
- **Repo resources:** none (pairings tagged "art deco" live in `core-design/ui-ux-pro-max/data/typography.csv`; reject reflex picks per unslop step 2)

### Swiss International
- **Lineage:** The International Typographic Style grew in Zurich and Basel in the 1940s and 1950s from Ernst Keller's teaching, through Josef Müller-Brockmann, Armin Hofmann and Emil Ruder, and spread through the journal Neue Grafik from 1958 [S4][B3][B4].
- **Real references:** Müller-Brockmann's Zurich Tonhalle concert posters and "Grid Systems in Graphic Design" (1981) [B3]; Ruder's "Typographie" (1967) [B4]; Hofmann's Basel theater posters; Unimark's 1970 New York subway manual (see Transit wayfinding).
- **Fits:** Information-heavy products, cultural institutions, transport, documentation, B2B with real data; voice words like "precise, objective, legible". Fails: brands that need warmth or humor, and thin content; a grid with nothing to arrange looks empty, not Swiss.
- **Signature moves:** Type: neo-grotesque, flush left and ragged right, hierarchy from size and weight only; color: white or off-white, black, one strong accent; layout: modular grid with visible alignment, asymmetric placement, generous margins; imagery: objective photography, often black and white, cropped to the grid; motion: almost none, state changes snap or slide along grid lines.
- **Token sketch:** Type class: grotesque or neo-grotesque, one family, 3-4 sizes with large jumps; palette: neutral plus one brand accent; radius: 0; density: medium to high, governed by the grid.
- **Slop risk:** Generator Swiss is a Helvetica-like sans, a red square and a 12-column grid that nothing aligns to. Make the grid real (shared baselines and column edges, rule 17) and skip faux plate numbers and crosshair marks (rule 13).
- **Saturation:** medium
- **Repo resources:** `templates/deck-swiss-international/`, `templates/html-ppt/assets/themes/swiss-grid.css`, `styles/industrial-brutalist-ui/` (Swiss Industrial Print mode), `core-design/ui-ux-pro-max/data/styles.csv` (rows "Minimalism & Swiss Style", "Swiss Modernism 2.0")

### Mid-century modern
- **Lineage:** American and European modernism of roughly 1945-1965, when corporate identity, film titles and furniture carried European modernism to mass audiences [B2][B5].
- **Real references:** Saul Bass's titles for Hitchcock's "Vertigo" (1958), made with John Whitney's spirals, and for "Anatomy of a Murder" (1959) [S5]; Paul Rand's IBM logos and his "Thoughts on Design" (1947) [B5]; Charles and Ray Eames's furniture and films.
- **Fits:** Furniture and interiors, architecture practices, coffee and hospitality, film festivals, consumer products with an optimistic, crafted personality. Fails: hard enterprise tools, finance that earns trust through restraint, and youth brands that read it as their parents' living room.
- **Signature moves:** Type: friendly geometric or humanist sans with cut-paper display lettering; color: muted warm set (mustard, teal, tomato, olive) on cream; layout: loose asymmetric compositions, paper shapes overlapping photos; imagery: flat cut-paper illustration, silhouettes, period-true product photography; motion: jaunty stepped animation like a title card, short.
- **Token sketch:** Type class: geometric or humanist sans plus one display cut; palette: one warm brand accent plus two muted supports on cream; radius: small (2-6px), organic shapes only inside illustration; density: low to medium.
- **Slop risk:** Boomerangs and starbursts as wallpaper and the full mustard-teal-tomato set on every page. Pick one accent (rule 11) and confine the cut-paper language to one illustration system.
- **Saturation:** low
- **Repo resources:** `templates/html-ppt/assets/themes/midcentury.css`

### Retro 70s
- **Lineage:** 1970s graphics: soft heavy display type, supergraphics, earth tones and confident identity systems such as NASA's 1975 Graphics Standards Manual by Danne & Blackburn [S6].
- **Real references:** the NASA Graphics Standards Manual and its "worm" logotype, since reissued by Standards Manual [S6]; Herb Lubalin's work for ITC and its magazine U&lc.
- **Fits:** Food and drink, outdoor and travel, music, personal finance that wants warmth, small consumer brands with a real founder story. Fails: precision tools, medical, and briefs where looking current matters; the palette goes muddy on screens unless contrast is checked.
- **Signature moves:** Type: soft heavy display with tight spacing, rounded or chunky serifs, set large; color: rust, mustard, olive and brown on cream; layout: big stacked type, stripes or arcs as supergraphics, rounded rectangles; imagery: warm film photography, sun-faded color; motion: slow slides and stripe wipes.
- **Token sketch:** Type class: soft display serif or rounded heavy sans plus a neutral text face; palette: one earth-tone accent from the brand on warm cream, deep brown ink instead of black; radius: medium, one value; density: low to medium.
- **Slop risk:** A sunset-stripe badge and faux-distressed texture over everything (rule 13). Use one supergraphic per page at most, real warm photography instead of a filter, and check brown-on-cream contrast (rule 15).
- **Saturation:** medium
- **Repo resources:** `design-systems/theme-factory/themes/golden-hour.md`, `design-systems/brand-systems/vintage/` (thin tokens)

### Memphis
- **Lineage:** The Memphis Group, formed in Milan around Ettore Sottsass in December 1980, named after a Bob Dylan song, first shown in 1981 and disbanded in 1988 [S7].
- **Real references:** Sottsass's "Carlton" room divider (1981); Nathalie Du Pasquier's patterns; furniture by Peter Shire and Michele De Lucchi.
- **Fits:** Youth culture, events, toys and games, creative agencies, ice cream and snacks; loud joy with a design-history wink. Fails: finance, health, legal, B2B, and brands that cannot carry pattern without losing legibility.
- **Signature moves:** Type: bold geometric sans set straight, playful display only for titles; color: clashing brights (pink, yellow, cyan) with black; layout: collisions of simple volumes, tilted blocks; imagery: terrazzo, squiggle and laminate patterns, cut-out objects on flat color; motion: quick snaps, not bounce (rule 20).
- **Token sketch:** Type class: geometric sans; palette: one brand-led bright as the action color, pattern colors confined to illustration; radius: mixed only with a written logic (rule 14); density: medium.
- **Slop risk:** Random squiggles and dots sprinkled behind text, which is how "Corporate Memphis" got its name. Keep patterns inside defined shapes, never under body copy, and keep the action color unique (rule 11).
- **Saturation:** low
- **Repo resources:** `templates/html-ppt/assets/themes/memphis-pop.css`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Memphis Design")

### Postmodern new wave
- **Lineage:** Wolfgang Weingart's Basel experiments broke Swiss rules from inside; April Greiman carried them to Los Angeles; Emigre, founded in Berkeley in 1984 by Rudy VanderLans and Zuzana Licko and among the first journals made on the Macintosh, and David Carson's Ray Gun took them into the 1990s [S8].
- **Real references:** Emigre magazine and its type foundry, which devoted issues to Carson and Ray Gun in 1992-1993 [S8]; April Greiman's "Does It Make Sense?" issue of Design Quarterly (1986); David Carson's Ray Gun spreads.
- **Fits:** Music, art schools, festivals, type foundries, culture magazines, portfolios where layering is the message. Fails: transactional or task-driven products and accessibility-critical services; illegibility is a feature only when reading is optional.
- **Signature moves:** Type: mixed families and sizes in one composition, layered and overlapping, spacing as expression; color: off-register overprints, acid accents on muted grounds; layout: deconstructed grids, type and image collage, text on paths; imagery: scans, video stills, photocopies; motion: jump cuts and layered parallax that stays readable.
- **Token sketch:** Type class: a neutral grotesque plus one eccentric display, with written rules for which goes where; palette: two inks plus a neutral; radius: 0; density: high in compositions, low in reading areas.
- **Slop risk:** Chaos without a system reads as broken. Keep the layering for openers, set body text in one clean column at 60-75ch (rule 16), and hold contrast on every overlap (rule 15).
- **Saturation:** low
- **Repo resources:** none

### Risograph zine
- **Lineage:** Riso Kagaku's stencil duplicators, built for schools and offices, were taken up by independent publishers in the 2000s; misregistration, grain and overprinting spot inks became the look of the small-press revival [S9].
- **Real references:** the Riso-printed zines and art books of the art-book fair circuit, such as Printed Matter's NY Art Book Fair; Riso Kagaku's machines themselves, whose one-drum-per-color process defines the look [S9].
- **Fits:** Independent publishers, bookshops, community events, small food and drink brands, illustrators, education side projects; voice words like "handmade, local, generous". Fails: premium finance and enterprise, brands needing photographic accuracy, and dense UI where overprint texture cannot survive.
- **Signature moves:** Type: chunky grotesque or typewriter-like faces at large sizes, little text; color: two or three spot inks (fluorescent pink, blue, yellow) overprinting into new colors; layout: poster-like pages, intentional misregistration of a few pixels; imagery: halftoned or grainy photos, simple illustration; motion: little or none.
- **Token sketch:** Type class: grotesque or slab plus a plain text face; palette: two spot colors, one of them the brand accent, overprinted with multiply; radius: 0 or small; density: low.
- **Slop risk:** A grain overlay across the page plus a pink and blue duotone is the shortcut, and rule 13 rejects global grain. Texture images and display type only; controls stay flat and crisp, and spot inks stay out of body text.
- **Saturation:** low
- **Repo resources:** none (halftone techniques are described in `styles/industrial-brutalist-ui/`)

### Collage
- **Lineage:** Dada photomontage (Hannah Höch, John Heartfield) and Kurt Schwitters's Merz collages, then punk's cut-and-paste, including Jamie Reid's ransom-note lettering for the Sex Pistols' "God Save the Queen" (1977) [S10][B2].
- **Real references:** Höch's "Cut with the Kitchen Knife" (1919-1920); Reid's Sex Pistols artwork [S10]; Quentin Fiore's layouts for "The Medium Is the Massage" (1967) [B6].
- **Fits:** Culture and music, editorial features, activist campaigns, fashion lookbooks, brands whose story is assembled from many sources. Fails: data products, onboarding flows, any interface where users must find a control fast.
- **Signature moves:** Type: cut-out letters and mixed sources for display only, a calm text face for reading; color: paper whites, newsprint and one or two strong inks; layout: layered torn fragments, overlapping cutouts, tape seams; imagery: photographs with hard or torn edges, scans of real paper; motion: pieces dropping into place one by one.
- **Token sketch:** Type class: neutral text face plus collage display assets; palette: paper neutrals plus one brand ink; radius: 0, edges come from the cut; density: medium in collages, low elsewhere.
- **Slop risk:** Generators fake collage with CSS rotations and drop shadows on stock photos, decoration that explains nothing (rule 13). Build collages from the brand's own photos and documents (rule 6) and keep navigation, forms and body text out of the collage layer.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/atelier-zero/` (collage system; its italic-serif headline mixing, rotated side notes and global paper noise conflict with rules 3 and 13), `core-design/ui-ux-pro-max/data/styles.csv` (row "Anti-Polish / Raw Aesthetic")

### Hand-drawn
- **Lineage:** Illustrated packaging, children's books, comics and sketchnotes; on the web, illustration-led brands use drawn marks to signal a human voice.
- **Real references:** Oatly's handwritten packaging; PostHog's hand-drawn hedgehogs; Excalidraw's sketchy diagrams (rendered with rough.js); Randall Munroe's xkcd explainers.
- **Fits:** Education, explainers, indie tools, warm wellness without pastel blobs, products whose founders draw, diagrams that should feel provisional. Fails: luxury, security and finance, where it reads as unserious, and teams without one consistent illustrator.
- **Signature moves:** Type: a clean text face, hand lettering only for short notes and titles; color: ink on paper plus one marker color; layout: arrows and annotations that point at real product details; imagery: one hand and one line weight across all drawings; motion: draw-on strokes for diagrams only.
- **Token sketch:** Type class: humanist sans or friendly serif; palette: ink, paper and one marker accent from the brand; radius: irregular inside drawings, one small radius on controls; density: low to medium.
- **Slop risk:** Hand-drawn SVG icons beside a stock icon set break rule 12, and comic-font body text breaks reading. Draw illustrations, not interface icons, and keep controls in one icon family.
- **Saturation:** low
- **Repo resources:** `templates/wireframe-sketch/`, `templates/frame-flowchart-sticky/`, `design-systems/brand-systems/doodle/` (thin tokens), `design-systems/brand-systems/posthog/`

### Craft heritage
- **Lineage:** Letterpress, wood type and workwear labels, descended from the Arts and Crafts movement; Nashville's Hatch Show Print, founded in 1879, still prints posters from its wood type and has run as a non-profit working museum since 1986 [S11].
- **Real references:** Hatch Show Print posters [S11]; William Morris's Kelmscott Press books (1891-1898); Filson's workwear labels (the company dates from 1897).
- **Fits:** Makers, breweries, distilleries, workwear, outdoor goods, bookshops and local institutions with real history. Fails: brands without real heritage, where it becomes fake vintage, and digital-first products that must feel current.
- **Signature moves:** Type: wood-type display, slab serifs and condensed gothics at poster sizes, a readable text face; color: red, black or blue ink on uncoated paper, kraft and cream; layout: centered poster stacks and labels, borders as frames; imagery: process photos, tools, hands, the workshop; motion: none or very little.
- **Token sketch:** Type class: slab or wood-type display plus a text serif; palette: one ink accent from the brand on paper tones; radius: 0; density: medium.
- **Slop risk:** "Est. 2024" badges, fake distress textures and invented founding stories (rules 1, 9 and 13). Show the real workshop, real dates and real makers.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/vintage/` (thin tokens), `design-systems/brand-systems/paper/` (thin tokens), `image-direction/canvas-design/` (poster output)

### Editorial magazine
- **Lineage:** Magazine art direction from Alexey Brodovitch at Harper's Bazaar (1934-1958), who composed spreads as single images with white space as material [S12], to Richard Turley's Bloomberg Businessweek (2010-2014), where the grid exists to be broken by graphics and covers aim to surprise [S13].
- **Real references:** Harper's Bazaar under Brodovitch [S12]; Bloomberg Businessweek under Turley [S13]; WIRED; The New York Times Magazine.
- **Fits:** Long-form publishers, brands with real stories and photography, annual reports, cultural institutions, newsletters with a point of view. Fails: tools where users act rather than read, and briefs that are not magazine-shaped, where it reads as borrowed prestige.
- **Signature moves:** Type: a display face with character at large sizes, a sturdy text face, decks and captions as real hierarchy; color: ink and paper, with color from photography and one accent; layout: spreads, varied column widths, pull quotes and crops that change rhythm per story; imagery: commissioned or real photography art-directed per story; motion: restrained transitions between stories.
- **Token sketch:** Type class: contrasting display plus text serif or sans; palette: ink and paper plus one accent; radius: 0; density: medium, varied by section.
- **Slop risk:** The generator version is an italic serif headline, a tiny mono kicker, hairline rules and no photography (see Warm editorial minimal). Earn the look with real stories and images, vary layouts between sections, skip the eyebrow on every section (rule 2), and set pull quotes by size and space, since thick left borders trip the lint's side-stripe check.
- **Saturation:** medium
- **Repo resources:** `templates/article-magazine/`, `templates/magazine-poster/`, `design-systems/brand-systems/wired/`, `design-systems/brand-systems/publication/` (thin tokens), `templates/html-ppt/assets/themes/magazine-bold.css`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Editorial Grid / Magazine")

### Newspaper
- **Lineage:** Broadsheet and Berliner news design: column grids, headline weight as news value, datelines and rules; the Guardian's 2005 Berliner redesign, led by Mark Porter, commissioned the Guardian Egyptian family from Paul Barnes and Christian Schwartz [S14].
- **Real references:** the Guardian's 2005 redesign and Guardian Egyptian [S14]; the Financial Times on its salmon paper; The New York Times graphics desk.
- **Fits:** News, local journalism, newsletters, research digests, status pages and changelogs with many items of unequal importance. Fails: single-product marketing pages with little content; the look needs volume and real hierarchy.
- **Signature moves:** Type: a robust headline face in several weights, a text face built for small sizes, bylines and datelines as metadata; color: paper, ink and one section color; layout: multi-column grid, story weight shown by headline size and column span, thin column rules; imagery: news photography with credits, charts with sources; motion: none beyond live-update cues.
- **Token sketch:** Type class: headline serif or grotesque plus a text serif; palette: neutral paper plus one accent for links or breaking news; radius: 0; density: high.
- **Slop risk:** Generators add fake datelines, issue numbers and an invented "Est." year on the masthead (rules 9 and 13). Every date, byline and number is real or labeled sample data, and story importance actually varies.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/wired/` (broadsheet density), `templates/frame-data-chart-nyt/`, `templates/html-ppt/assets/themes/news-broadcast.css`

### Warm editorial minimal
- **Lineage:** The 2020s SaaS adaptation of editorial design: warm off-white canvas, display serif, small mono labels and hairline rules; `core-design/impeccable/reference/brand.md` already lists this "editorial-typographic" lane as saturated.
- **Real references:** Notion's marketing pages and Anthropic's Claude pages (see the repo's notion and claude systems).
- **Fits:** Writing, knowledge and research tools whose product is text, when the brand truly is calm and literate. Fails: most other briefs, because it is the current shorthand for "tasteful"; it also fails with no imagery or product to show.
- **Signature moves:** Type: display serif headings, grotesque body, mono only for shortcuts; color: warm paper, near-black ink, one muted accent; layout: generous margins, single-column hero, hairline dividers; imagery: product screenshots or ink illustration; motion: barely any.
- **Token sketch:** Type class: serif display plus sans text; palette: warm neutral plus one accent; radius: small (4-8px); density: low.
- **Slop risk:** It is the anti-default turned default: an italic serif word in the headline (rule 3), a tracked mono eyebrow on each section (rules 2 and 4), pale gray body text on beige (rule 15), no product shown (rule 6). Use it only with a written reason and change at least two of its moves.
- **Saturation:** high
- **Repo resources:** `_archive/retired/minimalist-ui/`, `templates/web-prototype-taste-editorial/`, `design-systems/brand-systems/warm-editorial/`, `design-systems/brand-systems/notion/`, `design-systems/brand-systems/claude/`, `core-design/impeccable/reference/brand.md`

### Document-like
- **Lineage:** The plain HTML document and the printed report: content first, browser defaults or close to them, from early academic pages to essay sites.
- **Real references:** Craigslist and Hacker News (plain, dense link pages); Berkshire Hathaway's bare website; Paul Graham's essay pages.
- **Fits:** Essays, policies, documentation, internal tools, changelogs, legal and pricing pages where trust comes from plainness; developer audiences who distrust marketing. Fails: consumer brands that need desire, image-led products, and pages where plainness reads as abandonment.
- **Signature moves:** Type: one readable text face, semantic headings, real lists; color: near-black on white, classic link blue; layout: one column at 60-75ch, table of contents, footnotes; imagery: captioned figures only when they inform; motion: none.
- **Token sketch:** Type class: text serif or system sans, one family; palette: ink, paper and one link color; radius: 0; density: medium.
- **Slop risk:** The fake version adds a minimal costume (tiny gray text, huge margins, a mono date line) and loses what makes plainness work: speed and legibility. Keep text dark (rule 15), headings balanced (rule 16), and add nothing that is not content.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/kami/`, `templates/doc-kami-parchment/`, `templates/kami-landing/`, `templates/docs-page/`, `templates/pm-spec/`

### Academic
- **Lineage:** Scholarly print and its digital heirs: Donald Knuth's TeX (1978) and LaTeX papers, Edward Tufte's books on displaying evidence [B7], and interactive research articles.
- **Real references:** Tufte's "The Visual Display of Quantitative Information" (1983) [B7]; the Distill journal's interactive machine-learning articles; Our World in Data's charts; arXiv preprints set in LaTeX.
- **Fits:** Research labs, universities, think tanks, scientific tools, data-heavy explainers, policy reports. Fails: impulse consumer products and playful brands; citation apparatus on a marketing page is a costume.
- **Signature moves:** Type: scholarly text serif with true small caps, old-style figures in prose and tabular figures in tables; color: black plus one muted annotation color; layout: wide margins with sidenotes, numbered figures, footnotes, references; imagery: charts and diagrams with sources; motion: interactive figures that respond to input, nothing decorative.
- **Token sketch:** Type class: text serif plus a quiet sans for UI; palette: ink and paper plus one annotation color; radius: 0; density: medium to high.
- **Slop risk:** Fake citations, invented figures and "Fig. 1" labels on decorative images (rules 9 and 13). Number figures only when the text refers to them, and every chart cites a real source or is labeled sample data.
- **Saturation:** low
- **Repo resources:** `templates/html-ppt/assets/themes/academic-paper.css`, `templates/kami-deck/`, `templates/data-report/`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Academia (Scholarly Mobile)")

### Luxury fashion
- **Lineage:** Fashion magazines and house identities: Brodovitch-era white space and Didone mastheads [S12], then a 2010s convergence on plain all-caps sans logos, often traced to Saint Laurent under Hedi Slimane (2012), which critics call "blanding" [S15].
- **Real references:** Harper's Bazaar under Brodovitch [S12]; the simplified logos of Saint Laurent, Celine (which dropped its accent in 2018), Balenciaga and Burberry [S15].
- **Fits:** Fashion, beauty, jewelry, galleries, high-end hospitality with strong photography and few words. Fails: without commissioned imagery it collapses into an empty white page; it is also wrong for value brands and dense information.
- **Signature moves:** Type: high-contrast Didone or plain wide-tracked capitals for the wordmark, small precise text; color: black, white and the photograph; layout: full-bleed images, single asymmetric images with space, minimal navigation; imagery: editorial fashion photography and video as the main content; motion: slow crossfades and video.
- **Token sketch:** Type class: Didone or wide grotesque display, small neutral sans for UI; palette: monochrome, color only from imagery; radius: 0; density: very low.
- **Slop risk:** Pale captions on beige, a serif logo and a stock model photo; the "blanding" convergence is itself a known sameness. Use real campaign imagery (rule 6), keep captions readable (rule 15), and find one ownable typographic idea instead of generic wide capitals.
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/luxury/` (thin tokens), `design-systems/brand-systems/elegant/` (thin tokens), `image-direction/brandkit/`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Exaggerated Minimalism", "Minimalist Monochrome")

### Quiet luxury
- **Lineage:** The 2023 "quiet luxury" or "stealth wealth" moment in fashion, amplified by the series Succession: no logos, fine materials, muted palettes [S16].
- **Real references:** The Row, Loro Piana and Brunello Cucinelli, the labels most cited in that coverage [S16]; Aesop's apothecary-style bottles and stores.
- **Fits:** Premium services, hospitality, skincare, architecture and interiors, private banking, consultancies whose clients already know them. Fails: products that must be discovered or explained fast, and brands without the materials or craft to back the restraint, where restraint reads as beige.
- **Signature moves:** Type: refined text serif or quiet sans at modest sizes, no shouting display; color: tonal neutrals (stone, oat, charcoal) with one deep accent; layout: calm, symmetric, few elements, lots of space; imagery: close-up material photography (fabric, stone, glass) in soft daylight; motion: slow fades.
- **Token sketch:** Type class: text serif or humanist sans; palette: tonal neutral ladder tinted toward one deep brand hue; radius: small, one value; density: low.
- **Slop risk:** It slides into the generic beige landing page: pale gray text on cream (rule 15), no imagery, vague copy (rule 9). Show real materials and real offers; quiet does not mean empty.
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/refined/` (thin tokens), `design-systems/brand-systems/elegant/` (thin tokens), `image-direction/brandkit/`

### Cinematic
- **Lineage:** Film titles and movie marketing: Saul Bass's graphic title sequences [S5], widescreen framing, light and darkness as composition; on the web, dark full-bleed pages for studios, cars and media tools.
- **Real references:** Bass's "Vertigo" titles with John Whitney's spirals [S5]; Ferrari's and Bugatti's sites; Runway's media-led product pages (see the repo's systems).
- **Fits:** Film, games, automotive, music, launches of visual products, AI video or audio tools with real output to show. Fails: text-heavy services, accessibility-critical flows, anything without footage; a dark page with no film is just dark.
- **Signature moves:** Type: large display set sparingly like title cards, small precise UI type; color: near-black with light from the imagery, one accent; layout: full-bleed 16:9 or wider frames, one idea per viewport; imagery: real footage and stills with dramatic light; motion: deliberate sequences, crossfades and slow pushes, scroll-linked only when it tells a story.
- **Token sketch:** Type class: condensed or wide display plus neutral sans; palette: dark ground, imagery-led color, one accent; radius: 0 to small; density: very low.
- **Slop risk:** Lens flares, light leaks and grain over everything (rule 13), loops that never end (rule 20), and hero text over video without a scrim (rule 15). Use real footage, give motion an end, and honor reduced motion.
- **Saturation:** medium
- **Repo resources:** `templates/frame-light-leak-cinema/`, `templates/hyperframes/`, `design-systems/brand-systems/bugatti/`, `design-systems/brand-systems/ferrari/`, `design-systems/brand-systems/runwayml/`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Modern Dark (Cinema Mobile)")

### Documentary photo-led
- **Lineage:** Photojournalism and the picture magazine: the photograph carries the argument and the design steps back.
- **Real references:** Magnum Photos (the cooperative founded in 1947); National Geographic's yellow-bordered covers; Patagonia's catalog and campaign photography; Tesla's and SpaceX's full-viewport photo pages (see the repo's systems).
- **Fits:** NGOs, travel, outdoor, architecture, food sourcing, journalism, any brand with real places and people. Fails: when only stock photos exist, which turns generic instantly, and abstract software with nothing physical to show.
- **Signature moves:** Type: quiet and functional, captions with credit and place; color: neutral chrome so photos hold the color; layout: large photographs at their true aspect ratios, sequences, captions next to images; imagery: real, specific, often unposed photographs of the brand's world; motion: slow sequence transitions, no zoom gimmicks.
- **Token sketch:** Type class: neutral sans or text serif; palette: neutral plus one accent taken from the photography; radius: 0; density: low.
- **Slop risk:** Category stock ("happy team at a laptop") instead of the brand's world breaks rule 6, and text over photos without a scrim breaks rule 15. Without real photography, leave labeled slots and list the shots needed.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/tesla/`, `design-systems/brand-systems/spacex/`, `design-systems/brand-systems/airbnb/`, `core-design/impeccable/reference/brand.md` (Imagery section)

### Retro computing
- **Lineage:** The first mass-market graphical interfaces: the 1984 Macintosh, with Susan Kare's icons drawn on 32x32 grids and her Chicago system font [S17], then Windows 95 chrome; revived on the web as nostalgia.
- **Real references:** Kare's Macintosh icons and fonts [S17]; Windows 95; Poolsuite FM's classic Mac OS style web player.
- **Fits:** Developer tools with humor, indie software, retro games, music players, personal sites, launches that celebrate a long product history. Fails: enterprise trust, healthcare, audiences too young to remember unless the play is explicit; window chrome around everything wastes mobile space.
- **Signature moves:** Type: bitmap or system-like fonts for chrome and labels only, a modern text face for reading; color: platinum grays, black, white and one highlight; layout: windows, title bars, menus and dialogs that actually work; imagery: 1-bit icons and dithered pictures; motion: instant state changes and window zooms.
- **Token sketch:** Type class: bitmap display plus readable sans; palette: system grays plus one highlight from the brand; radius: 0 or tiny; density: medium.
- **Slop risk:** Fake window chrome (three traffic-light dots) wrapped around marketing text, and bitmap fonts in body copy. Chrome must function (close, drag, menus), body text stays legible, and icons come from one family (rule 12).
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/vintage/` (thin tokens), `templates/html-ppt/assets/themes/retro-tv.css`

### Pixel
- **Lineage:** Arcade and console graphics built from tiles and sprites, from Namco's Pac-Man (1980) and Nintendo's Famicom (1983), kept alive by indie games.
- **Real references:** Pac-Man and early Nintendo sprites; indie games such as Stardew Valley (2016) and Celeste (2018).
- **Fits:** Games, game tooling, retro hardware, playful developer communities, kids' coding. Fails: anything that must signal trust or premium; pixel fonts at small sizes fail legibility.
- **Signature moves:** Type: pixel display at integer scales only, readable sans for text; color: limited palettes of 8-16 colors with strong contrast; layout: tile grids, chunky borders, dialog boxes; imagery: sprites and tilesets drawn on a grid and rendered with `image-rendering: pixelated`; motion: frame-stepped sprite animation with `steps()`.
- **Token sketch:** Type class: pixel display plus sans text; palette: limited indexed set with one brand accent; radius: 0 or stair-stepped; density: medium.
- **Slop risk:** Blurry art scaled by fractions, pixel fonts in paragraphs, and emoji sprites (rule 12). Scale by whole numbers, keep text readable, and draw or license one coherent sprite set.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/pacman/`, `design-systems/brand-systems/tetris/`, `templates/gamified-app/`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Pixel Art")

### Skeuomorphic
- **Lineage:** Interfaces imitating physical objects, peaking in early iOS with leather, felt and paper textures, which iOS 7 (2013) left behind for flat UI [S18].
- **Real references:** iOS 6-era Game Center felt, the Notes legal pad and the iPad Calendar's leather; audio plugins that model hardware knobs and meters.
- **Fits:** Music and audio tools, instruments and calculators, games, products whose users know the physical device (cameras, synths, mixers), nostalgia campaigns. Fails: data-dense apps, accessibility-first services, anything where texture slows comprehension.
- **Signature moves:** Type: system faces, engraved or embossed only on hardware-style labels; color: material colors (metal, wood, paper) with clear contrast; layout: controls placed as on the physical device; imagery: rendered or photographed materials under one light source; motion: physical behavior, knobs that rotate and switches with inertia.
- **Token sketch:** Type class: neutral sans; palette: material-derived neutrals plus one indicator color; radius: matched to the real object; density: medium.
- **Slop risk:** Random gradients and shadows that fake depth without one light source, and skeuomorphic and flat controls mixed without logic. Pick one light direction and one material system, and keep focus and states visible (rule 19).
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/skeumorphism/` (folder spelled this way; thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (row "Skeuomorphism")

### Frutiger Aero
- **Lineage:** A name coined in 2017 by Sofi Lee (now Sofi Xian) at the Consumer Aesthetics Research Institute for the glossy, nature-meets-technology look of roughly 2004-2013, after the Frutiger typeface and Windows Aero; it returned as an internet nostalgia aesthetic around 2023 [S19][S20].
- **Real references:** Windows Vista and Windows 7 Aero glass; the era's stock imagery of bubbles, sky and grass; CARI's archive entry [S19].
- **Fits:** Nostalgia campaigns, music and fashion projects for people who grew up with it, playful water, weather or outdoor products. Fails: serious B2B and anything that must look current; the gloss reads dated unless the intent is obvious.
- **Signature moves:** Type: humanist sans, clean and friendly; color: sky blue, aqua, fresh green, white highlights; layout: rounded glossy panels with reflections; imagery: water, bubbles, fish, grass, sunlit sky, glossy 3D icons; motion: soft float or shimmer on one hero element.
- **Token sketch:** Type class: humanist sans; palette: blue-green family with one brand accent and white highlights; radius: medium to large, one scale; density: low to medium.
- **Slop risk:** Gloss and blur on every component turns into glassmorphism slop (rule 13), and text on busy nature photos fails contrast (rule 15). Spend the gloss on one signature element and keep surfaces flat and legible.
- **Saturation:** low
- **Repo resources:** none (closest tokens: `design-systems/brand-systems/glassmorphism/`)

### Y2K
- **Lineage:** Late-1990s to early-2000s techno-optimism: translucent plastic hardware, chrome type, rave and game graphics; revived by fashion and music around 2020.
- **Real references:** Apple's Bondi Blue iMac G3 (1998); The Designers Republic's graphics for the Wipeout games and Warp Records; the original Mac OS X Aqua interface.
- **Fits:** Fashion, music, youth brands, festivals, consumer tech launches with a playful edge. Fails: trust-heavy categories (finance, health, B2B) and long reading, since chrome and gloss hurt legibility.
- **Signature moves:** Type: wide or extended display, techno and blobby letterforms for display only; color: chrome silver, iridescent pastels, electric blue, translucent tints; layout: floating objects, capsules, layered translucency; imagery: chrome objects, device renders, low-poly 3D; motion: finite spins and shimmer on hero objects.
- **Token sketch:** Type class: extended display plus clean sans; palette: silver neutrals plus one saturated brand color; radius: large capsule, one scale; density: low to medium.
- **Slop risk:** Chrome gradient text everywhere (rule 13) and stacked sparkle stickers. Put the chrome into one rendered object or the wordmark and keep UI type flat and solid.
- **Saturation:** medium
- **Repo resources:** `templates/html-ppt/assets/themes/y2k-chrome.css`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Y2K Aesthetic")

### Vaporwave
- **Lineage:** An internet music and art movement of 2010-2012, with Daniel Lopatin's "Chuck Person's Eccojams" and James Ferraro's "Far Side Virtual" as precursors and Macintosh Plus's "Floral Shoppe" (December 2011, by Vektroid) as the defining release [S21].
- **Real references:** the "Floral Shoppe" cover (marble bust, pink grid, Japanese text) [S21]; late-1990s Windows and Mac UI fragments; the mall and corporate stock imagery the movement satirized.
- **Fits:** Music, art projects, parody, merch, cultural commentary. Fails: any brand that wants to be taken at face value; the look is ironic by origin and turns sincere brands into jokes.
- **Signature moves:** Type: Windows-era system fonts and full-width characters as texture; color: pastel pink, cyan and purple; layout: floating windows, grids receding to a horizon, classical busts; imagery: marble statues, palms, early 3D renders, VHS artifacts; motion: slow loops and tracking glitches.
- **Token sketch:** Type class: system sans plus display; palette: pink, cyan and purple, one of them the action color; radius: 0 or classic window chrome; density: low.
- **Slop risk:** Using it sincerely for a SaaS product, and decorative Japanese text that says nothing (rule 2). Use it only when the irony is the point and the audience is in on it.
- **Saturation:** low
- **Repo resources:** `templates/html-ppt/assets/themes/vaporwave.css`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Vaporwave")

### Flat
- **Lineage:** Rooted in Swiss modernism, formalized by Microsoft's Metro language (the Zune in 2006, Windows Phone 7 in 2010) and mainstreamed by Apple's iOS 7 in 2013 [S18].
- **Real references:** Windows Phone 7 and its Metro tiles, iOS 7, Android's move toward flat surfaces [S18].
- **Fits:** Utility apps, cross-platform products, dashboards, public services, anything that needs speed and clarity on small screens. Fails: brands that need richness or desire; total flatness hides what is clickable.
- **Signature moves:** Type: clean sans with clear weights; color: solid fills, bright but limited; layout: grids of tiles and blocks; imagery: simple icons and flat illustration; motion: quick fades and slides that explain state.
- **Token sketch:** Type class: neutral sans; palette: neutral plus one accent, semantic colors only for states; radius: small, one value; density: medium.
- **Slop risk:** Buttons that do not look pressable and equal tiles everywhere (rule 7). Keep affordances visible through fills, borders or contrast, and size tiles by importance.
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/flat/` (thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (rows "Flat Design", "Flat Design Mobile (Touch-First)")

### Material
- **Lineage:** Google's Material Design, announced at Google I/O on June 25, 2014 under Matías Duarte [S22]; Material You (Material 3) arrived in 2021 with wallpaper-derived themes, and Material 3 Expressive in May 2025 [S23].
- **Real references:** Android and Google Workspace apps; the official Material 3 web components (`@material/web`).
- **Fits:** Android apps, Google-ecosystem integrations, admin panels and productivity tools that gain from a complete, accessible component system. Fails: brand marketing that must not look like a Google product; untouched Material reads as a template.
- **Signature moves:** Type: role-based scale (display, headline, title, body, label); color: tonal palettes generated from one seed, tinted surfaces; layout: layered surfaces, cards, navigation rail or bar, floating action button; imagery: product UI and illustration; motion: container transforms and shared-axis transitions that explain hierarchy.
- **Token sketch:** Type class: system sans with role-based sizes; palette: one brand seed generating tonal roles; radius: shape scale by component size; density: medium, adjustable.
- **Slop risk:** Default Material (the baseline purple seed, untouched shapes) is the "default state" rule 5 forbids. Use the official package, seed it from the brand, and customize shapes and type roles.
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/material/`, `_archive/retired/design-taste-frontend/SKILL.md` (section 2.A and Appendix A install commands), `core-design/ui-ux-pro-max/data/styles.csv` (row "Material You (MD3 Mobile)")

### Corporate Memphis
- **Lineage:** Flat vector people with big limbs and small heads, spread across tech after Facebook introduced its Alegria illustration system, made by the studio Buck with illustrator Xoana Herrera, in 2017; named as a jab at the Memphis Group and widely criticized as featureless and interchangeable [S24].
- **Real references:** Facebook's Alegria system and the many 2018-2021 startup sites that copied it [S24].
- **Fits:** Rarely: neutral human figures for public-service explainers or internal training, redrawn by a real illustrator in the brand's own style. Fails: nearly every brand page; it now signals a template and sanitized tech optimism.
- **Signature moves:** Type: friendly geometric sans; color: flat pastels with saturated purple-blue; layout: hero illustration of people collaborating beside a headline; imagery: faceless figures with exaggerated proportions; motion: looping vector animations.
- **Token sketch:** Type class: geometric sans; palette: flat pastel set; radius: large; density: low.
- **Slop risk:** It is the slop: illustration that restates the copy and shows no real customer (rules 2 and 6). If people must appear, use real photography or a commissioned style tied to the brand.
- **Saturation:** high
- **Repo resources:** none

### Glassmorphism
- **Lineage:** Translucent blurred panels from Windows Vista's Aero through iOS 7's blur (2013) to macOS Big Sur (2020), the year Michal Malewicz popularized the name [S25]; Apple's Liquid Glass, announced at WWDC on June 9, 2025, made a refracting glass material the shared language of iOS 26 and macOS Tahoe 26 [S26].
- **Real references:** macOS Big Sur system UI [S25]; Apple's Liquid Glass [S26]; Microsoft Fluent's Acrylic material.
- **Fits:** Overlays above rich imagery or live content (media players, maps, camera, spatial UI), OS-like utilities, one floating layer above a photograph. Fails: text-heavy pages, data tables, low-power devices, and flat white pages where glass has nothing to blur.
- **Signature moves:** Type: clean sans with enough weight to survive blur; color: translucent light or dark tints over vivid content; layout: floating layers with clear hierarchy, one glass level; imagery: rich photography or video beneath the glass; motion: subtle layer parallax and light that responds to movement.
- **Token sketch:** Type class: neutral sans, medium weight minimum; palette: translucent neutral surfaces plus one accent, with solid fallbacks; radius: medium to large, concentric; density: low to medium.
- **Slop risk:** A glass nav and glass cards on a purple-blue blob background is the 2024-2026 generator default, and blur erodes contrast (rule 15). Use glass only where content passes beneath it, provide solid fills under `prefers-reduced-transparency`, and test text contrast on the worst frame.
- **Saturation:** high
- **Repo resources:** `design-systems/brand-systems/glassmorphism/` (thin tokens), `templates/html-ppt/assets/themes/glassmorphism.css`, `_archive/retired/design-taste-frontend/SKILL.md` (Appendix C, honest Liquid Glass approximation), `core-design/ui-ux-pro-max/data/styles.csv` (rows "Glassmorphism", "Liquid Glass")

### Neumorphism
- **Lineage:** Soft extruded UI born from a viral Dribbble banking concept by Alexander Plyuto in late 2019; the name, from "neo" plus skeuomorphism, came out of Medium discussion and was popularized by Michal Malewicz [S27].
- **Real references:** Plyuto's 2019 Dribbble shot and the 2020 wave of copies [S27]; the accessibility critiques that followed [S28].
- **Fits:** A single tactile control (a dial, a toggle panel, a smart-home remote) on a calm device UI with few elements. Fails: almost any full product, because low-contrast edges hide buttons, inputs and states [S28].
- **Signature moves:** Type: soft rounded sans; color: one mid-light surface with paired light and dark shadows; layout: few controls, large spacing; imagery: little or none; motion: press-in on tap.
- **Token sketch:** Type class: rounded sans; palette: monochrome surface plus one strong accent for state; radius: large, one value; density: low.
- **Slop risk:** Whole dashboards in relief with gray-on-gray text (rule 15) and invisible focus (rule 19). If used, give interactive edges real contrast and a visible focus ring.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/neumorphism/` (thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (row "Neumorphism")

### Claymorphism
- **Lineage:** Puffy, inflated cards and objects, named by Michal Malewicz around 2021 as a successor to neumorphism [S29].
- **Real references:** Malewicz's Hype4 Academy articles and Smashing Magazine's 2022 overview [S29]; the soft 3D clay-render illustration style common in consumer apps.
- **Fits:** Kids' apps, casual games, onboarding moments, playful consumer products where friendliness beats density. Fails: serious tools and finance; even its namer warns it can look childish [S29].
- **Signature moves:** Type: rounded bold sans; color: saturated pastels; layout: chunky floating cards; imagery: soft 3D renders of objects and characters; motion: short squash and settle on press.
- **Token sketch:** Type class: rounded sans; palette: pastel family with one strong accent for actions; radius: large, one value; density: low.
- **Slop risk:** Inner and outer shadows on every container and clay cards nested inside clay cards (rule 8). Keep clay to illustrations or one hero object and keep controls flat with strong contrast.
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/claymorphism/` (thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (rows "Claymorphism", "Claymorphism (Mobile)")

### Gradient mesh
- **Lineage:** Animated mesh and aurora gradients rendered with WebGL, made famous by Stripe's homepage gradient (reverse-engineered in 2021 as a small WebGL wrapper) [S30] and then copied into countless AI and SaaS heroes [S31].
- **Real references:** Stripe's homepage gradient [S30]; Instagram's 2016 gradient app icon.
- **Fits:** Brands that own a specific gradient (owned hues and owned motion), music and audio products where color stands for sound, single campaign heroes. Fails: as background filler; the violet-to-blue version is one of the most recognized AI tells of 2024-2026 [S31][S32].
- **Signature moves:** Type: strong sans set solid over the field; color: two or three brand hues blended, never the stock violet-blue; layout: one hero field, content on solid surfaces; imagery: the gradient is the image; motion: slow drift, stopped under reduced motion.
- **Token sketch:** Type class: neutral or display sans; palette: brand-derived gradient stops, neutrals elsewhere; radius: any, stated once; density: low.
- **Slop risk:** Mesh orbs behind every section and gradient text are both named in rule 13. If the brand owns a gradient, use it once, derive the stops from the brand, and keep text on solid ground.
- **Saturation:** high
- **Repo resources:** `design-systems/brand-systems/gradient/` (thin tokens), `design-systems/brand-systems/stripe/`, `templates/frame-liquid-bg-hero/`, `templates/html-ppt/assets/themes/aurora.css`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Aurora UI", "Gradient Mesh / Aurora Evolved")

### Bento product
- **Lineage:** Grids of unequal tiles named after the Japanese lunch box; most accounts credit Apple's keynote and product-page feature recaps, others Microsoft's Metro tiles, and CSS Grid made it easy to build [S33][S34].
- **Real references:** Apple's feature-recap grids [S33]; Windows Phone live tiles [S34].
- **Fits:** Summarizing many real features of one product, personal dashboards, portfolio overviews where each tile holds real content. Fails: tiles holding three words and an icon, long reading, and unequal content forced into equal tiles.
- **Signature moves:** Type: one sans with strong contrast between tile titles and details; color: neutral tiles with one accent tile; layout: unequal spans sized by importance; imagery: real screenshots, real numbers, live components inside tiles; motion: small tile-specific demos on hover or in view.
- **Token sketch:** Type class: neutral sans; palette: neutral plus one accent; radius: one tile radius, inner radius equal to outer minus padding (rule 14); density: medium.
- **Slop risk:** The generator bento is six equal tiles of icon, title and filler line, often on dark. Size tiles by importance (rule 7), fill every tile with real content, and delete tiles that only hold text (rule 8).
- **Saturation:** high
- **Repo resources:** `design-systems/brand-systems/bento/` (thin tokens), `design-systems/brand-systems/apple/`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Bento Box Grid", "Bento Grids")

### Brutalist web
- **Lineage:** Named after architectural Brutalism's raw concrete [B8]; on the web, Pascal Deville's brutalistwebsites.com (2014) collected raw sites reacting against light, optimistic web design, many reusing the rough look of the 1994-98 web [S35].
- **Real references:** brutalistwebsites.com and its interviews [S35]; Craigslist and early personal home pages as ancestors.
- **Fits:** Artists, designers, small publishers, music, manifestos, personal sites, audiences that read rawness as honesty. Fails: commerce, onboarding and services where users need reassurance; deliberate friction is a cost they did not agree to.
- **Signature moves:** Type: browser defaults, system faces, big unstyled headings; color: default link blue, black on white or one loud background; layout: stacked blocks, visible borders, little spacing finesse; imagery: raw screenshots and unretouched photos; motion: none or abrupt.
- **Token sketch:** Type class: system serif or sans, one family; palette: defaults plus one accent; radius: 0; density: variable.
- **Slop risk:** Generators confuse it with neo-brutalism and add hard shadows and pastel fills, or they make pages unusable. Raw is not broken: keep focus states, contrast and tap targets (rules 15 and 19).
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/brutalism/` (thin tokens), `styles/industrial-brutalist-ui/`, `templates/web-prototype-taste-brutalist/`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Brutalism")

### Neo-brutalism
- **Lineage:** A colorful, more orderly descendant of web brutalism: high contrast, blocky layouts, bold colors, thick borders and deliberately unpolished elements [S36]; Gumroad's 2021 redesign is often cited as its turning point.
- **Real references:** Gumroad's 2021 redesign; Nielsen Norman Group's analysis of the style [S36].
- **Fits:** Creator tools, indie commerce, playful consumer products, hackathons, brands that want bold friendliness. Fails: luxury, finance, health; by 2024-2026 it is a common template look and no longer signals independence on its own.
- **Signature moves:** Type: heavy grotesque display; color: one or two flat brights on cream or white with black outlines; layout: blocky cards with 2-4px borders and offset shadows; imagery: stickers, flat illustration, bordered screenshots; motion: on press, translate by the shadow offset.
- **Token sketch:** Type class: heavy grotesque; palette: one brand bright plus black and a light ground; radius: 0 or one small value; density: medium.
- **Slop risk:** Equal borders and shadows on everything flatten hierarchy (rule 7), and five brights break rule 11. Reserve the offset shadow for interactive elements and the main feature, and keep one accent.
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/neobrutalism/` (thin tokens), `templates/html-ppt/assets/themes/neo-brutalism.css`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Neubrutalism", "Neo Brutalism (Mobile)")

### Dark SaaS precision
- **Lineage:** Developer-tool marketing from the late 2010s on: near-black canvas, crisp tight sans, thin borders, a faint accent glow and real product screenshots.
- **Real references:** Linear, Vercel and Raycast (see the repo's linear-app, vercel and raycast systems).
- **Fits:** Developer tools and pro software used in dark themes, where the product UI itself is dark and dense. Fails: consumer and non-technical audiences, warm brands, and products that are not dark; it is among the most imitated looks in generated SaaS pages.
- **Signature moves:** Type: tight neo-grotesque with negative tracking at display sizes; color: near-black ground, gray ramp, one accent; layout: centered hero over a product screenshot, feature sections, changelog; imagery: real product UI in dark mode; motion: subtle reveals and keyboard-driven demos.
- **Token sketch:** Type class: neo-grotesque; palette: dark neutral ramp plus one accent; radius: small to medium; density: medium.
- **Slop risk:** A purple glow behind a fake dashboard built from divs (rule 6), gray-on-black body text (rule 15), identical feature cards (rule 7). If the product is dark, show the real product; otherwise pick another direction.
- **Saturation:** high
- **Repo resources:** `design-systems/brand-systems/linear-app/`, `design-systems/brand-systems/vercel/`, `design-systems/brand-systems/raycast/`, `design-systems/brand-systems/superhuman/`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Dark Mode (OLED)")

### Soft premium SaaS
- **Lineage:** The 2024-2026 "premium agency" recipe codified by taste prompts: cream or silver canvas, double-bezel cards, a floating glass pill nav, pill CTAs with an arrow in a circle, squircle radii, tracked eyebrow pills and long spring motion; this repo carries versions distilled from Leonxlnx/taste-skill.
- **Real references:** Apple's product pages, which the recipe imitates; the recipe itself as written in `templates/web-prototype-taste-soft/`.
- **Fits:** Consumer hardware or premium apps with excellent product renders, when the brand already uses soft materials. Fails: as a generic upgrade; unslop names this exact recipe (pill buttons, glass nav, 2rem radii everywhere, an eyebrow on every heading) as the new tell.
- **Signature moves:** Type: heavy geometric or neo-grotesque display with tight tracking; color: off-white neutrals with zinc ink; layout: nested shells with concentric radii, asymmetric hero; imagery: product renders; motion: long spring transitions and blur-in reveals.
- **Token sketch:** Type class: geometric sans; palette: off-white neutrals plus one accent; radius: large squircle, concentric; density: low.
- **Slop risk:** The full recipe is the slop. If a soft direction truly fits, keep one move (concentric nesting done right, rule 14) and drop the eyebrow pills (rule 2), pill-everything and blur-in scroll reveals (rule 20).
- **Saturation:** high
- **Repo resources:** `templates/web-prototype-taste-soft/`, `_archive/retired/high-end-visual-design/SKILL.md` (sections 4 and 5), `design-systems/brand-systems/premium/` (thin tokens)

### AI-native assistant
- **Lineage:** Chat-first interfaces after ChatGPT's launch in late 2022: a centered prompt box, a greeting, suggestion chips and streamed answers; marketing pages add sparkles and gradient orbs.
- **Real references:** ChatGPT, Claude and Perplexity (see the repo's openai, claude and perplexity systems).
- **Fits:** Products whose core interaction really is a conversation or a delegated task; agent consoles that need clear status, sources and undo. Fails: a chat box bolted onto a form-shaped task, and marketing pages for anything that is not an assistant.
- **Signature moves:** Type: highly readable text for long answers, clear speaker distinction; color: neutral, with color reserved for state and citations; layout: input-led single column, side panels for history and sources; imagery: the product's real output; motion: streaming text, progress for long tasks.
- **Token sketch:** Type class: text-optimized sans or serif; palette: neutral plus one accent for actions; radius: medium on input and messages; density: low to medium.
- **Slop risk:** Sparkle icons and gradient orbs that only say "AI" (rules 2 and 13), and "AI-powered" badges (rule 1). Show sources, state, empty and error states (rule 19) and say what it does in plain words (rule 9).
- **Saturation:** high
- **Repo resources:** `design-systems/brand-systems/agentic/` (thin tokens), `design-systems/brand-systems/claude/`, `design-systems/brand-systems/openai/`, `design-systems/brand-systems/perplexity/`, `core-design/ui-ux-pro-max/data/styles.csv` (row "AI-Native UI")

### Data-dense terminal
- **Lineage:** Professional terminals such as the Bloomberg Terminal, where experts trade learning time for density and speed, and whose UX team works to conceal complexity without removing capability [S37].
- **Real references:** the Bloomberg Terminal [S37]; trading platforms such as TradingView; mission-control consoles.
- **Fits:** Trading, operations, monitoring, logistics control rooms, analytics for experts who use the tool all day. Fails: casual or first-time users, marketing pages dressed as terminals, mobile-first audiences.
- **Signature moves:** Type: compact sans with tabular figures, mono only for codes and tickers; color: dark ground, semantic gain, loss and alert colors paired with signs or arrows; layout: shared-border panels and tables with no decorative spacing; imagery: charts and sparklines only; motion: brief flashes on value change, nothing decorative.
- **Token sketch:** Type class: compact sans plus tabular figures; palette: dark neutral plus semantic gain, loss and warning; radius: 0; density: very high.
- **Slop risk:** Mono everywhere as a "technical" costume (rule 4), color-only signals, and fake tickers. Use `tabular-nums` (rule 18), pair color with direction marks, and show real or labeled sample data (rule 9).
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/trading-terminal/`, `design-systems/brand-systems/mission-control/`, `styles/industrial-brutalist-ui/` (Tactical Telemetry mode), `templates/live-dashboard/`, `templates/dashboard/`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Data-Dense Dashboard", "Real-Time Monitoring")

### HUD sci-fi
- **Lineage:** Aircraft head-up displays and film's fantasy user interfaces (FUI), where studios such as Territory Studio design screens meant to read in seconds on camera [S38].
- **Real references:** Territory Studio's screen graphics for "Blade Runner 2049" (worn CRT screens with fading, warping and grain) and for the NASA control room in "The Martian" [S38]; fighter-jet HUD symbology.
- **Fits:** Games, drone and robotics consoles, space and defense products, film marketing, telemetry over live video. Fails: everyday consumer apps and marketing sites; FUI is built to look complex for seconds, not to be used for hours.
- **Signature moves:** Type: condensed sans and mono readouts, short uppercase labels; color: one phosphor-like signal color on near-black, amber and red for warnings; layout: overlays anchored to edges, reticles and scales carrying real values; imagery: live video or 3D scenes under the overlay; motion: value updates and lock-on transitions.
- **Token sketch:** Type class: condensed sans plus mono for numbers; palette: dark ground, one signal color, semantic warning and alert; radius: 0, circles only for reticles; density: high.
- **Slop risk:** Crosshairs, corner ticks and fake coordinates as ornament (rule 13) and random hex strings (rule 9). Every mark reports something, and tracked uppercase labels trip the lint's eyebrow check unless they are real readout labels.
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/hud/`, `design-systems/brand-systems/futuristic/` (thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (row "HUD / Sci-Fi FUI")

### Cyberpunk
- **Lineage:** 1980s science fiction of high tech and low life: William Gibson's "Neuromancer" (1984) [B9], Ridley Scott's "Blade Runner" (1982), Katsuhiro Otomo's "Akira" (1988); later games carried the neon-noir look.
- **Real references:** "Blade Runner" (1982), "Akira" (1988), "Ghost in the Shell" (1995), CD Projekt Red's "Cyberpunk 2077" (2020).
- **Fits:** Games, esports, nightlife, music, security products with a sense of theater, science-fiction media. Fails: trust-first daytime categories (health, finance, education); neon on black tires readers in long sessions.
- **Signature moves:** Type: condensed or techno display, signage-like mixed scripts used as real content; color: neon magenta, cyan and yellow on deep black; layout: dense layered signage, angled panels, one glitch moment; imagery: rain, night cities, neon signs, chromatic aberration inside images; motion: one glitch transition, no flicker.
- **Token sketch:** Type class: condensed display plus readable sans; palette: dark ground plus one neon accent from the brand, a second neon only for state; radius: 0 with clipped corners; density: medium to high.
- **Slop risk:** Glow on every element and glitch text everywhere (rule 13), and flicker that endangers photosensitive users. Keep glow to one signal, never flash more than three times per second, and keep body text solid.
- **Saturation:** medium
- **Repo resources:** `templates/html-ppt/assets/themes/cyberpunk-neon.css`, `templates/frame-glitch-title/`, `design-systems/brand-systems/neon/` (thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (rows "Cyberpunk UI", "Cyberpunk Mobile HUD")

### Solarpunk
- **Lineage:** A hopeful counterpart to cyberpunk, first named in a 2008 blog post, "From Steampunk to Solarpunk"; its visual culture pairs greenery, renewable technology and Art Nouveau curves [S39].
- **Real references:** solarpunk fiction and art communities [S39]; often-cited architecture such as Singapore's Gardens by the Bay and Stefano Boeri's Bosco Verticale in Milan.
- **Fits:** Climate tech, renewable energy, urban farming, civic futures, sustainability reports that want optimism with substance. Fails: brands without real sustainability substance, where it turns into greenwashing, and products needing a neutral corporate tone.
- **Signature moves:** Type: humanist sans or soft serif, organic but legible; color: leaf greens, sky blues, warm golds; layout: flowing curves, Art Nouveau framing in illustration only; imagery: real installations, plants with technology, warm daylight; motion: growth-like reveals tied to real data.
- **Token sketch:** Type class: humanist sans plus soft display; palette: green-led with one warm brand accent; radius: medium, organic shapes inside imagery; density: low to medium.
- **Slop risk:** Leaf icons and green gradients on a generic SaaS page (rules 12 and 13) and invented impact numbers (rule 9). Show real projects and sourced metrics.
- **Saturation:** low
- **Repo resources:** `design-systems/theme-factory/themes/forest-canopy.md`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Organic Biophilic", "Biomimetic / Organic 2.0")

### Immersive 3D
- **Lineage:** WebGL and Three.js experiences that make the site a place, such as Bruno Simon's 2019 portfolio, where visitors drive a small car through a physics world; Awwwards named it Site of the Month [S40].
- **Real references:** Bruno Simon's portfolio [S40]; Apple's product pages that open 3D models in AR Quick Look.
- **Fits:** Product configurators, games, portfolios, hardware and spatial launches, museums and exhibitions where exploring is the point. Fails: content that must be read or found fast, low-end devices, accessibility-critical flows, search-led pages.
- **Signature moves:** Type: minimal overlay type; color: lit by the scene; layout: full-viewport canvas with a plain fallback page; imagery: real-time 3D of the real product or place; motion: camera moves driven by the user, skippable intros.
- **Token sketch:** Type class: neutral sans for overlays; palette: scene-driven, UI neutral plus one accent; radius: small on overlay controls; density: very low.
- **Slop risk:** Floating abstract blobs and spinning knots that represent nothing (rules 6 and 13), and no fallback. Render the actual product or place, provide a static path, and honor reduced motion.
- **Saturation:** medium
- **Repo resources:** `templates/webgl-experience/`, `templates/mockup-device-3d/`, `core-design/ui-ux-pro-max/data/stacks/threejs.csv`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "3D & Hyperrealism", "3D Product Preview")

### Kinetic type
- **Lineage:** Moving typography from film titles, notably Saul Bass's [S5], and broadcast idents to scroll-driven and variable-font typography on the web.
- **Real references:** Bass's title sequences for Hitchcock [S5], including the type that slides along a building grid in "North by Northwest" (1959); GSAP's SplitText plugin as a common web tool.
- **Fits:** Launches, events, music, campaigns, portfolios, title moments where the words are the image. Fails: reading-heavy pages, forms, dashboards and motion-sensitive audiences.
- **Signature moves:** Type: one strong family with weight or width axes; color: high contrast, often two colors; layout: type as the hero with few images; imagery: the type itself; motion: letters and lines moving to reveal meaning, synced to scroll or sound, with a clear end state.
- **Token sketch:** Type class: variable display family; palette: two colors; radius: not needed; density: very low in kinetic sections.
- **Slop risk:** Every heading split into letters that fade up on scroll (rule 20), infinite marquees, unreadable mid-animation frames. Animate one moment, make the static state readable, and honor `prefers-reduced-motion`.
- **Saturation:** medium
- **Repo resources:** `templates/motion-frames/`, `templates/hyperframes/`, `motion/gsap-plugins/` (SplitText), `motion/gsap-scrolltrigger/`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Kinetic Typography", "Kinetic Brutalism (Mobile)")

### Dithered low-tech
- **Lineage:** 1-bit screens and halftone printing reused for character and for weight, since a dithered image is small and fast; the original Macintosh drew everything in 1-bit [S17].
- **Real references:** Low-tech Magazine's solar-powered website, which dithers its images to save energy and bandwidth; Lucas Pope's 1-bit game "Return of the Obra Dinn" (2018).
- **Fits:** Sustainability-minded publishers, low-bandwidth audiences, indie games, tools that want character without weight. Fails: photography-dependent commerce where products must be seen accurately, and luxury.
- **Signature moves:** Type: plain readable faces, a bitmap display at most; color: one ink on one paper or a two-tone palette; layout: simple columns, generous type; imagery: ordered or error-diffusion dithered images with captions; motion: none or frame-stepped.
- **Token sketch:** Type class: text serif or sans; palette: two tones, the accent from the brand; radius: 0; density: medium.
- **Slop risk:** Dither as a filter over chrome and text, or fake dither patterns built from CSS gradients that weigh more than the photo. Dither real images at build time for a stated reason and keep text crisp.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/dithered/` (thin tokens), `styles/industrial-brutalist-ui/` (halftone and 1-bit dithering section)

### Japanese minimal
- **Lineage:** Japanese aesthetics of emptiness carried into brand design: Ikko Tanaka shaped MUJI's founding concept, and Kenya Hara, art director since 2001, describes the aim as emptiness, a vessel for the user's imagination, rather than minimalism [S41][B10]; the wabi-sabi strand of aged, imperfect materials is a separate branch [B13].
- **Real references:** MUJI's identity, catalogs and stores [S41]; Hara's "Designing Design" (2007) [B10]; Naoto Fukasawa's products for MUJI.
- **Fits:** Lifestyle retail, stationery, home goods, hospitality, wellness, tools whose value is calm utility. Fails: brands that must be loud to be noticed, and as a costume for non-Japanese brands (cherry blossoms, red suns, vertical text for flavor).
- **Signature moves:** Type: quiet sans or Mincho-style serif at modest sizes with generous line height; color: off-white, raw materials, one muted accent; layout: large empty areas, horizontal rhythm, products alone; imagery: daylight product photos on plain ground, close-ups of material; motion: almost none.
- **Token sketch:** Type class: quiet sans plus an optional text serif, with CJK support when the brand is bilingual; palette: material neutrals plus one muted brand hue; radius: small; density: low.
- **Slop risk:** Emptiness without content is just an empty page, and decorative Japanese characters that say nothing break rule 2. Fill the space with real objects, real copy and a real hierarchy.
- **Saturation:** medium
- **Repo resources:** `templates/html-ppt/assets/themes/japanese-minimal.css`, `design-systems/brand-systems/kami/`

### Scandinavian
- **Lineage:** Mid-century Nordic design, marketed abroad by the exhibition "Design in Scandinavia", which opened at the Brooklyn Museum in 1954 and toured the United States and Canada [S42]; Finnish prints such as Maija Isola's Unikko for Marimekko (1964) showed its louder side [S43].
- **Real references:** Marimekko's Unikko [S43]; Arne Jacobsen's furniture; IKEA's catalogs.
- **Fits:** Home and furniture, family products, public services with a Nordic tone, wellness, sustainable goods, B2B that wants warmth without frills. Fails: luxury that needs drama, nightlife, and products that need density.
- **Signature moves:** Type: clear humanist or geometric sans at comfortable sizes; color: light woods, whites, soft grays and one confident color or bold print; layout: airy, practical grids; imagery: daylight interiors, people using products in real homes; motion: gentle and functional.
- **Token sketch:** Type class: humanist sans; palette: light warm neutrals with one saturated brand color; radius: small to medium; density: low to medium.
- **Slop risk:** Beige-white blandness with pale text (rule 15) and generic interior stock (rule 6). Commit to one confident color or pattern, as Marimekko does, and photograph real use.
- **Saturation:** medium
- **Repo resources:** none

### Script-native bilingual
- **Lineage:** Typography that starts from a non-Latin script instead of translating a Latin layout: Arabic and Urdu Nastaliq, CJK, Devanagari and others, each with its own direction, line height and hierarchy conventions.
- **Real references:** Google's Noto project, which covers the world's scripts; WeChat and Xiaohongshu interfaces; the repo's Urdu Modern system built on Nastaliq.
- **Fits:** Products whose primary audience reads a non-Latin script, bilingual institutions, diaspora media, local commerce. Fails: a script used as decoration for readers who cannot read it, and teams that cannot check the language.
- **Signature moves:** Type: a native-script face chosen from that script's tradition, paired with a Latin face of matching weight and color; color: from the brand, not from flag or festival cliches; layout: right-to-left or vertical where the script needs it, mirrored icons and progress, generous line height for tall scripts; imagery: local and real; motion: direction-aware transitions.
- **Token sketch:** Type class: native-script family plus a matched Latin family; palette: brand-led; radius: per brand; density: tuned per script (Nastaliq needs more line height).
- **Slop risk:** A Latin layout with translated strings dropped in, clipped ascenders and descenders, and a flag-colored palette. Test real copy in both scripts at every breakpoint (rule 16) and reach past the obvious cultural palette.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/urdu/`, `design-systems/brand-systems/wechat/`, `design-systems/brand-systems/xiaohongshu/`, `templates/card-xiaohongshu/`, `core-design/ui-ux-pro-max/data/google-fonts.csv` (Subsets and Is Noto columns)

### Civic
- **Lineage:** Government digital services since GOV.UK (2012): start with user needs, one typeface, plain language, strict accessibility; GOV.UK set all its text in a custom New Transport, descended from Jock Kinneir and Margaret Calvert's road-sign lettering [S44][S45].
- **Real references:** GOV.UK and the GOV.UK Design System [S44]; the US Web Design System (USWDS); the NHS digital service manual.
- **Fits:** Public services, health, utilities, education administration, nonprofits, any service where completion and trust matter more than delight. Fails: brand campaigns where personality must lead; copying GOV.UK's look for a private company borrows authority it has not earned.
- **Signature moves:** Type: one highly legible sans, large body sizes, plain headings; color: high contrast, limited palette, strong focus states; layout: single column, one thing per page, clear back links; imagery: little or none; motion: none beyond feedback.
- **Token sketch:** Type class: legible sans, one family; palette: neutral plus one action color and accessible semantic colors; radius: 0 to small; density: low.
- **Slop risk:** Generators water it down with cards, icons and marketing copy. Use the official system's components (rule 5) and write task-first copy (rule 9).
- **Saturation:** low
- **Repo resources:** `_archive/retired/design-taste-frontend/SKILL.md` (section 2.A and Appendices A and B for govuk-frontend and uswds), `core-design/ui-ux-pro-max/data/styles.csv` (rows "Accessible & Ethical", "Inclusive Design")

### Enterprise systematic
- **Lineage:** Large design systems for complex B2B software, such as IBM's Carbon, Ant Design and Atlassian's system, which turned density and consistency into a product.
- **Real references:** IBM Carbon, Ant Design, the Atlassian Design System and GitHub's Primer (see the repo's ibm and github systems).
- **Fits:** Admin consoles, analytics, ERP, developer platforms, workflow tools used daily by trained staff. Fails: consumer marketing and brand storytelling, where it reads as internal tooling.
- **Signature moves:** Type: corporate or system sans with a disciplined scale; color: neutral grays, one brand color, semantic statuses; layout: dense tables, side navigation, filters, forms; imagery: product UI and charts; motion: functional transitions only.
- **Token sketch:** Type class: corporate sans; palette: neutral ramp plus one brand accent and a semantic set; radius: 0 to small; density: high, with compact and comfortable modes.
- **Slop risk:** Hand-rolled imitations of Carbon or Ant instead of the official packages (rule 5), and a card around every table (rule 8). Install the system, theme it from the brand, and design loading, empty and error states (rule 19).
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/ibm/`, `design-systems/brand-systems/github/`, `design-systems/brand-systems/ant/` (thin tokens), `design-systems/brand-systems/enterprise/` (thin tokens), `_archive/retired/design-taste-frontend/SKILL.md` (section 2.A, Appendix A), `core-design/impeccable/reference/product.md`

### Industrial
- **Lineage:** Machinery manuals, product engineering and German functionalism: Dieter Rams's work at Braun and the principles gathered in "Less but Better" (1995) [B11]; DIN 1451 lettering on German signage; safety markings.
- **Real references:** Braun products designed under Rams [B11]; Teenage Engineering's products and manuals; DIN 1451 road and rail lettering.
- **Fits:** Hardware, tools, manufacturing, logistics, B2B equipment, engineering firms, products sold on specification. Fails: lifestyle brands that need emotion and kids' products; hazard striping on a calm service alarms users.
- **Signature moves:** Type: grotesque or DIN-like sans, numbers and units given real prominence; color: machine neutrals (warm grays, black) with safety orange or signal yellow as the single accent; layout: spec tables, exploded diagrams, labeled parts; imagery: product photography on plain ground, technical drawings; motion: short, precise, mechanical.
- **Token sketch:** Type class: grotesque or DIN-like sans plus tabular figures; palette: neutral plus one signal color from the brand; radius: matched to the product's real corners; density: medium to high.
- **Slop risk:** Fake serial numbers, "REV" strings, barcodes and warning stripes as ornament (rules 9 and 13). Use the product's real specifications and part numbers, and stripes only where something is actually hazardous.
- **Saturation:** medium
- **Repo resources:** `styles/industrial-brutalist-ui/` (take its grid and type scale; its ASCII ornaments and global noise conflict with rule 13), `templates/html-ppt/assets/themes/engineering-whiteprint.css`, `design-systems/brand-systems/tom-modern/`

### Transit wayfinding
- **Lineage:** Signage for transport and public space: Edward Johnston's lettering for the London Underground (1916), Kinneir and Calvert's British road signs [S45], Unimark's 1970 New York subway manual by Massimo Vignelli and Bob Noorda [S46], Otl Aicher's pictograms for the Munich 1972 Olympics [S47].
- **Real references:** the NYCTA Graphics Standards Manual, reissued after a 2014 Kickstarter by Jesse Reed and Hamish Smyth [S46]; Aicher's Munich pictograms [S47]; Lance Wyman's op-art identity for Mexico 68 [S48].
- **Fits:** Mobility, travel, logistics, venues and events, maps, any product used under time pressure while moving. Fails: brands whose story is intimacy or craft; signage language can feel cold and bureaucratic.
- **Signature moves:** Type: bold legible sans at large sizes, short labels; color: coded line colors with strict meanings on dark or neutral panels; layout: arrows, directional hierarchy, repeatable sign modules; imagery: pictograms from one drawn system, maps; motion: directional slides that follow the user's path.
- **Token sketch:** Type class: signage sans, two weights; palette: neutral panels, a coded set where each color means one thing (data, not accents), one brand accent reserved for actions; radius: 0 to small; density: medium.
- **Slop risk:** Colored line badges that encode nothing and mixed icon sets (rule 12). Every color and pictogram maps to a real category, defined once in the tokens.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/uber/` (mobility, black and white), `templates/html-ppt/assets/themes/swiss-grid.css`

### Architectural
- **Lineage:** Architecture monographs, plans and models: orthographic drawings, section cuts, scale bars and proportion systems such as Le Corbusier's Modulor [B12]; Brutalist concrete also gave web brutalism its name [B8].
- **Real references:** the plan-and-photograph monographs of the magazine El Croquis; Le Corbusier's "Le Modulor" (1948) [B12].
- **Fits:** Architecture and interior practices, developers with real projects, construction tech, urban planning, museums. Fails: products without a spatial or physical story, where plan lines and scale bars become decoration.
- **Signature moves:** Type: precise grotesque, small captions, project data in tables; color: white, concrete grays, black and material photography; layout: strict grid, large project images, plans and sections beside photographs; imagery: architectural photography, drawings, models; motion: slow image sequences, plan-to-photo transitions.
- **Token sketch:** Type class: grotesque at small sizes; palette: neutral plus one material-derived accent; radius: 0; density: low, with dense data blocks.
- **Slop risk:** Fake blueprint grids and dimension lines on non-architectural products (rule 13). Use real drawings and real project data, credited.
- **Saturation:** low
- **Repo resources:** `templates/html-ppt/assets/themes/blueprint.css`, `templates/html-ppt/assets/themes/engineering-whiteprint.css`, `design-systems/brand-systems/together-ai/` (blueprint-style tokens), `core-design/ui-ux-pro-max/data/styles.csv` (row "Exaggerated Minimalism")

### Sports
- **Lineage:** Athletic advertising and event identity: heavy condensed type, motion photography and slogans, as in Nike's long work with Wieden+Kennedy ("Just Do It", 1988); Olympic programs such as Munich 1972 and Mexico 68 showed the systematic route [S47][S48].
- **Real references:** Nike's campaigns and site (see the repo's nike system); Aicher's Munich 1972 identity [S47]; Wyman's Mexico 68 identity [S48].
- **Fits:** Sportswear, teams and leagues, fitness, events, sports media. Fails: calm or clinical services; aggressive type and slogans misfire for wellness and recovery.
- **Signature moves:** Type: condensed heavy display, uppercase headlines, numbers as heroes (scores, times, splits); color: club or brand colors at full saturation with black and white; layout: full-bleed action photography, diagonal energy, big stats; imagery: real athletes in motion; motion: fast cuts, counters on tabular figures, scroll-linked video.
- **Token sketch:** Type class: condensed grotesque plus neutral sans; palette: brand or club colors, one as the action color; radius: 0 to small; density: medium.
- **Slop risk:** Generic stock athletes and fake stats (rules 6 and 9), and counters that jitter without tabular figures (rule 18). Use real fixtures, results and athletes, and animate numbers only when they change.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/nike/`, `design-systems/brand-systems/bmw-m/`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Kinetic Brutalism (Mobile)")

### Food warm
- **Lineage:** Menus, market signage, cookbooks and packaging, where appetite comes from photography, warm color and menu-like type.
- **Real references:** Yotam Ottolenghi's cookbooks and their photography; Starbucks's cream and green system (see the repo's starbucks system).
- **Fits:** Restaurants, bakeries, grocers, food brands, recipe products, delivery, hospitality. Fails: without real food photography (illustrated food reads as kids' content), and for fintech or B2B.
- **Signature moves:** Type: warm serif or friendly sans, menu lists with prices in tabular figures; color: warm neutrals with one appetite color (tomato, saffron, olive) from the brand; layout: menu structure, generous photography, hours and address easy to find; imagery: real dishes on the real tables, hands, kitchens; motion: minimal.
- **Token sketch:** Type class: warm serif or rounded sans; palette: warm neutral plus one food color; radius: small to medium; density: medium in menus.
- **Slop risk:** Category stock ("Italian food") and invented reviews (rules 6 and 9). Photograph the brand's real dishes and keep hours, prices and address real and prominent.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/starbucks/`, `design-systems/brand-systems/cafe/` (thin tokens), `design-systems/theme-factory/themes/golden-hour.md`, `core-design/impeccable/reference/brand.md` (Imagery section)

### Organic natural
- **Lineage:** Biophilic and wellness design: natural materials, earth palettes and soft shapes from craft and landscape, with wabi-sabi's acceptance of imperfection as one root [B13].
- **Real references:** Kinfolk magazine's daylight, muted photography; Leonard Koren's "Wabi-Sabi for Artists, Designers, Poets & Philosophers" (1994) [B13].
- **Fits:** Wellness, skincare, food, outdoor, sustainable goods, retreats, therapy and coaching. Fails: precision tech tools, nightlife and high-energy brands; without real materials it is a crowded wellness cliche.
- **Signature moves:** Type: soft serif or humanist sans; color: clay, sand, sage, forest and cream; layout: relaxed asymmetry, generous space, organic shapes kept inside imagery; imagery: natural light, textures, hands, real ingredients; motion: slow, breathing pace, few elements.
- **Token sketch:** Type class: soft serif plus humanist sans; palette: earth neutrals with one deeper brand hue; radius: medium, one value on controls; density: low.
- **Slop risk:** Blob shapes behind everything (rule 13), leaf icons as bullets (rule 12) and low-contrast sage text (rule 15). Let photographs of real materials carry the nature.
- **Saturation:** medium
- **Repo resources:** `design-systems/theme-factory/themes/forest-canopy.md`, `core-design/ui-ux-pro-max/data/styles.csv` (rows "Organic Biophilic", "Nature Distilled")

### Botanical
- **Lineage:** Scientific botanical illustration and natural-history plates: Ernst Haeckel's "Kunstformen der Natur" (1904) [B14], Pierre-Joseph Redouté's flower engravings, Curtis's Botanical Magazine (published since 1787).
- **Real references:** Haeckel's plates [B14]; Redouté's "Les Liliacées" and "Les Roses"; Curtis's Botanical Magazine.
- **Fits:** Florists, gardens, apothecaries, tea, perfume, natural skincare, seed and plant shops, natural-history museums. Fails: tech products using plants as decoration, and dense UIs or small screens where plates lose their detail.
- **Signature moves:** Type: classic text serif, italics for Latin species names (a real use of italics under rule 3), small caps for labels; color: plate colors on cream, muted greens, one pigment accent; layout: specimen plates with numbered labels that refer to real parts; imagery: detailed illustrations or herbarium scans, not clip art; motion: none or slow.
- **Token sketch:** Type class: text serif with true italics; palette: cream paper, ink and one botanical pigment from the brand; radius: 0; density: low to medium.
- **Slop risk:** Clip-art leaves in the corners (rule 13) and fake Latin names (rule 9). Use licensed historical plates or commissioned illustration and label specimens accurately.
- **Saturation:** low
- **Repo resources:** `design-systems/theme-factory/themes/botanical-garden.md`, `image-direction/canvas-design/`

### Playful kids
- **Lineage:** Children's books, toys and educational television: bright primaries, chunky shapes and characters; on screens, learning apps pair large targets with mascots.
- **Real references:** Duolingo's owl and chunky buttons (see the repo's duolingo system); LEGO; Sesame Street.
- **Fits:** Kids' learning and games, family products, parenting tools, museums and zoos, beginner onboarding. Fails: teens who reject "kiddy" styling and adult professional tools.
- **Signature moves:** Type: rounded bold sans, large sizes, short lines; color: bright saturated set with very clear meanings (correct, wrong, next); layout: big targets, one task per screen, character guidance; imagery: one consistent cast drawn by one illustrator; motion: short celebrations for real achievements.
- **Token sketch:** Type class: rounded sans; palette: one brand bright for actions plus a semantic set; radius: large, one value; density: low.
- **Slop risk:** Emoji as icons (rule 12), confetti on every tap (rule 20), and color everywhere so nothing means anything (rule 11). Save celebration for milestones and give parents a calm settings area.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/duolingo/`, `design-systems/brand-systems/lingo/` (thin tokens), `design-systems/brand-systems/friendly/` (thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (rows "Claymorphism (Mobile)", "Sketch Hand-Drawn (Mobile)")

### Gamified
- **Lineage:** Game conventions (experience points, levels, streaks, quests, leaderboards) applied to non-game products.
- **Real references:** Duolingo's streaks and leagues; Strava's segments and leaderboards.
- **Fits:** Learning, fitness, habit building, onboarding into complex tools, community contribution. Fails: serious or sensitive tasks (health records, money, grief) where points trivialize, and products without a real progression system.
- **Signature moves:** Type: chunky display for numbers and levels on tabular figures; color: reward colors (gold, green) with fixed meanings; layout: progress bars, quest lists, badges earned for real actions; imagery: icons and characters from one system; motion: earned celebrations, progress fills, streak counters.
- **Token sketch:** Type class: rounded or heavy sans; palette: brand accent plus one reward color and a semantic set; radius: medium to large; density: medium.
- **Slop risk:** Badges that reward nothing (rule 1), fake XP numbers (rule 9), and loops that pressure users. Map every reward to a real action and keep every count truthful.
- **Saturation:** low
- **Repo resources:** `templates/gamified-app/`, `design-systems/brand-systems/duolingo/`, `design-systems/brand-systems/pacman/`, `design-systems/brand-systems/tetris/`

### Maximalist
- **Lineage:** More is more: psychedelic concert posters, Memphis, rave flyers and 2020s internet culture; on news sites, The Verge's saturated story tiles show it working at scale.
- **Real references:** Wes Wilson's Fillmore posters of the mid-1960s; The Designers Republic's record sleeves; The Verge's site (see the repo's theverge system).
- **Fits:** Media with lots of content, music and nightlife, fashion drops, youth brands, festivals; brands whose voice is loud and confident. Fails: services that need calm, accessibility-critical flows, and teams that cannot maintain the system; maximalism needs more rules, not fewer.
- **Signature moves:** Type: several display styles with strict roles, huge sizes; color: saturated palette with clashing pairs; layout: dense collage-like grids, overlaps, patterned fields; imagery: a lot of it, curated; motion: energetic but finite.
- **Token sketch:** Type class: two or three families with assigned roles; palette: full palette, yet one color owns the primary action; radius: stated per component type (rule 14); density: high.
- **Slop risk:** Random piles of effects (gradients, glows, stickers) without roles read as noise; one action color (rule 11) and contrast (rule 15) still hold. Write the rules first, then fill the page.
- **Saturation:** low
- **Repo resources:** `design-systems/brand-systems/theverge/`, `design-systems/brand-systems/vibrant/` (thin tokens), `core-design/ui-ux-pro-max/data/styles.csv` (row "Gen Z Chaos / Maximalism")

### Monochrome
- **Lineage:** Black and white as a brand position, from photography and fashion to developer platforms; color appears only as content or as one signal.
- **Real references:** Vercel's black-and-white system and SpaceX's stark site (see the repo's systems); Saint Laurent's monochrome identity [S15].
- **Fits:** Developer platforms, photography, architecture, fashion, publishing, brands whose content brings the color. Fails: products that need warmth or many status categories; with no color to lean on, hierarchy needs extra work.
- **Signature moves:** Type: one strong family with weight and size contrast; color: black, white and a gray ramp, one signal color for errors and focus; layout: strong grid, high-contrast blocks, inverted sections; imagery: black and white photography, or product imagery as the only color; motion: crisp inversions.
- **Token sketch:** Type class: neo-grotesque or serif, one family; palette: gray ramp plus one functional accent (rule 11 still governs actions); radius: 0 to small; density: medium.
- **Slop risk:** Gray-on-gray text for elegance (rule 15), and black and white as a way to avoid deciding. Decide the one functional color and use inversion to mark the main feature (rule 7).
- **Saturation:** medium
- **Repo resources:** `design-systems/brand-systems/vercel/`, `design-systems/brand-systems/x-ai/`, `design-systems/brand-systems/spacex/`, `templates/html-ppt/assets/themes/sharp-mono.css`, `core-design/ui-ux-pro-max/data/styles.csv` (row "Minimalist Monochrome")

## Saturation notes

Ratings describe what page generators (chat builders, coding agents, template galleries) produce unprompted or for vague briefs in 2024-2026. They are a snapshot: re-rate entries when the pool shifts.

**The high cluster.** Warm editorial minimal, Dark SaaS precision, Soft premium SaaS, Glassmorphism, Gradient mesh, Bento product, AI-native assistant and Corporate Memphis. In practice they arrive as one stack: a violet-to-blue accent, a reflex sans or serif, glass or soft cards, a bento of equal tiles, an eyebrow above each heading and a fade-up on scroll. Each of those moves is named somewhere in the 20 rules.

**Why generators converge.** Defaults compound through training data. Tailwind UI's indigo buttons spread through tutorials and examples; in August 2025 Tailwind's co-creator Adam Wathan publicly apologized for that choice, and commentators tie it to the indigo bias of AI-built interfaces [S31][S49]. Lists of AI design tells name the same fonts, gradients and glows [S32], and generated pages are published and scraped again, which tightens the loop [S31]. Anti-slop recipes saturate too: the soft premium recipe written into `_archive/retired/high-end-visual-design/SKILL.md` and `templates/web-prototype-taste-soft/` is now a tell, and `core-design/impeccable/reference/brand.md` flags the editorial-typographic lane. Human industries show the same pattern: luxury houses converged on plain sans logos ("blanding") [S15], and Corporate Memphis drew a backlash for its interchangeability [S24].

**Category defaults are the modal answer.** `core-design/ui-ux-pro-max/data/products.csv` maps product types to styles, for example "SaaS (General)" to Glassmorphism + Flat Design and "Fintech/Crypto" to Glassmorphism + Dark Mode (OLED), and the search script's `--design-system` mode assembles those defaults. Read them as what the category already looks like: the answer to depart from.

**Why it matters.** Visitors recognize a saturated look before they read a word, and the recognition says nobody decided. That costs trust, implies the content is generic too, and makes two products in one category interchangeable, which erases the brief's named reference.

**Using a high entry anyway.** Allowed when the brand already lives there (rule 5), when the category convention genuinely helps users (dark, dense developer tools), or when the brief names it. Write the reason down, change at least two signature moves, and let the difference come from real content: product screenshots, real numbers, real photography and type chosen by voice words.

**Low is not automatically right.** A low entry worn as a costume is still slop. Saturation measures sameness, not fit: fit decides, and saturation breaks ties between directions that fit equally well.

## Sources

Web pages opened through web search during this session (November 2026):

- [S1] CreativePro, "Russian Constructivism and Graphic Design": https://creativepro.com/russian-constructivism-and-graphic-design/
- [S2] Pixartprinting, "Typography in the Bauhaus and Universal Type": https://pixartprinting.co.uk/blog/bauhaus-caracter-universal
- [S3] V&A collections record, Cassandre's "Normandie" poster (1935): https://api.vam.ac.uk/v2/object/O1405126
- [S4] House of Switzerland, "Swiss Style forever": https://houseofswitzerland.org/swissstories/history/swiss-style-forever-story-graphic-design-tradition
- [S5] PBS SoCal Artbound, Saul Bass's title sequences for Hitchcock: https://pbssocal.org/shows/artbound/the-iconic-title-sequences-saul-bass-created-for-hitchcocks-most-loved-films
- [S6] Hyperallergic, NASA and bicentennial manual reissues (Danne & Blackburn): https://hyperallergic.com/419421/an-illuminating-history-of-modern-graphic-design/
- [S7] Domus, Memphis movement page: https://domusweb.it/en/movements/memphis.html
- [S8] Wikipedia, Emigre (magazine): https://en.wikipedia.org/wiki/Emigre_(magazine)
- [S9] WePresent, "Tools of the Trade: the risograph": https://wepresent.wetransfer.com/stories/tools-of-the-trade-risograph
- [S10] AnOther, Jamie Reid and the Sex Pistols artwork: https://anothermag.com/art-photography/15047/jamie-reid-death-sex-pistols-god-save-the-queen
- [S11] Hatch Show Print, history and process: https://hatchshowprint.com/learn
- [S12] Britannica, Alexey Brodovitch: https://www.britannica.com/biography/Alexey-Brodovitch
- [S13] Eye magazine, "Taking care of business" (Bloomberg Businessweek): https://eyemagazine.com/feature/article/taking-care-of-business
- [S14] Wikipedia, Guardian Egyptian: https://en.wikipedia.org/wiki/Guardian_Egyptian
- [S15] Hypebeast, "Why Do All New Fashion Logos Look the Same?" (2018): https://hypebeast.com/2018/9/fashion-logo-balenciaga-celine-calvin-klein-burberry
- [S16] Hypebeast, quiet luxury analysis (2023): https://hypebeast.com/2023/5/quiet-luxury-sucking-fun-out-fashion-tiktok-trend-succession-loro-piana-the-row-analysis
- [S17] Smithsonian Magazine, how Susan Kare designed the Macintosh icons: https://www.smithsonianmag.com/innovation/how-susan-kare-designed-user-friendly-icons-for-first-macintosh-180973286/
- [S18] The Next Web, history of flat design (2014): https://thenextweb.com/news/history-flat-design-efficiency-minimalism-made-digital-world-flat
- [S19] Consumer Aesthetics Research Institute, Frutiger Aero: https://cari.institute/aesthetics/frutiger-aero
- [S20] Wikipedia, Frutiger Aero: https://en.wikipedia.org/wiki/Frutiger_Aero
- [S21] Wikipedia, Floral Shoppe: https://en.wikipedia.org/wiki/Floral_Shoppe
- [S22] Google Design, Material's 2014 launch: https://design.google/library/material-design-launch-2014
- [S23] Wikipedia, Material Design: https://en.wikipedia.org/wiki/Material_Design
- [S24] AIGA Eye on Design, the Corporate Memphis think pieces: https://eyeondesign.aiga.org/what-the-think-pieces-about-corporate-memphis-tell-us-about-the-state-of-illustration/
- [S25] Envato Tuts+, the glassmorphism web design trend: https://webdesign.tutsplus.com/what-is-the-glassmorphism-web-design-trend--cms-93333a
- [S26] TechRadar, Apple's visual redesign at WWDC 2025: https://www.techradar.com/tech/apple-reveals-major-visual-redesign-for-ios-26-macos-26-and-more-at-wwdc-2025
- [S27] Wikipedia, Neumorphism: https://en.wikipedia.org/wiki/Neumorphism
- [S28] UX Collective, digital accessibility and neumorphism: https://uxdesign.cc/the-challenge-of-digital-accessibility-in-user-interfaces-the-example-of-neumorphism-ac9815ae3b86
- [S29] Smashing Magazine, "Claymorphism: Will It Stick Around?" (2022): https://www.smashingmagazine.com/2022/03/claymorphism-css-ui-design-trend
- [S30] Bram.us, recreating the Stripe website gradient (2021): https://www.bram.us/2021/10/13/how-to-create-the-stripe-website-gradient-effect
- [S31] DEV Community, why AI-built websites look the same (Tailwind indigo-500): https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p
- [S32] 925 Studios, AI slop fonts and gradients: https://www.925studios.co/blog/ai-slop-design-tells
- [S33] freeCodeCamp, bento grids in web design: https://www.freecodecamp.org/news/bento-grids-in-web-design/
- [S34] Webdesigner Depot, the bento UI trend: https://webdesignerdepot.com/what-is-the-bento-ui-trend-and-how-can-you-get-started
- [S35] Webdesigner Depot, the rise of the brutalist design trend (2016): https://www.webdesignerdepot.com/2016/08/the-rise-and-rise-of-the-brutalist-design-trend/
- [S36] Nielsen Norman Group, Neobrutalism: https://www.nngroup.com/articles/neobrutalism/
- [S37] Bloomberg, how Terminal UX designers conceal complexity: https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity
- [S38] Territory Studio, Blade Runner 2049 project: https://territorystudio.com/project/blade-runner-2049/
- [S39] Wikipedia, Solarpunk: https://en.wikipedia.org/wiki/Solarpunk
- [S40] Awwwards, Bruno Simon's portfolio as Site of the Month: https://www.awwwards.com/bruno-simon-portfolio-wins-site-of-the-month-november.html
- [S41] Dezeen, Kenya Hara interview (2017): https://www.dezeen.com/2017/12/13/kenya-hara-exclusive-interview-muji-us-expansion-brand-aesthetic/amp/
- [S42] Brooklyn Museum, "Design in Scandinavia" exhibition record: https://www.brooklynmuseum.org/opencollection/exhibitions/1092/Design_in_Scandinavia
- [S43] The Irish Times, Unikko fabric by Marimekko, c. 1964: https://www.irishtimes.com/life-and-style/homes-and-property/interiors/design-moment-unikko-fabric-by-marimekko-c-1964-1.2549602
- [S44] GDS blog, "A few notes on typography" (2012): https://gds.blog.gov.uk/2012/07/05/a-few-notes-on-typography/
- [S45] Wikipedia, Transport (typeface): https://en.wikipedia.org/wiki/Transport_(typeface)
- [S46] It's Nice That, reissuing the NYCTA Graphics Standards Manual: https://www.itsnicethat.com/articles/vignelli-standards-manual
- [S47] Smithsonian Magazine, history of the Olympic pictograms: https://www.smithsonianmag.com/arts-culture/the-history-of-the-olympic-pictograms-how-designers-hurdled-the-language-barrier-4661102/
- [S48] SEGD, 1968 Mexico City Olympics: https://segd.org/resources/1968-mexico-city-olympics-0/
- [S49] AIBase, Adam Wathan's August 2025 apology post: https://news.aibase.com/news/20365

Canonical books:

- [B1] Jan Tschichold, "Die neue Typographie", 1928.
- [B2] Philip B. Meggs, "A History of Graphic Design", 1983.
- [B3] Josef Müller-Brockmann, "Grid Systems in Graphic Design", 1981.
- [B4] Emil Ruder, "Typographie: A Manual of Design", 1967.
- [B5] Paul Rand, "Thoughts on Design", 1947.
- [B6] Marshall McLuhan and Quentin Fiore, "The Medium Is the Massage", 1967.
- [B7] Edward R. Tufte, "The Visual Display of Quantitative Information", 1983.
- [B8] Reyner Banham, "The New Brutalism: Ethic or Aesthetic?", 1966.
- [B9] William Gibson, "Neuromancer", 1984.
- [B10] Kenya Hara, "Designing Design", 2007.
- [B11] Dieter Rams, "Less but Better" ("Weniger, aber besser"), 1995.
- [B12] Le Corbusier, "Le Modulor", 1948.
- [B13] Leonard Koren, "Wabi-Sabi for Artists, Designers, Poets & Philosophers", 1994.
- [B14] Ernst Haeckel, "Kunstformen der Natur", 1904.
