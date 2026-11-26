# UI and UX patterns library

Shared reference for the UX strategist, the frontend engineer and the design critic in the unslop studio. Components and flows here are conventions with a long history [S1], and in product UI familiarity is an affordance (`core-design/impeccable/reference/product.md`), so honor them rather than reinventing them for flavor. Where a real choice exists (select or radios, tabs or accordion, modal or inline, pages or infinite scroll), each side says when it fits and when it fails; none is the default. "Rule N" means rule N in `core-design/unslop/SKILL.md`. A component is not done until every state on its States line exists and has been seen in a screenshot (rule 19).

## Contents

- [Components](#components): buttons, links, inputs, selects, checkboxes and radios, toggles, tabs, accordions, menus, dialogs, drawers, toasts, tooltips and popovers, cards, tables, lists, pagination, breadcrumbs, search, filters, sliders, date pickers, file upload, avatars, badges, progress, skeletons, steppers
- [States and feedback](#states-and-feedback): timing thresholds, the six async states, other states to plan, choosing a feedback channel
- [Forms](#forms): labels, validation timing, error messages, input types and autocomplete, long forms, formats and limits
- [Navigation and information architecture](#navigation-and-information-architecture), [Data display](#data-display)
- [Flows](#flows): onboarding, authentication, checkout, settings, search and filter, create-read-update-delete, invites and permissions, import and export, notifications
- [Repo pattern sources](#repo-pattern-sources), [Sources](#sources)

## Components

Native element first, ARIA only where no element exists (`core-design/web-design-guidelines/references/guidelines.md`). Every focusable element gets a `:focus-visible` ring with at least 3:1 contrast against the colors next to it, and the AAA bar adds a size of at least a 2 CSS px perimeter [S2]. Touch target sizes are in `core-design/unslop/references/library/layout.md` (Responsive rules and touch targets).

### Buttons
- **Purpose and anatomy:** start an action. A verb plus object label, an optional leading icon from the page's one family, a container; one primary per view, with quieter secondary and tertiary styles (rule 10).
- **States:** default, hover, focus-visible, active (a darker fill or a 1px shift, any transition 120-250ms ease-out per rule 20), disabled (with the reason shown nearby), loading (same width, spinner inside, repeat presses blocked), success where the result appears in place ("Saved").
- **Accessibility:** `<button>` for actions and `<a>` for navigation; `type="button"` unless it submits; icon-only buttons carry an `aria-label`; label contrast 4.5:1 on its fill (rule 15).
- **AI mistake:** two equal primaries side by side; "Learn more" and "Submit" labels; labels wrapping to two lines; a submit button disabled until the form is valid, which hides why nothing happens (keep it enabled and validate on press, per `core-design/web-design-guidelines/references/guidelines.md`).

### Links
- **Purpose and anatomy:** go somewhere. Text that names the destination; in running text an underline or another cue besides color.
- **States:** default, hover, focus-visible, active, visited where history matters (docs, search results); external destinations marked.
- **Accessibility:** a real `<a href>`, so Cmd-click, middle-click and copy-link work; text that makes sense out of context ("View pricing plans", not "Click here", per `core-design/impeccable/reference/clarify.md`).
- **AI mistake:** `<div onClick>` navigation; links styled as buttons and buttons styled as links, so the look and the behavior disagree; links told apart by color alone.

### Text inputs
- **Purpose and anatomy:** free text. A visible label above, an optional hint, the field, an error slot below, a character count when there is a limit; the field's width hints at the expected length.
- **States:** default, hover, focus-visible, filled, disabled, read-only (selectable, not greyed out), error (message, icon and border, never color alone), success only where it helps (a username that is available).
- **Accessibility:** `<label for>`; hint and error tied with `aria-describedby`; `aria-invalid="true"` on error; the right `type`, `inputmode` and `autocomplete` (see Forms).
- **AI mistake:** the placeholder as the only label; placeholder text under 4.5:1 (rule 15); every field full width whatever its expected length.

### Selects and comboboxes
- **Purpose and anatomy:** pick from a set. With only a few options, radio buttons show every choice and need one click; Baymard's checkout research puts the drop-down's useful range at roughly 5-10 options and warns that the numbers are not rigid [S3]. Long lists (countries, time zones) need type-ahead or a filtering combobox.
- **States:** default, hover, focus-visible, open, option highlighted, selected, disabled, error, loading options.
- **Accessibility:** native `<select>` first; a custom one follows the APG combobox or listbox pattern with arrow keys, Enter, Escape and type-ahead [S4]; give native selects explicit background and text colors so they survive dark mode.
- **AI mistake:** a div dropdown with no keyboard support; a list clipped by an `overflow: hidden` ancestor (fixes in `core-design/impeccable/reference/interaction-design.md`); a select holding two options.

### Checkboxes and radio buttons
- **Purpose and anatomy:** checkboxes for independent on/off choices or several picks; radios for exactly one of a small set, all visible.
- **States:** unchecked, checked, indeterminate (a parent over a partial selection), hover, focus-visible, disabled, error on the group.
- **Accessibility:** native inputs; groups in a `<fieldset>` with a `<legend>`; label and control share one hit target; Space toggles a checkbox and arrow keys move within a radio group.
- **AI mistake:** custom boxes that hide the native input and lose the focus ring; 14px hit areas; a preselected radio that opts people into something they did not choose, such as a paid add-on.

### Toggles
- **Purpose and anatomy:** a binary setting that takes effect immediately; when the change waits for a Save button, use a checkbox instead [S5]. The label names the setting; the track and thumb show the state.
- **States:** off, on, hover, focus-visible, disabled, pending (waiting for the server), error (revert and explain).
- **Accessibility:** `<button role="switch" aria-checked>` or `<input type="checkbox" role="switch">`; the label stays the same while the state changes; state shown by thumb position as well as color.
- **AI mistake:** toggles inside a form with a Save button; labels that flip between "Enable" and "Disable"; green versus grey as the only cue.

### Tabs
- **Purpose and anatomy:** switch between peer views of one object without leaving the page. A few long sections suit tabs; many short ones suit an accordion, which also copes better with narrow screens [S6]. A tablist of 2-7 short labels, a selected indicator, a panel.
- **States:** default, hover, focus-visible, selected; disabled tabs are rare, so prefer hiding or explaining.
- **Accessibility:** the APG tabs pattern: `tablist`, `tab` and `tabpanel` roles, `aria-selected`, arrow keys between tabs; automatic activation when panels render instantly, manual activation (Enter or Space) when a panel is slow to load [S4]; put the active tab in the URL when the view is worth sharing.
- **AI mistake:** tabs used to move between pages (use links); panels of different heights that make the page jump; filters dressed up as tabs.

### Accordions and disclosures
- **Purpose and anatomy:** progressive disclosure of optional detail (FAQ answers, advanced settings). The summary text names the content; a chevron from the icon family shows the state.
- **States:** collapsed, expanded, hover, focus-visible.
- **Accessibility:** `<details>` with `<summary>`, or a button with `aria-expanded` and `aria-controls` inside a heading [S4].
- **AI mistake:** critical information hidden in a collapsed panel; an accordion around three short answers that would fit open; everything collapsed on desktop, which makes the page look empty [S6].

### Menus
- **Purpose and anatomy:** a list of actions revealed from a trigger (row actions, account, "More"). Destructive items sit last and look different.
- **States:** trigger default, hover, focus-visible, expanded; items with hover, focus, disabled (with the reason) and checked where they toggle.
- **Accessibility:** the APG menu button: `aria-haspopup`, `aria-expanded`, arrow keys inside, Escape closes and returns focus to the trigger [S4]; the `popover` attribute gives top-layer stacking and light dismiss and has been Baseline since January 2025 [S7]; site navigation uses a disclosure of links, not `role="menu"`.
- **AI mistake:** hover-only menus; menus cut off by a scrolling container; an icon beside every item that restates its text (rule 12).

### Dialogs
- **Purpose and anatomy:** block the task for a decision, or for input the task cannot continue without; NN/g reserves modals for critical warnings and required information [S8]. Try inline, a drawer or a page first (the "modal as first thought" ban in `core-design/impeccable/reference/product.md`). Title, body, specific actions ("Delete project" and "Keep project"), close button.
- **States:** opening, open, submitting, error inside the dialog, closing with focus returned to the trigger.
- **Accessibility:** `<dialog>` opened with `showModal()` renders in the top layer with a `::backdrop`, keeps the rest of the page out of reach and closes on Escape [S9]; `closedby="any"` adds click-outside dismissal but was not Baseline when checked, so feature-detect it [S9]; label the dialog with its title; `overscroll-behavior: contain` on scrolling content.
- **AI mistake:** a modal on page load; "Are you sure?" for reversible actions where undo serves better (`core-design/impeccable/reference/interaction-design.md`); the page scrolling behind the dialog.

### Drawers and sheets
- **Purpose and anatomy:** a side task or detail beside the current context (filters on mobile, a cart, a preview). An edge-anchored panel with title, close button and content, plus a sticky footer when it holds actions.
- **States:** closed, opening, open, loading content, error; modal drawers follow the dialog rules, non-modal drawers leave the page usable.
- **Accessibility:** modal drawers get dialog semantics and focus management; non-modal drawers are a labeled region with no focus trap; swipe-to-close always comes with a visible close button (row 30 of `core-design/ui-ux-pro-max/data/app-interface.csv`).
- **AI mistake:** a drawer as the main desktop navigation; drawer content that only makes sense with the covered page visible.

### Toasts
- **Purpose and anatomy:** a brief, non-blocking confirmation that an action finished, optionally with Undo: "Invoice 2207 archived. Undo".
- **States:** entering, visible, paused while hovered or focused, leaving; queued when several arrive.
- **Accessibility:** inject the text into a live region that already exists in the DOM (`role="status"` for routine news, `role="alert"` only for urgent news), so it is announced without moving focus (WCAG 4.1.3) [S10]; keep any toast with an action until dismissed, and auto-dismiss only text-only confirmations (row 82 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv` suggests 3-5 seconds). Roselli found few toast implementations that would pass an audit, so test yours [S10].
- **AI mistake:** errors that need fixing shown only in a toast; toasts covering the primary action on mobile; four toasts stacked at once.

### Tooltips and popovers
- **Purpose and anatomy:** a tooltip is a short label or hint for a control (an icon button's name, its shortcut); a popover holds richer or interactive content anchored to a trigger.
- **States:** hidden; tooltip shown on hover and on focus after a short delay; popover shown on click; both dismissed by Escape.
- **Accessibility:** the trigger is focusable; tooltip text is referenced with `aria-describedby` and is never the only home of essential information; interactive content belongs in a `popover` element, not a tooltip [S7]; anchor positioning has been Baseline since January 2026, when Firefox shipped it, but some Safari versions support it only partly, so keep a fallback [S11].
- **AI mistake:** tooltips on elements that cannot take focus; tooltips that repeat the visible label (rule 2); instructions that exist only on hover, which touch never shows.

### Cards
- **Purpose and anatomy:** one self-contained, actionable object in a collection (a listing, a file, a product). Optional media, title, metadata, one main action. Make the whole card clickable only when it has one destination, by stretching the title link with a pseudo-element.
- **States:** default, hover, focus-visible on the link, selected in selectable sets, loading as a skeleton, unavailable (sold out, archived) with the reason.
- **Accessibility:** the title is a heading inside an `<article>` or `<li>`; one link per destination; never wrap a whole card in an `<a>` that contains buttons.
- **AI mistake:** cards that only hold text, cards inside cards (rule 8), identical cards for unequal things (rule 7), an inner radius that is not the outer radius minus the padding (rule 14).

### Tables
- **Purpose and anatomy:** compare records across attributes; when people scan, sort or compare, use a table rather than cards. Caption, header row, rows, numeric columns right-aligned in tabular figures (rule 18), row actions, an optional selection column.
- **States:** loading (skeleton rows at real column widths), empty (with a create action), no results (with clear filters), error (with retry), partial (a failed column marked), row hover, selected, editing, sorted column marked.
- **Accessibility:** `<table>` with `<th scope>`; sort controls are buttons in the header cells, with `aria-sort` on the sorted `<th>`; a labeled, focusable scroll container on narrow screens, since tables are exempt from reflow but not from usability [S12].
- **AI mistake:** div grids pretending to be tables; zebra stripes plus borders plus a card wrapper; a unit repeated in every cell instead of the header (rule 2); centered numbers.

### Lists
- **Purpose and anatomy:** a single column of one type of item (messages, files, results). Optional leading visual, primary text, secondary text, trailing metadata or action.
- **States:** loading (skeleton rows), empty, error, selected, unread or new (a real state, so a badge or weight change is allowed by rule 1); swipe actions on touch, each with a visible alternative.
- **Accessibility:** `<ul>` or `<ol>`; interactive rows contain a real link or button; virtualize long lists past about 50 items (`core-design/web-design-guidelines/references/guidelines.md`).
- **AI mistake:** a divider under every row on top of card backgrounds; a status dot on every row; truncating the only text that tells items apart.

### Pagination and loading more
- **Purpose and anatomy:** split long result sets. Pages help people find and return to a position; infinite scroll suits browsing feeds but blocks the footer and gives a false sense of completeness; "Load more" sits between the two [S13]. Previous, next, current, nearby pages, and the total when known.
- **States:** current page, hover, focus-visible, disabled ends, loading the next set (existing items stay, skeleton rows appended).
- **Accessibility:** `<nav aria-label="Pagination">` with `aria-current="page"`; the page number in the URL; after "Load more", focus stays where it was and the number of new items is announced.
- **AI mistake:** infinite scroll above a footer people need; page links too small to tap; jumping to the top after "Load more".

### Breadcrumbs
- **Purpose and anatomy:** location in a hierarchy of three or more levels and shortcuts upward (row 6 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv`). Ancestor links, then the current page last as plain text [S14].
- **States:** links with hover and focus-visible; on narrow screens middle levels truncate instead of the trail wrapping onto two lines [S14].
- **Accessibility:** `<nav aria-label="Breadcrumb">` around an ordered list, with `aria-current="page"` on the last item; separators drawn in CSS so they are not read aloud.
- **AI mistake:** breadcrumbs on a flat site; a trail ending in a copy of the H1 directly below it (rule 2).

### Search
- **Purpose and anatomy:** find a known item or narrow a large set. A labeled input, submit, a clear button, suggestions, a scope selector only if real scopes exist, results that echo the query and the count.
- **States:** empty (recent or popular searches), typing (debounced suggestions), loading, results, no results with corrections, a broader scope and clear filters (row 90 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv`), error.
- **Accessibility:** `role="search"` on the form, `type="search"` on the input, suggestions as an APG combobox [S4]; a shortcut such as `/` shown in `<kbd>`.
- **AI mistake:** a header search on a five-page site; a dead-end "0 results"; a magnifier icon as the only label.

### Filters
- **Purpose and anatomy:** narrow results by known attributes. Facet groups with counts, applied filters as removable chips, "Clear all", the result count, sort.
- **States:** unapplied, applied, an option with zero results (disabled with its count, or hidden), results loading; on mobile a sheet with a "Show 24 results" button.
- **Accessibility:** checkboxes and radios in fieldsets; result count changes announced in a live region; filters in the URL, so results can be shared and the back button restores them.
- **AI mistake:** every tap reloading results on mobile and losing the scroll position; no visible record of what is applied; chips as decoration.

### Sliders
- **Purpose and anatomy:** set a value or range where approximate is fine and the effect is visible (volume, a price filter, image size). Track, thumb, the current value as text, min and max labels; pair it with a typed field when exact values matter.
- **States:** default, hover, focus-visible, dragging, disabled, error when a typed value falls out of range.
- **Accessibility:** native `<input type="range">` with a label and a visible value, or the APG slider pattern with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` for formatted values [S4]; arrow keys step and Page Up and Page Down jump; the thumb's hit area meets the touch target sizes.
- **AI mistake:** sliders for exact numbers (quantities, years); a value visible only while dragging; a two-thumb range with no typed inputs for its ends.

### Date pickers
- **Purpose and anatomy:** enter a date or a range. Let people type: typing is often the fastest input, especially for distant dates such as birthdays, and a short list beats a calendar when only a few dates are possible [S15]. Add a calendar when weekdays or ranges matter (bookings, scheduling).
- **States:** default, focus-visible, open, day hover and focus, selected, in range, unavailable days (with the reason), error (unparseable or out of range), today marked.
- **Accessibility:** the expected format in the hint; the calendar as a dialog holding a grid, with arrow keys moving by day and Page Up and Page Down by month (APG date picker dialog example) [S4]; the selected date announced in words; native `<input type="date">` where its look is acceptable.
- **AI mistake:** calendar-only entry for a birth date; ambiguous numeric formats with no hint; a field that refuses typed input.

### File upload
- **Purpose and anatomy:** attach files. A labeled button over the native `<input type="file">`, a drop zone as an enhancement, accepted types and size limit stated before upload, a file list with name, size, progress and remove.
- **States:** idle, drag-over, uploading (determinate, per file), processing, done, error per file (too large, wrong type, network) with retry, cancelled.
- **Accessibility:** the native input stays reachable by keyboard, so dragging is never the only way in; progress announced at milestones, not at every percent.
- **AI mistake:** a dashed cloud box with no limits stated; one error for the whole batch; a drop-only zone.

### Avatars
- **Purpose and anatomy:** recognize a person or team at a glance. An image in the page's radius system, an initials fallback with 4.5:1 text, presence shown only when presence is real.
- **States:** image, loading (a neutral shape of the same size), initials fallback, a group with a "+5" overflow that opens the full list.
- **Accessibility:** `alt` is the name when no visible name sits beside the image, `alt=""` when one does (rule 2).
- **AI mistake:** stock faces or generic person icons for invented users; a green dot on every avatar (rule 1).

### Badges and status labels
- **Purpose and anatomy:** state something the reader acts on, once (rule 1): "Overdue", "3 unread", "Payment failed". Short text, an optional icon from the page's family, color as reinforcement only.
- **States:** one style per semantic role (neutral, info, success, warning, danger); large counts capped ("99+") with the exact number in the accessible name.
- **Accessibility:** 4.5:1 text inside the badge; never color alone; count badges on icons get an accessible name ("Notifications, 3 unread").
- **AI mistake:** "New", "Beta" and "AI" pills as decoration; five status colors on one screen with no legend; tags laid over images.

### Progress indicators
- **Purpose and anatomy:** show that work is happening and how far along it is. A determinate bar with a percentage and what is happening ("Uploading 3 of 8 files"), or an indeterminate spinner for short waits of unknown length (thresholds under States and feedback).
- **States:** indeterminate, determinate, paused, complete, failed with retry; cancel for long waits.
- **Accessibility:** `<progress>` or `role="progressbar"` with value attributes and a label; completion announced.
- **AI mistake:** a spinner on a 40-second job; a bar that stalls at 99%; filled-track bars used as decorative "skill levels".

### Skeletons
- **Purpose and anatomy:** preview the structure of incoming content while it loads [S16], with blocks at the final sizes of text lines, media and controls, static or with a slow, subtle shimmer. They soften a wait; they do not replace performance work [S16].
- **States:** loading, then content replacing it in place; on failure the error appears in the same box.
- **Accessibility:** `aria-busy="true"` on the region while loading; the shapes `aria-hidden`; no shimmer under `prefers-reduced-motion`.
- **AI mistake:** generic grey bars that do not match the final layout (rule 19); skeletons that flash for 100ms loads; skeletons for actions, which need a button loading state instead.

### Steppers
- **Purpose and anatomy:** position in a short, known sequence (checkout, application, setup). Step names taken from the content ("Shipping", "Payment", "Review"), the current step, completed steps that can be revisited, the total.
- **States:** upcoming, current, completed, error (a step holds invalid data), unavailable until earlier steps are done.
- **Accessibility:** an ordered list with `aria-current="step"`; the page heading also says "Step 2 of 4: Payment".
- **AI mistake:** "Step 1 / Step 2" with no names; a stepper on a two-step flow; letting people jump into steps that depend on unfinished ones.

## States and feedback

**Timing thresholds.**
- Under 0.1 s a response feels instant; up to about 1 s the user's train of thought holds; past about 10 s attention drifts from the task [S17]. The Doherty threshold puts a productive pace under 400ms [S18].
- Acknowledge every input at once: pressed state, optimistic change or inline update, within the same frame where possible.
- For actions that usually finish within a second, show only that immediate state; a spinner there just flashes [S19]. When duration is unknown, delay the indicator by about 300ms (row 78 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv`), so fast responses never show it.
- Looped spinners suit short waits only; past about 10 seconds use percent-done progress, the most informative kind, and add what is happening, a cancel action and a way to leave and be notified [S19].
- Content regions loading as a whole use skeletons; actions use the loading state of the control that started them.

**The six async states.** Design each one wherever data loads; they are part of the layout, not an afterthought (rule 19).
- **Loading:** skeleton for content, in-control progress for actions, and words for anything past a few seconds ("Importing 1,240 contacts").
- **Empty:** first use (what will appear here, why it helps, one action, a template), cleared by the user (a light touch, easy to refill), no results (echo the query, suggest, clear filters), no permission (why, and who can grant access); types from `core-design/impeccable/reference/onboard.md`. Empty states communicate status, teach the interface and offer a direct path to the key task [S20].
- **Error:** what happened, why if known, and how to fix it, next to the cause; keep everything the user typed; retry for network failures; map HTTP statuses as in `core-design/impeccable/reference/harden.md`. "Something went wrong" alone is not an error message.
- **Success:** confirm the specific outcome and what happens next, where the action happened; a toast only when the result is out of view; no confetti for routine actions.
- **Offline:** a persistent banner that says the connection is lost and what still works; changes queued with a visible pending marker; on reconnect, sync and report conflicts item by item.
- **Partial or stale data:** render what arrived and give the failed region its own error and retry, because one failing widget never blanks the page (`core-design/impeccable/reference/harden.md`); show the age of cached data ("Updated 4 min ago") with a refresh action.

**Other states to plan.**
- **Permission and read-only:** say why a control is unavailable and who can change that; show read-only data as text, not as disabled inputs that look broken.
- **Rate limits and quotas:** name the limit that was hit and when it resets ("3 invites left today, resets at 00:00 UTC").
- **Concurrent edits:** when someone else changed the same record, show what changed and let the person keep their version or reload.

**Choosing the channel.**
- Validation messages sit inline, anchored to their field; toasts and banners carry news that needs little interaction; modal dialogs are for severe problems that need resolving [S21].
- Optimistic updates fit low-stakes reversible actions (likes, reordering), never payments or deletions (`core-design/impeccable/reference/interaction-design.md`).
- Undo beats confirmation for reversible actions; confirm an irreversible one by naming the object and the consequence (`core-design/impeccable/reference/clarify.md`).
- Feedback motion uses transform and opacity at 120-250ms with ease-out and honors reduced motion (rule 20); read `motion/emil-design-eng/SKILL.md` before deciding to animate at all.

## Forms

- **Labels and layout.** A visible label above each field, short and specific; a hint between label and field for format or reasons; one column; related fields in a `<fieldset>` with a `<legend>`; field width matched to the expected answer. Mark whichever is rarer, required or optional, and explain the marker once.
- **Validation timing.** Validate a field when the person leaves it. In Wroblewski's test, feedback after the answer worked better than feedback while people were still typing, which raised completion times and errors, and the best inline variant raised success rates 22% and cut errors 22% against a form that validated only on submit [S22]. Once a field shows an error, re-check it on every input so the message clears the moment it is fixed. Do not flag an empty required field just because someone tabbed past it. Password strength and character counts update live. Always validate again on submit and on the server (`core-design/impeccable/reference/harden.md`).
- **Submitting with errors.** Show an error summary at the top that receives focus and links to each field, plus the message beside each field [S23]; for short forms, focusing the first invalid field also works (`core-design/web-design-guidelines/references/guidelines.md`). Keep every value the person entered. Browser-native validation bubbles cannot be styled or worded consistently, which is why GOV.UK turns them off with `novalidate` [S23].
- **Writing error messages.** Say what is wrong and how to fix it in the field's own terms: "Enter a date in the past", not "Invalid date". Avoid "valid", "invalid" and "please" [S23]. No blame and no jokes; templates by situation are in `core-design/impeccable/reference/clarify.md`. The summary and the inline message use the same words.
- **Input types and autocomplete** [S24]. Paste and password managers stay allowed everywhere, because they are the assistance WCAG 3.3.8 expects at sign-in and blocking them can fail it [S25].

| Field | Markup |
|---|---|
| Email | `type="email" autocomplete="email" spellcheck="false"` |
| Phone | `type="tel" autocomplete="tel"` |
| Full name | `autocomplete="name"`; split into `given-name` and `family-name` only when the data needs it |
| Username | `autocomplete="username" spellcheck="false"` |
| New password | `type="password" autocomplete="new-password"`, a show/hide toggle, the rules shown before typing |
| Current password | `type="password" autocomplete="current-password"` |
| One-time code | `inputmode="numeric" autocomplete="one-time-code"`, one field that accepts paste |
| Street address | `autocomplete="street-address"` or `address-line1` and `address-line2`, plus `address-level2` (city), `postal-code` and `country-name` |
| Payment card | `cc-name`, `cc-number`, `cc-exp` and `cc-csc` tokens, with `inputmode="numeric"` on the digit fields |
| Account or ID number | `type="text" inputmode="numeric"`, not `type="number"`, which adds spinners and changes value on scroll |
| Website | `type="url" autocomplete="url"` |
| Search | `type="search"` |

- **Long and multi-step forms.** Split into steps only when sections are independent or later questions depend on earlier answers; save progress per step; name the steps in a stepper; let people review every answer before the final submit.
- **Server-side checks.** For checks that need the server (a username that is taken, an address lookup), show a small in-field pending state after the person pauses or leaves the field, then the result; never block typing while the check runs.
- **Formats and limits.** Accept input in any reasonable format (spaces in card numbers, brackets in phone numbers) and normalize it afterwards, because masks that fight the cursor or reject pasted values cost more than they save. State limits before people reach them ("Up to 280 characters") and show the remaining count near the limit.
- **Submit and after.** A specific button label; enabled until the request starts, then a loading state that blocks double submission; on success, replace the form with a confirmation or move to the result; warn before leaving with unsaved changes (`core-design/web-design-guidelines/references/guidelines.md`). Wroblewski's book covers label placement, grouping and actions in depth [S26].

## Navigation and information architecture

- **Start from tasks.** List the top tasks by frequency and importance, then group them the way users think (card sorting when possible), not by org chart.
- **Labels.** Use the words users use, and one term per concept across navigation, headings and buttons (terminology table in `core-design/impeccable/reference/clarify.md`). Every label should predict what sits behind it; a label that needs a tooltip to explain it is the wrong label.
- **Breadth and depth.** Keep primary navigation to a handful of items; broad and shallow suits browsing, while deep trees need breadcrumbs and search.
- **Where am I.** Every navigation marks the current location (`aria-current` plus a visible state), and the page title matches the label that led there.
- **Conventions.** People expect a site to work like the sites they already use (Jakob's law) [S18]: the logo linking home, the account at the top end and the cart in commerce are conventions, not slop.
- **Visible over hidden on desktop.** Hidden desktop navigation gets used far less than visible navigation [S27]; layout options are under Navigation patterns in `core-design/unslop/references/library/layout.md`.
- **State in the URL.** Tabs, filters, sort, pagination and selected items live in the URL, so links, refresh and the back button all work (row 4 of `core-design/ui-ux-pro-max/data/ux-guidelines.csv`; `core-design/web-design-guidelines/references/guidelines.md`).
- **Mobile.** Bottom tabs for 3-5 frequent destinations, a menu sheet for the rest, and no gesture-only navigation.
- **Landmarks.** `header`, `nav`, `main` and `footer`, plus a skip link to the main content.

## Data display

- **Pick the form by the question.** Comparing records across attributes calls for a table, browsing visual items for cards or a gallery, the shape of data over time or across a distribution for a chart, and one number that triggers action for a stat with its comparison.
- **Numbers.** Tabular figures on every column, stat, price, timer and counter (rule 18); numeric columns and their headers right-aligned; the same decimals within a column; the unit in the header, not in each cell (rule 2); locale formatting through `Intl.NumberFormat`; negatives with a minus sign, not red alone; abbreviations (1.2K) only in summaries, with the exact value one step away.
- **Deltas and dates.** Name the comparison period ("vs previous 30 days"), pair sign and arrow with color, and leave neutral changes uncolored. Relative times for recent activity ("2 h ago") keep the absolute time available on focus or hover; elsewhere, absolute dates through `Intl.DateTimeFormat`.
- **Charts.** Choose by data type and question in `core-design/ui-ux-pro-max/data/charts.csv`, which gives the best chart, when not to use it, volume thresholds and an accessible fallback. One accent for the series that matters and neutrals for the rest (rule 11); direct labels instead of a legend when there are few series; bars that start at zero; no 3D, no dual axes, no pie with many slices; spend the ink on data, not decoration [S28]; a table or text summary as the alternative; tooltips reachable by keyboard.
- **Many series.** Small multiples on a shared scale read better than one crowded chart [S28].
- **Narrow screens.** Rank the columns: keep the identifier and the one or two columns people decide on, and move the rest behind a row disclosure or into a horizontal scroll with a sticky first column.
- **Live values.** Updating numbers keep tabular figures so they do not jitter (rule 18); mark a change with a brief tint rather than motion, and never re-sort rows under the pointer while someone is reading or about to click.
- **Chart states and volume.** A skeleton frame with axes while loading, "No data for this period" with a control to change the range, errors inside the chart frame. For large sets, paginate or virtualize, filter on the server, and always show the total count.

## Flows

### Onboarding
- **Goal:** the first real success, fast; onboarding exists to reach value, not to teach everything (`core-design/impeccable/reference/onboard.md`).
- **Build:** ask only what is needed to start; offer templates or clearly labeled sample data; teach in context through empty states and one-time hints; tours only for complex tools, 3-7 steps, always skippable.
- **States:** skipped, partly done (resume where they left off), returning user (never shown again), first success with one clear next step.
- **AI mistake:** a three-screen carousel of illustrations and pagination dots before the product appears, the structure `templates/mobile-onboarding/SKILL.md` builds (fine when the brief asks for those screens; put a real action on the first one); mandatory tours; confetti.

### Authentication
- **Sign in:** identifier and password fields with `username` and `current-password` autocomplete so password managers can fill them; a show/hide toggle; "Forgot password?" beside the password field; a method that needs no memory (passkey, email link or SSO) where possible, because recalling a password counts as a cognitive function test under WCAG 3.3.8 [S25].
- **Errors and limits:** "Email or password is incorrect" without saying which; lockouts and rate limits say when to try again.
- **Sign up and codes:** the fewest fields, password rules visible before typing and ticked off as met, email verification after first access where risk allows; one-time codes in a single field with `one-time-code` autocomplete that accepts paste, and a resend control with a visible timer.
- **AI mistake:** social buttons with emoji or off-brand colors; placeholder labels; one box per code digit that breaks paste; a "Submit" button. Checklist: `templates/login-flow/references/checklist.md`.

### Checkout
- **Build:** guest checkout as the most prominent option, with account creation offered at confirmation [S29]; the order summary visible at every step; shipping and tax shown as soon as they are known; named steps (contact, delivery, payment, review) or a single page for short carts.
- **Payment:** card fields with the autocomplete tokens above, supported wallets offered before the card form, security information beside the pay button, and a pay button that states the amount ("Pay $48.20").
- **After:** the order number, what happens next and the confirmation email that was sent.
- **AI mistake:** fake trust seals; a disabled pay button that never says which field is missing; totals without tabular figures, jumping as they update.

### Settings
- **Build:** groups that follow the user's model, with search once there are many settings; instant toggles kept apart from forms saved by a button; a visible save status ("Saved", "Unsaved changes"); personal, workspace and billing settings apart when permissions differ.
- **Danger zone:** destructive actions isolated, each naming its consequence; irreversible ones confirmed by naming the object, and typing its name works for the highest stakes.
- **AI mistake:** one giant form with a single Save at the bottom; toggles that silently wait for Save.

### Search and filter
- **Build:** query, suggestions, results with count and query echo, facets, sort, applied-filter chips, pagination or load more, all of it in the URL so the back button restores the exact view.
- **Layout:** facets beside results on wide screens; on phones a filter button showing the applied count that opens a sheet.
- **Recovery:** typo tolerance, highlighted matches, recent searches, and a no-results state with a next step.
- **AI mistake:** filters that reset on back navigation; a dead-end empty result.

### Create, read, update, delete
- **Create and read:** inline creation for simple objects, a page or drawer for complex ones, sensible defaults; afterwards, show and highlight the new item instead of a blank form; list and detail views, each deep-linkable, with the list form chosen by the data (table, list or cards).
- **Update:** inline edit for single fields (Enter saves, Escape cancels); forms for multi-field edits; autosave with a visible status where people expect documents; a notice when someone else changed the same record.
- **Delete:** undo for reversible deletes; a confirmation naming the item and the consequence for irreversible ones; bulk actions that state the count ("Delete 12 invoices", per `core-design/impeccable/reference/clarify.md`).
- **States:** empty collection, a pending row during an optimistic create, a failed save that keeps the edits, a read-only mode that explains the missing permission.
- **AI mistake:** "Are you sure?" on everything; a modal to edit one field.

### Invites and permissions
- **Build:** invite by email with the role chosen in the same step; roles described by what they allow, not just named; pending invites listed with resend and revoke; the inviter can see who accepted.
- **States:** sent, pending, expired (with resend), accepted, failed (a bounced address), seat limit reached (with the upgrade or remove path).
- **Access requests:** someone without access sees what they tried to open, who owns it and a "Request access" action, not a bare 403 (permission states in `core-design/impeccable/reference/harden.md`).
- **AI mistake:** an "Admin, Member, Viewer" select with no explanation of what each can do; invites that fail silently.

### Import and export
- **Build:** upload (see File upload), then column mapping with automatic matches shown for confirmation, a preview of the first rows with problems flagged, then the import with determinate progress.
- **Results:** a summary of what was imported, skipped and failed, with a downloadable per-row error report; imports that take minutes run in the background and notify when done.
- **Export:** format and scope stated before export ("1,204 rows, current filters"); large exports delivered as a link when ready.
- **AI mistake:** a lone "Upload CSV" button with no mapping, preview or error report; a whole import failing because of one bad row.

### Notifications
- **Channels:** an in-app inbox for what persists, toasts for what just happened, badge counts for what needs action, email or push for what happens while people are away; choose per event by urgency.
- **Inbox and preferences:** grouped by day, an unread state, mark all as read, every item linked to its object; a category by channel matrix of preferences with sensible defaults, plus quiet hours for push.
- **AI mistake:** a bell with a permanent red dot (rule 1); notifications that link to nothing; a toast for every background event.

## Repo pattern sources

- `core-design/ui-ux-pro-max/data/ux-guidelines.csv`: 99 web and mobile UX rules (navigation, touch, forms, feedback, search) with do and don't examples; query with `python3 core-design/ui-ux-pro-max/scripts/search.py "<terms>" --domain ux`.
- `core-design/ui-ux-pro-max/data/app-interface.csv`: 30 native-app rules (labels, touch, navigation, safe areas, Dynamic Type) with good and bad code; `--domain web`.
- `core-design/ui-ux-pro-max/data/charts.csv`: 25 chart types chosen by data type, with accessibility fallbacks; `--domain chart`.
- `core-design/web-design-guidelines/references/guidelines.md`: Vercel's rules for focus, forms, content handling, URL state and anti-patterns; run it as the review pass.
- `core-design/impeccable/reference/interaction-design.md`: the eight interactive states, focus rings, `inert` and `<dialog>`, popover and anchor positioning, undo over confirm, roving tabindex.
- `core-design/impeccable/reference/harden.md` (extreme inputs, HTTP error mapping, i18n expansion, partial failure), `core-design/impeccable/reference/onboard.md` (empty state types, tours, time to value), `core-design/impeccable/reference/clarify.md` (error templates, button labels, terminology, confirmation copy), `core-design/impeccable/reference/product.md` (the product register and its bans).
- `templates/dashboard/SKILL.md` and `templates/live-dashboard/references/components.md`: KPI cards, sparklines, status pills and toasts in context.
- `templates/login-flow/SKILL.md` with `templates/login-flow/references/checklist.md`, `templates/kanban-board/SKILL.md`, `templates/mobile-app/references/layouts.md` with `templates/mobile-app/references/checklist.md`, and `templates/mobile-onboarding/SKILL.md`: auth screens, boards, six mobile screen archetypes, onboarding structure.
- `templates/pricing-page/SKILL.md`, `templates/faq-page/SKILL.md` and `templates/contact-widget/SKILL.md`: plan tables, disclosure FAQs, a chat widget.
- `design-systems/brand-systems/<brand>/components.html`: how a real system draws component states.
- `motion/emil-design-eng/SKILL.md` (whether to animate) and `motion/review-animations/SKILL.md` (checking motion once it exists); `core-design/critique/SKILL.md` as the critic's scoring gate.
- `core-design/unslop/references/library/layout.md`: page and app layouts, layout tokens, touch targets.

## Sources

- [S1] Jenifer Tidwell, Designing Interfaces, 2005.
- [S2] Sara Soueidan, guide to accessible focus indicators: https://sarasoueidan.com/blog/focus-indicators/ ; W3C, Understanding SC 2.4.13 Focus Appearance: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
- [S3] Nielsen Norman Group on listboxes and drop-downs: https://www.nngroup.com/articles/listbox-dropdown/ ; Baymard Institute on drop-down usability: https://baymard.com/blog/drop-down-usability
- [S4] W3C, WAI-ARIA Authoring Practices Guide patterns: https://www.w3.org/WAI/ARIA/apg/patterns ; tabs pattern: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- [S5] Nielsen Norman Group, toggle switch guidelines: https://www.nngroup.com/articles/toggle-switch-guidelines/
- [S6] Nielsen Norman Group on tabs: https://www.nngroup.com/articles/tabs-used-right/ ; on accordions on desktop: https://www.nngroup.com/articles/accordions-on-desktop/ ; tabs versus accordions: https://www.nngroup.com/videos/tabs-vs-accordions/
- [S7] MDN, popover attribute: https://developer.mozilla.org/docs/Web/HTML/Reference/Global_attributes/popover ; web.dev, Popover API Baseline status: https://web.dev/blog/popover-baseline
- [S8] Nielsen Norman Group on modal and nonmodal dialogs: https://nngroup.com/articles/modal-nonmodal-dialog/
- [S9] MDN, dialog element: https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/dialog ; HTMLDialogElement closedBy: https://developer.mozilla.org/docs/Web/API/HTMLDialogElement/closedBy
- [S10] GOV.UK WCAG primer, 4.1.3 Status Messages: https://alphagov.github.io/wcag-primer/sc/4.1.3.html ; Adrian Roselli on defining toast messages: https://adrianroselli.com/2020/01/defining-toast-messages.html
- [S11] web.dev, new to the web platform in January 2026: https://web.dev/blog/web-platform-01-2026 ; caniuse, CSS anchor positioning: https://caniuse.com/css-anchor-positioning
- [S12] Deque University, 1.4.10 Reflow: https://dequeuniversity.com/resources/wcag2.1/1.4.10-reflow
- [S13] Nielsen Norman Group on infinite scrolling: https://nngroup.com/articles/infinite-scrolling-tips ; on alternatives to pagination for listing pages: https://www.nngroup.com/articles/alternatives-pagination-listing-pages/
- [S14] Nielsen Norman Group on breadcrumbs: https://www.nngroup.com/articles/breadcrumbs/
- [S15] Nielsen Norman Group on date input: https://www.nngroup.com/articles/date-input/
- [S16] Nielsen Norman Group on skeleton screens: https://nngroup.com/articles/skeleton-screens/
- [S17] Jakob Nielsen, Usability Engineering, 1993; Nielsen Norman Group, the 3 response time limits: https://www.nngroup.com/videos/3-response-time-limits-interaction-design/
- [S18] Jon Yablonski, Laws of UX (Doherty threshold, Jakob's law): https://lawsofux.com/
- [S19] Nielsen Norman Group on progress indicators: https://nngroup.com/articles/progress-indicators
- [S20] Nielsen Norman Group on empty states in complex applications: https://nngroup.com/articles/empty-state-interface-design
- [S21] Nielsen Norman Group on indicators, validations and notifications: https://nngroup.com/articles/indicators-validations-notifications
- [S22] Luke Wroblewski, Inline Validation in Web Forms, A List Apart: https://alistapart.com/article/inline-validation-in-web-forms/
- [S23] GOV.UK Design System, error message: https://design-system.service.gov.uk/components/error-message ; validation pattern: https://design-system.service.gov.uk/patterns/validation ; error summary: https://design-system.service.gov.uk/components/error-summary
- [S24] MDN, autocomplete attribute: https://developer.mozilla.org/docs/Web/HTML/Attributes/autocomplete
- [S25] W3C, Understanding SC 3.3.8 Accessible Authentication (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication.html
- [S26] Luke Wroblewski, Web Form Design: Filling in the Blanks, 2008.
- [S27] Nielsen Norman Group on hidden navigation on desktop: https://www.nngroup.com/articles/find-navigation-desktop-not-hamburger/
- [S28] Edward Tufte, The Visual Display of Quantitative Information, 1983.
- [S29] Baymard Institute on reducing cart abandonment: https://baymard.com/blog/reduce-cart-abandonment
