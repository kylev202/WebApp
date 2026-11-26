# Typography library

For the typographer. Read it after the brief exists (SKILL.md step 1). Nothing here is a default: the catalog is a sampling pool organized by voice, every entry says when it fits and when it fails, and the faces AI generators over-use are flagged.

## Contents

1. [How the typographer works](#how-the-typographer-works)
2. [Classification](#classification)
3. [Saturated typefaces](#saturated-typefaces)
4. [Font catalog by voice](#font-catalog-by-voice)
5. [Pairing logic](#pairing-logic)
6. [Scale and rhythm](#scale-and-rhythm)
7. [Web implementation](#web-implementation)
8. [Repo font sources](#repo-font-sources)
9. [Typography slop checks](#typography-slop-checks)
10. [Sources](#sources)

## How the typographer works

Type carries a voice before anyone reads a word [S3], so choose it from the brief, never from memory. Work in this order:

1. **Voice words.** Copy the brief's three voice words to the top of your notes.
2. **Physical object.** Name the object this type would be printed on or cut into: a 1970s terminal manual, a fabric care label, a museum caption, a diner receipt, a stamped shipping crate (core-design/impeccable/reference/brand.md, font selection procedure). The object narrows the class faster than adjectives do.
3. **Strike the reflex.** Write the three fonts you would reach for without thinking. Strike any listed in Saturated typefaces and any you used on the last project (unslop SKILL.md step 2: if the font you first thought of is one you have used before, discard it).
4. **Browse, do not recall.** Open the matching entry in the catalog, then filter `google-fonts.csv` (Repo font sources) and look through at least one more catalog: free (Google Fonts, Fontshare, Velvetyne) or paid as reference points (Klim, Commercial Type, Grilli Type, Dinamo, Pangram Pangram). Shortlist three to five.
5. **Test in context at shipping sizes.** Set the real headline at the h1 size for 390px and 1440px, a real paragraph at 16-18px, a button label, a nav item and a table row of numbers. Judge x-height, apertures (c, e, a, s), figures (are tabular and lining available), the italic, the weight range, language subsets and file size. Reject anything that only looks good in its own specimen.
6. **Pairing.** One family is often enough, and nearly always for product UI (core-design/impeccable/reference/product.md). Add a second only for a named contrast axis (Pairing logic).
7. **Scale and details.** Set the scale, measure, leading, tracking and OpenType features (Scale and rhythm).
8. **Implement.** Self-host, subset, preload one file, add a metric-matched fallback (Web implementation).
9. **Log it.** Voice words, object, chosen faces with one-clause reasons, and the reflex picks you rejected. If a commercial face is chosen, tell the user it needs a web license; trial files are for comps only.

## Classification

What a class communicates is a tendency, not a law; a specific face can contradict its class [S2][S4].

| Class | Recognize it by | Communicates | Examples |
|---|---|---|---|
| Old-style | low contrast, diagonal stress, bracketed serifs | bookish, humane, historical | Garamond, Caslon, EB Garamond |
| Transitional | vertical stress, sharper serifs, more contrast | rational, established, trustworthy | Baskerville, Georgia, Charter |
| Didone | extreme contrast, hairline serifs | glamour, fashion, formality | Bodoni, Didot, Bodoni Moda |
| Slab | heavy block serifs, low contrast | sturdy, mechanical, workmanlike | Rockwell, Clarendon, Zilla Slab |
| Glyphic | flared or chiselled strokes from carving | ceremonial, permanent, civic | Trajan, Optima, Albertus |
| Grotesque | 19th-century sans, uneven widths, quirks | frank, mechanical, a little rough | Akzidenz-Grotesk, Franklin Gothic, Founders Grotesk |
| Neo-grotesque | uniform widths, closed apertures | neutral, corporate, Swiss | Helvetica, Univers, Söhne |
| Humanist sans | calligraphic proportions, open apertures | friendly, legible, public | Frutiger, Gill Sans, Fira Sans |
| Geometric sans | circle and square construction, single-story a | modern, optimistic, constructed | Futura, Avenir, Jost |
| Monospace | every glyph the same width | code, data, typewriter | Courier, JetBrains Mono, Berkeley Mono |
| Display | drawn for large sizes only | spectacle, a single loud idea | Druk, Cooper Black, Abril Fatface |
| Script | joined or brush strokes, handwriting | ceremony or intimacy | Snell Roundhand, Great Vibes, Caveat |

## Saturated typefaces

Flagged faces carry [saturated] in the catalog. Using one is allowed when its "still legitimate" condition is true and the reason is written in the design log.

| Typefaces | Why flagged | Still legitimate when |
|---|---|---|
| Inter, Roboto, Open Sans, Lato, Arial, Helvetica | core-design/impeccable/reference/typeset.md calls them invisible defaults; _archive/retired/high-end-visual-design bans them; Inter is on impeccable's reflex-reject list and design-taste-frontend 4.1 discourages it | the product already ships it; dense product UI where neutrality is the job (impeccable product.md); Roboto in Material or Android work; Inter for a public-sector or accessibility-first brief |
| Montserrat, Poppins | popularity ranks 8 and 9 of 1,923 in google-fonts.csv; the stock template geometric | an existing brand already uses it |
| Fraunces, Instrument Serif | banned as defaults by design-taste-frontend 4.1 and on impeccable's reflex-reject list | the brief names the face, or the brand already uses it |
| Playfair Display, Cormorant (all cuts), Lora, Crimson, Crimson Pro, Crimson Text, Newsreader, DM Serif Display, DM Serif Text, IBM Plex Serif | impeccable brand.md reflex-reject list | an existing identity, or a reading product already standardized on it |
| Space Grotesk, Space Mono, Syne, DM Sans, Outfit, Plus Jakarta Sans, Instrument Sans, IBM Plex Sans, IBM Plex Mono | impeccable brand.md reflex-reject list | IBM work for Plex (design-systems/brand-systems/ibm/), or an existing identity |
| Geist, Geist Mono, Satoshi, Cabinet Grotesk, Clash Display, PP Editorial New, Recoleta, Canela | the swaps the repo's own anti-slop skills prescribe (design-taste-frontend 4.1, high-end-visual-design, impeccable brand.md's editorial lane), which makes them the second-order reflex | Geist for Vercel or Next.js ecosystem work (design-systems/brand-systems/vercel/); otherwise only with a reason tied to the voice words |
| Bricolage Grotesque, PP Neue Montreal, Manrope, Unbounded | this library's judgment: frequent in current AI and template output | the brief needs exactly their quirks, stated in writing |

## Font catalog by voice

Sampling pools, not defaults. (free) means free for commercial web use (Google Fonts, Fontshare, Velvetyne and other open licenses such as OFL); (commercial) means a paid web license, with trials for comps only. Shortlist at least three candidates from the entry and test them in your page; the first name you recognize is usually the reflex.

### Clinical neutral
- **Feels like:** A pharmacy label, a lab instrument panel, Swiss railway signage. Neutral, exact, impersonal.
- **Candidates:** Söhne (commercial), Suisse Int'l (commercial), Neue Haas Grotesk (commercial), ABC Diatype (commercial), Untitled Sans (commercial), Helvetica Now (commercial), Switzer (free), General Sans (free), Hanken Grotesk (free), Public Sans (free), Inter (free) [saturated], Geist (free) [saturated]
- **Pair with:** Nothing in product UI (one family, three weights); a text serif such as Source Serif 4 or Tiempos when long reading needs warmth; the family's own mono (Söhne Mono, Geist Mono) for code only.
- **Fits:** Product UI, health and lab tools, fintech back-offices, documentation, wayfinding.
- **Fails:** Brand pages that need a personality, where neutral reads as unchosen; the [saturated] picks announce "default" on marketing surfaces.

### Warm humanist
- **Feels like:** A library card, friendly transit signage, a clear instruction leaflet. Open, legible, kind.
- **Candidates:** Fira Sans (free), Alegreya Sans (free), Cabin (free), Mukta (free), Frutiger (commercial), FF Meta (commercial), Myriad (commercial), Gill Sans Nova (commercial), Fedra Sans (commercial), Ideal Sans (commercial), Bliss (commercial)
- **Pair with:** A calligraphic serif for headings or quotes (Alegreya, Spectral) when the voice wants literacy; nothing when it wants plainness.
- **Fits:** Public services, healthcare, education, nonprofits, help centers.
- **Fails:** Fashion and luxury; at display sizes humanist sans can look soft and municipal.

### Industrial grotesque
- **Feels like:** A cast-iron nameplate, a 1900s railway timetable, a stamped shipping crate. Blunt, mechanical, opinionated.
- **Candidates:** Founders Grotesk (commercial), National 2 (commercial), GT America (commercial), Graphik (commercial), Atlas Grotesk (commercial), ABC Favorit (commercial), Schibsted Grotesk (free), Familjen Grotesk (free), Darker Grotesque (free), Archivo (free), Bricolage Grotesque (free) [saturated], Space Grotesk (free) [saturated]
- **Pair with:** A typewriter face for specs (Atlas Typewriter, Courier Prime) or a sharp old-style serif for long text; never a second grotesque.
- **Fits:** Tools, hardware, workshops, architecture, independent media, transport.
- **Fails:** Soft wellness or children's briefs; the quirky grotesques (Space Grotesk) now read as startup costume.

### Geometric modernist
- **Feels like:** A Bauhaus drafting compass, a 1960s airline timetable, a circle-and-square logotype. Constructed, optimistic, clean.
- **Candidates:** Futura PT (commercial), GT Walsheim (commercial), Circular (commercial), Avenir Next (commercial), Brown (commercial), Jost (free), League Spartan (free), Red Hat Display (free), Kumbh Sans (free), Satoshi (free) [saturated], Outfit (free) [saturated], Poppins (free) [saturated]
- **Pair with:** A humanist sans or a transitional serif for body text, because round geometric letters slow reading at 14-16px.
- **Fits:** Transport, architecture, design-led consumer brands, children's brands done with restraint.
- **Fails:** Long reading; Poppins, Outfit and Satoshi are the template look of AI landing pages.

### Rounded soft
- **Feels like:** A silicone kitchen tool, a children's TV ident, a soft vinyl toy. Friendly, safe, tactile.
- **Candidates:** Nunito (free), Quicksand (free), Varela Round (free), M PLUS Rounded 1c (free), Fredoka (free), Baloo 2 (free), DynaPuff (free), GT Maru (commercial), Gotham Rounded (commercial), VAG Rounded (commercial)
- **Pair with:** A plain grotesque or humanist body (Hanken Grotesk, Source Sans 3) so the softness stays in headings and buttons.
- **Fits:** Children's products, pet care, consumer apps that must feel safe, onboarding moments.
- **Fails:** Adult professional tools, where it patronizes; impeccable notes that a children's product does not need a rounded font at all.

### Newsprint authority
- **Feels like:** A broadsheet front page, a dense op-ed column. Serious, literate, compact.
- **Candidates:** Tiempos (commercial), Lyon (commercial), Publico (commercial), Guardian Egyptian (commercial), Miller (commercial), Financier (commercial), Source Serif 4 (free), Literata (free), Merriweather (free), PT Serif (free), Charis SIL (free), Newsreader (free) [saturated]
- **Pair with:** A condensed grotesque for headlines and kickers (Founders Grotesk Condensed, Libre Franklin) or a neutral sans for UI chrome.
- **Fits:** News, research, policy, long-form journalism, finance commentary.
- **Fails:** Brands that are not publications; with mono labels and hairline rules it becomes impeccable's saturated editorial-typographic lane.

### Literary old-style
- **Feels like:** A cloth-bound novel, a university press monograph. Unhurried, humane, bookish.
- **Candidates:** EB Garamond (free), Libre Caslon Text (free), Alegreya (free), Vollkorn (free), Sorts Mill Goudy (free), Spectral (free), Arno (commercial), Sabon Next (commercial), Adobe Garamond (commercial), Heldane (commercial), Crimson Pro (free) [saturated], Lora (free) [saturated]
- **Pair with:** The family's own small caps and italic for labels and emphasis; a humanist sans only for UI chrome.
- **Fits:** Books, literary magazines, poetry, archives, essays, university presses.
- **Fails:** Product UI; a "warm serif for warmth" on a technical tool (the anti-reflex in impeccable typeset.md).

### Couture didone
- **Feels like:** A perfume bottle label, a fashion masthead, a candlelit menu. Glossy, haughty, high contrast.
- **Candidates:** Bodoni Moda (free), Libre Bodoni (free), Gloock (free), Prata (free), Abril Fatface (free), Didot (commercial), GT Super (commercial), Domaine Display (commercial), Canela (commercial) [saturated], PP Editorial New (commercial) [saturated], Playfair Display (free) [saturated]
- **Pair with:** A light neo-grotesque or geometric sans for small text (ABC Diatype, Jost), tracked open when set in caps.
- **Fits:** Fashion, beauty, fragrance, luxury hospitality, magazine covers.
- **Fails:** Hairlines vanish below about 20px and on low-density screens, so never body text; Playfair Display is the default "elegant".

### Workwear slab
- **Feels like:** A stenciled crate, a typed work order, a workwear tag. Sturdy, blunt, practical.
- **Candidates:** Zilla Slab (free), Arvo (free), Bitter (free), Aleo (free), Hepta Slab (free), Josefin Slab (free), Roboto Slab (free), Rockwell Nova (commercial), Sentinel (commercial), Archer (commercial), Clarendon (commercial), Stag (commercial)
- **Pair with:** A grotesque for UI and small text (Founders Grotesk, Schibsted Grotesk); a text slab such as Bitter can carry body on its own.
- **Fits:** Outdoor gear, tools, food trucks, local services, education.
- **Fails:** Luxury and clinical briefs; Roboto Slab reads as a default blog theme.

### Carved civic
- **Feels like:** A memorial inscription, a museum lintel, a coin. Chiselled, ceremonial, permanent.
- **Candidates:** Cinzel (free), Cinzel Decorative (free), Marcellus (free), Marcellus SC (free), Forum (free), Trajan (commercial), Optima nova (commercial), Albertus Nova (commercial), Friz Quadrata (commercial)
- **Pair with:** An old-style serif or a humanist sans for every readable line; glyphic faces carry short titles, usually in caps.
- **Fits:** Memorials, institutions, wineries, classical music, academic ceremonies, fantasy games.
- **Fails:** Anything casual or fast; Cinzel is the stock luxury real-estate and fantasy-game face (typography.csv row 32 pairs it with real estate).

### Instrument mono
- **Feels like:** An oscilloscope readout, a CLI manual, a part number etched on a chassis. Exact, terse, technical.
- **Candidates:** JetBrains Mono (free), Commit Mono (free), Departure Mono (free), Fragment Mono (free), Martian Mono (free), Berkeley Mono (commercial), Söhne Mono (commercial), ABC Diatype Mono (commercial), GT America Mono (commercial), Geist Mono (free) [saturated], IBM Plex Mono (free) [saturated], Space Mono (free) [saturated]
- **Pair with:** A neutral grotesque for everything that is not code (rule 4).
- **Fits:** Code, terminals, keyboard keys, identifiers, aligned data in developer products. Commit Mono and Departure Mono are open-source downloads, not on Google Fonts.
- **Fails:** As a "technical" costume for nav, labels and captions on brands that are not developer tools (rule 4); for numbers use tabular figures instead (rule 18).

### Hand-lettered personal
- **Feels like:** A note on the fridge, a field notebook, a chalkboard of daily specials. Human, imperfect, intimate.
- **Candidates:** Caveat (free), Kalam (free), Patrick Hand (free), Reenie Beanie (free), Gochi Hand (free), Nothing You Could Do (free), Covered By Your Grace (free), Shantell Sans (free), Sedgwick Ave (free), Permanent Marker (free)
- **Pair with:** A plain grotesque or humanist sans for every functional line; the hand appears once, as an annotation or a signature.
- **Fits:** Personal sites, menus with handwritten specials, journaling apps, teaching annotations.
- **Fails:** Body text, buttons, anything legal or financial; one handwritten accent on a SaaS page reads as template quirk.

### Formal script
- **Feels like:** An engraved invitation, a calligrapher's place card. Ceremonial, romantic, slow.
- **Candidates:** Pinyon Script (free), Great Vibes (free), Parisienne (free), Monsieur La Doulaise (free), Italianno (free), Ballet (free), Bickham Script (commercial), Snell Roundhand (commercial), Edwardian Script (commercial), Kuenstler Script (commercial)
- **Pair with:** A didone or old-style serif with small caps for all the information.
- **Fits:** Weddings, invitations, perfumery, certificates.
- **Fails:** Script in all caps (never), anything under about 28px on screen, and all UI.

### Raw default
- **Feels like:** A photocopied flyer, a construction hoarding, a hand-coded page from 1997. Raw, unpolished, deliberate.
- **Candidates:** Times New Roman (commercial), Arial (commercial), Courier Prime (free), ABC Monument Grotesk (commercial), Terminal Grotesque (free), Basteleur (free), Karrik (free), Sporting Grotesque (free), Happy Times at the IKOB (free), Archivo Black (free), Space Grotesk (free) [saturated], Space Mono (free) [saturated]
- **Pair with:** One other face at most, often a system font; contrast comes from size jumps, not pairing. Reference the installed system copies of Times New Roman and Arial instead of self-hosting them.
- **Fits:** Art spaces, music labels, student shows, experimental studios, zines and protest sites.
- **Fails:** When it is decoration rather than conviction (brutalism with a gradient button is neither); Space Grotesk plus Space Mono is the AI "brutalist" kit.

### Condensed poster
- **Feels like:** A boxing poster, a stadium scoreboard, a tabloid headline. Urgent, athletic, loud.
- **Candidates:** Druk (commercial), Knockout (commercial), Tungsten (commercial), Founders Grotesk Condensed (commercial), Le Murmure (free), Barlow Condensed (free), Antonio (free), League Gothic (free), Sofia Sans Extra Condensed (free), Big Shoulders (free), Bebas Neue (free), Oswald (free)
- **Pair with:** A regular-width or wide sans for body (Barlow, Archivo), a contrast of proportion.
- **Fits:** Sports, fitness, events, news headlines, campaign posters.
- **Fails:** Long headlines (condensed caps lose word shapes), body text and calm brands; Bebas Neue and Oswald are the default condensed pair.

### Wide architectural
- **Feels like:** A title block on an architect's drawing, a car badge, an engraved address plate. Expansive, calm, monumental.
- **Candidates:** Druk Wide (commercial), PP Monument Extended (commercial), GT America Extended (commercial), Eurostile (commercial), Syncopate (free), Michroma (free), Krona One (free), Lexend Zetta (free), Encode Sans Expanded (free), Mona Sans (free), Unbounded (free) [saturated]
- **Pair with:** A regular-width grotesque or a mono for all small text; wide faces suit short words.
- **Fits:** Architecture, automotive, audio, galleries, logotypes and section titles.
- **Fails:** Long headlines and body text; Unbounded on a dark gradient is the crypto default.

### Retro-futurist
- **Feels like:** A 1970s space-program manual, a starship console, an arcade cabinet bezel. Engineered, chamfered, sci-fi.
- **Candidates:** Microgramma (commercial), Bank Gothic (commercial), PP Neue Machina (commercial), Orbitron (free), Exo 2 (free), Rajdhani (free), Chakra Petch (free), Tektur (free), Oxanium (free), Aldrich (free)
- **Pair with:** A plain grotesque or a mono for everything readable.
- **Fits:** Games, hobby aerospace, music with a sci-fi concept, event titles.
- **Fails:** Real aerospace and AI companies, where it reads as fiction; Orbitron is the crypto and gaming cliché (typography.csv rows 36 and 68).

### Mid-century friendly
- **Feels like:** A 1970s record sleeve, a diner menu, a vintage travel poster. Warm, cheeky, round.
- **Candidates:** Cooper Black (commercial), ITC Souvenir (commercial), ITC Avant Garde Gothic (commercial), ITC Benguiat (commercial), Young Serif (free), Shrikhand (free), Righteous (free), Ultra (free), Chango (free), Bagel Fat One (free), Recoleta (commercial) [saturated], Fraunces (free) [saturated]
- **Pair with:** A sturdy grotesque body (Founders Grotesk, Libre Franklin) so it stays a voice and does not become a costume.
- **Fits:** Food, drink, music, vintage retail, family entertainment.
- **Fails:** impeccable brand.md warns that "warm" is not Fraunces; Recoleta and Fraunces are the soft-serif reflex for anything warm.

### Studio contemporary
- **Feels like:** A design studio's annual report, a gallery's exhibition signage, a type specimen. Sharp, current, designed.
- **Candidates:** ABC Whyte Inktrap (commercial), GT Standard (commercial), PP Mori (commercial), Aeonik (commercial), Funnel Display (free), Host Grotesk (free), Hedvig Letters Sans (free), Gabarito (free), Rethink Sans (free), PP Neue Montreal (commercial) [saturated], Instrument Sans (free) [saturated], Cabinet Grotesk (free) [saturated]
- **Pair with:** A sharp text serif for contrast (Signifier, Hedvig Letters Serif) or the family's own mono.
- **Fits:** Studios, agencies, cultural institutions, design tools.
- **Fails:** It is the agency-portfolio uniform; PP Neue Montreal and Cabinet Grotesk are the template look of the moment.

### Kinetic variable
- **Feels like:** A kinetic gig poster, a stretchy rubber stamp, a film title sequence. Elastic, playful, experimental.
- **Candidates:** Recursive (free), Anybody (free), Roboto Flex (free), Kablammo (free), Honk (free), Nabla (free), Sixtyfour (free), Tilt Warp (free), Climate Crisis (free), GT Flexa (commercial), PP Formula (commercial)
- **Pair with:** One calm text face; one moving face per page.
- **Fits:** Music, festivals, motion-led campaigns, creative coding portfolios.
- **Fails:** Product UI and long text; animated axes must stop under `prefers-reduced-motion` (rule 20).

### Plain public service
- **Feels like:** A tax form, a transit timetable, a pharmacy leaflet. Plain, accessible, trustworthy.
- **Candidates:** Public Sans (free), Atkinson Hyperlegible Next (free), Inclusive Sans (free), Source Sans 3 (free), Noto Sans (free), Overpass (free), Libre Franklin (free), Lexend (free), FS Me (commercial), Interstate (commercial), IBM Plex Sans (free) [saturated]
- **Pair with:** A sturdy text serif for long guidance (Source Serif 4, Charis SIL), or nothing.
- **Fits:** Government, healthcare, utilities, education, accessibility-critical forms.
- **Fails:** Campaigns that need distinctiveness; Public Sans was made for the US Web Design System, so outside government it can read as borrowed.

### Banknote heritage
- **Feels like:** A private-bank letterhead, an engraved share certificate, an annual report. Established, sober, monied.
- **Candidates:** Mercury (commercial), Chronicle (commercial), Freight Text (commercial), Big Caslon (commercial), Copperplate Gothic (commercial), Libre Caslon Display (free), Baskervville (free), Libre Baskerville (free), Old Standard TT (free), Ibarra Real Nova (free), IBM Plex Serif (free) [saturated], Cormorant (free) [saturated]
- **Pair with:** A restrained grotesque for data and UI (Graphik, Libre Franklin), with tabular figures.
- **Fits:** Private banks, law firms, insurers, foundations, auction houses.
- **Fails:** Startups pretending to be old; Libre Baskerville (popularity rank 72) is the stock "trust serif".

### Blackletter heritage
- **Feels like:** A brewery label, a newspaper nameplate, a metal band shirt, a tattoo flash sheet. Heavy, historic, defiant.
- **Candidates:** UnifrakturMaguntia (free), UnifrakturCook (free), Pirata One (free), Grenze Gotisch (free), Jacquard 24 (free), Jacquarda Bastarda 9 (free), Manufacturing Consent (free), Fette Fraktur (commercial), Old English Text (commercial), Cloister Black (commercial)
- **Pair with:** A plain grotesque for every readable line (Founders Grotesk, Schibsted Grotesk); blackletter takes one nameplate or one word.
- **Fits:** Breweries, barbers, metal and hip-hop labels, streetwear, newspapers with a historic nameplate.
- **Fails:** Body text; in some places it carries nationalist associations, so check the audience against the brief.

### Pixel bitmap
- **Feels like:** An LCD calculator, an 8-bit game menu, a dot-matrix receipt. Lo-fi, playful, digital-native.
- **Candidates:** Silkscreen (free), Pixelify Sans (free), VT323 (free), Jersey 10 (free), Micro 5 (free), Tiny5 (free), DotGothic16 (free), Doto (free), Departure Mono (free), PP NeueBit (commercial), PP Mondwest (commercial), Press Start 2P (free)
- **Pair with:** A clean grotesque for all functional text.
- **Fits:** Games, retro-tech hobbies, music, playful developer tools, event badges.
- **Fails:** Pixels blur at sizes that are not whole multiples of the face's grid; Press Start 2P is the default pixel face (typography.csv row 52).

## Pairing logic

**Pair on one contrast axis and match the rest.** Choose the axis the voice needs: structure (serif with sans), proportion (condensed display with regular text), era (old-style with grotesque), construction (geometric with humanist), texture (smooth with rough). Keep x-height, gray value and mood close, or the pair looks like two brands. Test by setting both at the same size on one line: if one looks like a mistake, the axis is wrong.

**Superfamilies** (sans, serif and mono drawn together, so the match is built in): Source Sans 3, Source Serif 4 and Source Code Pro (free); Noto Sans, Noto Serif and Noto Sans Mono (free); Roboto, Roboto Serif and Roboto Mono (free); Alegreya and Alegreya Sans (free); Merriweather and Merriweather Sans (free); Hedvig Letters Sans and Hedvig Letters Serif (free); Fira Sans and Fira Code (free); Untitled Sans and Untitled Serif (commercial); Söhne and Söhne Mono (commercial); Fedra Sans and Fedra Serif (commercial); IBM Plex [saturated]. A superfamily is the safe pair, which is also its risk: the contrast can be too polite for a brand voice.

**One-family systems.** One family in two or three weights with real size contrast beats a timid pair (impeccable brand.md), and it is the right default for product UI (impeccable product.md). A variable font adds width and optical size from the same file.

**Pairs to avoid.**
- Two faces from one class that differ slightly (two geometric sans, two grotesques): it reads as an error.
- A serif word dropped into a sans headline, or a lone italic word for flavor (rule 3).
- A display face for body text, a script for anything that must be read.
- Mono for labels, nav or captions on a brand that is not a developer tool (rule 4).
- More than three families (display, body, optional mono).
- The saturated pairs in typography.csv: Playfair Display with Inter (row 1), Poppins with Open Sans (row 2), Space Grotesk with DM Sans (row 3), Cormorant with Montserrat (row 12).

## Scale and rhythm

**Ratios.** Sizes from a 16px base, one step down and five up:

| Ratio | Name | Sizes (px) | Use |
|---|---|---|---|
| 1.067 | minor second | 15, 16, 17.1, 18.2, 19.4, 20.7, 22.1 | dense data UI |
| 1.125 | major second | 14.2, 16, 18, 20.2, 22.8, 25.6, 28.8 | product UI (1.125-1.2, impeccable product.md) |
| 1.2 | minor third | 13.3, 16, 19.2, 23, 27.6, 33.2, 39.8 | product UI, docs |
| 1.25 | major third | 12.8, 16, 20, 25, 31.2, 39.1, 48.8 | brand floor (1.25 or more, impeccable brand.md) |
| 1.333 | perfect fourth | 12, 16, 21.3, 28.4, 37.9, 50.5, 67.3 | marketing, editorial |
| 1.414 | augmented fourth | 11.3, 16, 22.6, 32, 45.2, 64, 90.4 | editorial heroes |
| 1.5 | perfect fifth | 10.7, 16, 24, 36, 54, 81, 121.5 | posters; drop the top steps |
| 1.618 | golden ratio | 9.9, 16, 25.9, 41.9, 67.8, 109.7, 177.4 | display only; too steep for UI |

Use five or six steps, round to clean rem values, keep the hero at or under 6rem (core-design/impeccable/SKILL.md), and treat a four-line headline as a size error (rule 16).

**Fluid type with clamp(), the Utopia method.** Fluid sizing ties type to the viewport so it scales with the layout [S5]. Define two viewports, each with its own base size and ratio, and interpolate every step between them: pick a small viewport (360px, base 16px, ratio 1.2) and a large one (1240px, base 18px, ratio 1.333); for step n, min = 16 × 1.2^n and max = 18 × 1.333^n; slope = (max - min) / (1240 - 360); intercept = min - slope × 360; write `clamp(min, intercept + slope × 100vw, max)` with the intercept in rem so browser zoom still works. Computed for that setup:

```css
:root {
  --step-0: clamp(1rem, 0.9489rem + 0.2273vw, 1.125rem);     /* body: 16 to 18px */
  --step-1: clamp(1.2rem, 1.077rem + 0.5448vw, 1.5rem);      /* 19.2 to 24px */
  --step-2: clamp(1.44rem, 1.211rem + 1.016vw, 1.999rem);    /* 23 to 32px */
  --step-3: clamp(1.728rem, 1.345rem + 1.703vw, 2.665rem);   /* 27.6 to 42.6px */
  --step-4: clamp(2.074rem, 1.469rem + 2.688vw, 3.552rem);   /* 33.2 to 56.8px */
  --step-5: clamp(2.488rem, 1.569rem + 4.085vw, 4.735rem);   /* 39.8 to 75.8px */
}
```

Keep each max under about 2.5 times its min (impeccable typeset.md). Fluid steps are for marketing and content headings; body text and product UI stay on a fixed rem scale.

**Measure.** Body text 60-75ch (rule 16); Bringhurst's range for a single column is 45-75 characters, with about 66 as the ideal [S1]. Put `max-width: 65ch` on the text block, not on the section. Captions and side notes 40-50ch. Narrow columns want tighter leading, wide ones more.

**Leading and tracking by size.**

| Text | Size | Line height | Tracking |
|---|---|---|---|
| Caption, label | 12-14px | 1.4-1.5 | 0 to +0.02em |
| Body | 16-18px | 1.5-1.65 | 0 |
| Lead paragraph | 20-24px | 1.35-1.45 | 0 to -0.005em |
| Subheads | 24-40px | 1.15-1.3 | -0.01em |
| Headline | 40-72px | 1.0-1.15 | -0.015 to -0.03em |
| Display | 72px and up | 0.95-1.05 | -0.02 to -0.04em, never tighter (impeccable SKILL.md) |
| All-caps labels | any | 1.2 | +0.05 to +0.12em (impeccable typeset.md) |

Light text on dark: add 0.05-0.1 to line height and 0.01-0.02em of tracking. Italic display with descenders needs line height 1.1 or more (design-taste-frontend 4.1). Faces with a large x-height need more leading than small ones at the same size.

**Optical sizes.** Text cuts have sturdier hairlines and looser spacing, display cuts finer details and tighter spacing. With a variable `opsz` axis, `font-optical-sizing: auto` (the initial value) picks the cut from the font size. 29 Google families ship `opsz` (list them with the filter in Repo font sources), among them Literata, Source Serif 4, Bodoni Moda, Piazzolla, Roboto Flex, Roboto Serif, Hedvig Letters Serif, Big Shoulders, Playfair and Newsreader [saturated]. With separate cuts (Tiempos Text and Tiempos Headline, Lyon Text and Lyon Display, Mercury Text and Mercury Display), use the text cut up to about 24px and the display cut from about 32px.

**OpenType features.** Prefer the `font-variant-*` properties: `font-feature-settings` replaces its whole list each time it is declared, so a later rule silently drops earlier features [S6].

```css
table, .price, .stat, .timer { font-variant-numeric: tabular-nums lining-nums; } /* tnum, lnum (rule 18) */
.prose { font-variant-numeric: oldstyle-nums proportional-nums; } /* onum in running serif text */
.label-caps { text-transform: uppercase; letter-spacing: 0.08em; font-feature-settings: "case"; }
abbr { font-variant-caps: all-small-caps; letter-spacing: 0.04em; }
code { font-variant-ligatures: none; }
.brand-text { font-feature-settings: "ss01"; } /* check what the set changes in the specimen */
```

`case` raises hyphens, brackets and colons to sit with capitals. A stylistic set that changes nothing means the font lacks it; Stripe enables `ss01` on all its text (design-systems/brand-systems/stripe/DESIGN.md).

**Line breaks.** `text-wrap: balance` on h1-h3 and other short blocks (browsers balance only a few lines, so it is a heading tool); `text-wrap: pretty` on paragraphs to avoid one-word last lines (rule 16). Never hyphenate headings; use `hyphens: auto` with a correct `lang` attribute only in narrow or justified long columns. Buttons stay on one line.

**Real punctuation.** Curly quotes and apostrophes (“ ” ‘ ’, it’s), a true ellipsis (…), the multiplication sign for dimensions (3 × 4), primes for feet and inches (6′ 2″). Ranges take a plain hyphen in this skill (2019-2026, 9-5), and em or en dashes never appear (unslop pre-ship checks). `hanging-punctuation: first` (Safari) or a small negative `text-indent` hangs the opening quote of a pull quote.

## Web implementation

**Self-host.** Serve WOFF2 from your own origin: one less connection, full control of subsets, and nothing lost, because browsers now partition their caches per site so a CDN font is never shared across sites. For Google families, download from the specimen page or install Fontsource packages (`npm i @fontsource-variable/<family>`). Self-hosting also keeps `scripts/shoot.mjs` honest: a render without network falls back silently when fonts come from a CDN. Commercial faces need a web license; trial files from Klim, Grilli Type, Dinamo or Pangram Pangram are for comps only, so tell the user before anything ships. [S6] covers this setup in depth.

**@font-face, font-display and preload.**

```html
<link rel="preload" href="/fonts/body-var-latin.woff2" as="font" type="font/woff2" crossorigin>
```

```css
@font-face {
  font-family: "Body";
  src: url("/fonts/body-var-latin.woff2") format("woff2");
  font-weight: 300 800;     /* variable range */
  font-style: normal;
  font-display: swap;       /* or optional, for zero layout shift */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2212;
}
```

Preload only the one or two files used above the fold, usually the body face; `crossorigin` is required even on your own origin, or the font downloads twice. `swap` shows fallback text at once and swaps later; `optional` keeps the fallback when the font misses its short load window and avoids the shift entirely (impeccable typeset.md).

**Subset.** Keep only the characters the copy uses (fonttools; `--flavor=woff2` needs the brotli module; `--layout-features='*'` keeps tnum, case and the stylistic sets):

```bash
pyftsubset Body.ttf --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212" \
  --layout-features='*' --flavor=woff2 --output-file=body-latin.woff2
```

Check the Subsets column of google-fonts.csv before choosing a face for multilingual copy.

**Variable fonts.** One variable file usually beats three or more static weights. Drive standard axes with `font-weight`, `font-stretch` and `font-style`; use `font-variation-settings` only for custom axes (such as `"SOFT"` or `"CASL"`). Set `font-synthesis: none` so a missing weight or italic fails visibly instead of being faked by the browser.

**Metric-matched fallback.** Match the fallback's metrics to the web font so the swap does not move the layout:

```css
@font-face {
  font-family: "Body Fallback";
  src: local("Arial");
  size-adjust: 104%;        /* placeholders: compute these for your font, never guess */
  ascent-override: 92%;
  descent-override: 24%;
  line-gap-override: 0%;
}
body { font-family: "Body", "Body Fallback", system-ui, sans-serif; }
```

Fontaine computes the overrides (impeccable typeset.md), and `next/font` generates them automatically in Next.js projects.

**System stacks.** For product UI where speed beats personality: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`, and for mono `ui-monospace, "SF Mono", Menlo, Consolas, monospace`. They resolve to each platform's own UI face, which users already trust (impeccable typeset.md).

## Repo font sources

**google-fonts.csv** (`core-design/ui-ux-pro-max/data/google-fonts.csv`): 1,923 families. Columns: Family, Category, Stroke, Classifications, Keywords, Styles, Variable Axes, Subsets, Designers, Popularity Rank, Trending Rank, Is Noto, Date Added, Last Modified, Google Fonts URL. Category splits Sans Serif 709, Display 465, Handwriting 356, Serif 346, Monospace 47; Stroke adds Slab Serif (30 families). Keywords is category boilerplate (about 11 distinct strings), so the search script turns voice words into a category, never a voice: "warm mechanical opinionated" returns slab serifs. Search by class, then filter the CSV yourself:

```bash
python3 core-design/ui-ux-pro-max/scripts/search.py "slab serif" --domain google-fonts -n 10
python3 - <<'EOF'
import csv
rows = csv.DictReader(open('core-design/ui-ux-pro-max/data/google-fonts.csv', encoding='utf-8'))
for r in rows:
    if r['Stroke'] == 'Serif' and 'opsz' in r['Variable Axes'] and int(r['Popularity Rank'] or 99999) > 100:
        print(r['Family'], r['Popularity Rank'], r['Date Added'][:4], r['Subsets'])
EOF
```

Swap the conditions as needed: `'wdth' in r['Variable Axes']` for width axes, `r['Category'] == 'Monospace'`, `'cyrillic' in r['Subsets']`. Popularity Rank 1 is the most used (Roboto 2, Inter 7, Poppins 9); a rank above about 100 skips the mass-market faces, and a recent Date Added often means less training-data saturation, but recency is not quality, so test it. The ui-ux-pro-max SKILL.md shows `skills/ui-ux-pro-max/...` paths; in this repo use the paths above.

**typography.csv** (`core-design/ui-ux-pro-max/data/typography.csv`): 73 pairing rows (Font Pairing Name, Category, Heading Font, Body Font, Mood/Style Keywords, Best For, Google Fonts URL, CSS Import, Tailwind Config, Notes); search with `--domain typography`. Saturated by the table above (heading or body face flagged): rows 1, 2, 3, 4, 5, 8, 9, 11, 12, 13, 14, 17, 18, 20, 29, 31, 33, 39, 41, 43, 44, 46, 54, 55, 56, 58, 59, 60, 62, 63, 64, 65, 66, 67, 69, 70, 71 and 73 (38 of 73). Not flagged but genre costume: row 32 (Cinzel for real estate), rows 36 and 68 (Orbitron), row 52 (Press Start 2P). Data faults: the "Bauhaus Geometric" row (Outfit with Outfit) is fused onto row 57's line, so search never returns it; rows 20 and 39 name Fontshare faces but their import URLs load DM Sans, Outfit and Rubik instead.

**impeccable** (`core-design/impeccable/reference/typeset.md`, `brand.md`, `product.md`): the font selection procedure and reflex-reject list (brand.md), loading and OpenType detail (typeset.md), and the product register's one-family rule (product.md).

**brand-systems** (`design-systems/brand-systems/<slug>/`): section 3 of each `DESIGN.md` (Typography Rules) gives the real faces, scale, weights and tracking, and `tokens.css` carries `--font-display`, `--font-body`, `--font-mono`, `--text-xs` to `--text-4xl`, `--leading-*` and `--tracking-display`. Many brands use proprietary faces (sohne-var at Stripe, NotionInter at Notion, SF Pro at Apple): use the "Note on Font Substitutes" section where a DESIGN.md has one, and never present a substitute as the brand's own face. The adjective-named style folders mostly use Inter, or Georgia with Inter: treat them as saturated.

**Local font files** (`image-direction/canvas-design/canvas-fonts/`): dozens of OFL TTF files for offline rendering and canvas work (for example Big Shoulders, Gloock, Young Serif, Tektur, Silkscreen, Red Hat Mono). Several are saturated (Instrument Sans and Instrument Serif, Outfit, Lora, Crimson Pro, IBM Plex Mono and IBM Plex Serif, Bricolage Grotesque, Geist Mono). Convert to WOFF2 before web use.

**theme-factory and html-ppt:** theme-factory themes use DejaVu and FreeSans (render fonts for slides and PDFs), and most html-ppt themes set Inter as `--font-sans`; neither is a source of web type choices.

## Typography slop checks

Each is a yes or no; any yes needs a fix or a written reason.

- A face from Saturated typefaces is used without its "still legitimate" condition written in the log.
- The shipped face is the first one you thought of, or the one from the last project (unslop SKILL.md step 2).
- More than three families, or two similar faces from one class.
- A lone italic or serif word dropped into a headline for flavor (rule 3).
- Monospace on nav, labels or captions of a brand that is not a developer tool (rule 4).
- A tiny uppercase tracked eyebrow above every section (rule 2).
- A headline of four or more lines at 390px, a one-word last line, or no `text-wrap: balance` (rule 16).
- Body under 16px, measure over 75ch, or line height under 1.4.
- Display tracking tighter than -0.04em, or all caps with no added tracking.
- Numbers in tables, prices, stats or timers without `tabular-nums` (rule 18).
- Straight quotes or apostrophes in display copy, or any em or en dash.
- Fonts from a CDN with no metric-matched fallback, more than four weights loaded, or a preload without `crossorigin`.
- Faux bold or italic: a weight or style used but not loaded, and no `font-synthesis: none`.
- A commercial trial font in shipped code without a license, unreported to the user.

## Sources

- [S1] Robert Bringhurst, The Elements of Typographic Style, 1992.
- [S2] Ellen Lupton, Thinking with Type, 2004.
- [S3] Erik Spiekermann and E. M. Ginger, Stop Stealing Sheep & Find Out How Type Works, 1993.
- [S4] Stephen Coles, The Anatomy of Type, 2012.
- [S5] Tim Brown, Flexible Typesetting, 2018.
- [S6] Richard Rutter, Web Typography, 2017.

Repo files are cited by path and were read for this library; Google Fonts family names were checked against google-fonts.csv. No web source could be opened while it was written, so none is cited.
