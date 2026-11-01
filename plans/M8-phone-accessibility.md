# Plan: Phone and accessibility pass

Status: **done** 2026-11-01 (answers: the recommended options). Checked by `npm run e2e`
(Playwright with axe) rather than the hand-written script described below. User request: "phone accessibility
does seem like a good one to tackle." This is the phone and accessibility part of M8; the rest
of M8 (offline/installed check, written demo script) is left for later.

Acceptance ("Done when"):

> At 390px wide, in the light and dark brand themes, on the Readiness tree and list, person
> page, Admin and change log: no text below 4.5:1 contrast (3:1 for large text), status badges
> and switches at least 3:1 against their background, no tap target below the agreed size
> (question 1), no sideways page scroll, the header on one line, and every control usable and
> visibly focused from the keyboard.

## What I measured (2026-11-01)

A script I wrote checked every piece of visible text and every control at 390px wide, in the
light (navy) and dark (navy-dark) themes, on the tree, list, Admin and person page. No page
scrolls sideways, and every control has a name a screen reader can read. The problems:

**Contrast**
- **Context rows** (managers shown only for context) are faded with transparency. Their text
  measures 2.6 to 4.3:1 in light and 3.4 to 3.6:1 in dark; it needs 4.5. That covers the
  status badge, the title, "Items", the roll-up counts and Details.
- **Dark theme red**: white on the dark theme's red ("Not ready" badges, red chips, the Outage
  strip) measures 3.8:1; it needs 4.5.
- **Admin tabs**: the inactive tabs measure 3.1:1 in light; they need 4.5.
- **Issues only switch** in dark: when it's on, the switch is dark on dark and almost
  disappears (seen in the screenshot; switches need 3:1).

**Tap targets** (WCAG 2.2 asks for at least 24×24; phone guidelines suggest about 44)
- Below 24: "Items" on context rows (16 tall), the list's names (20), the switches (20),
  "Back to readiness" and "View the tree from…" on the person page (20).
- Exactly 24: Details, Items, Expand all and Collapse all, the close × on notices, and the
  program names in Admin.
- The search box and the header links are 28 to 30 tall.

**Phone layout**
- For the Admin persona, the header has two links (Readiness, Admin) and "Ready to Work"
  wraps onto two lines.
- Tree rows: each level indents further, so deep rows get narrow. The name wraps, and Details
  and the Items arrow land on lines of their own, in a different place on each row.
- The Admin tabs wrap onto two lines.

## What changes

1. **Colors** (theme colors in `src/styles.css`, so every page follows):
   - Context rows: no transparency. They keep normal-strength text in a muted color that
     still passes, their badges in full color, and "(shown for context)" as now.
   - Dark theme red: see question 2.
   - Inactive Admin tabs and the dark switch: darker or lighter until they pass.
2. **Tap targets** at the size from question 1. That means taller buttons for Details, Items,
   Expand and Collapse all, the switches, the search box and the person page links, and more
   padding around list names and Admin program names. On desktop they stay at least 24.
3. **Phone tree rows**, under 640px wide:
   - A smaller indent per level.
   - The name gets a full line.
   - Chips go on the next line.
   - One bottom line holds the roll-up, Items and Details, in the same place on every row.
   This also settles the old follow-up about Details dropping onto its own line.
4. **Header** at phone width: see question 3.
5. **Admin tabs** stay on one line and scroll sideways within their own strip, rather than
   the page scrolling.
6. **Keyboard focus**: walk every page by keyboard, light and dark, and make sure the focus
   ring is visible everywhere (fix any that aren't).

## Steps

1. Colors and context rows; tests where a component decides a class.
2. Tap targets.
3. Phone tree rows.
4. Header and Admin tabs.
5. Check: re-run the measuring script and the screenshots (390px phone and desktop, both
   themes), keyboard walk-through, docs (DESIGN.md, Tasks.md follow-ups closed) and a change
   log line.

## Not in this plan

- Other daisyUI themes in the avatar menu (Dracula, Nord…): they're daisyUI's own colors.
  The pass covers the two brand themes only.
- The offline/installed check and the written demo script (rest of M8).

## Questions for the user

1. **How big should tap targets be?**
   - **44px tall on phones for the controls people tap most (Details, Items, expand arrows,
     the toolbar), 24 minimum everywhere else (recommended).** It's comfortable for big fingers
     or gloves; tree rows get a little taller on phones.
   - 24 minimum everywhere (the WCAG 2.2 AA floor). Rows stay compact, but they're fiddly on
     a phone.
2. **Dark theme red with white text** (Not ready badges, red chips, the Outage strip).
   - **A deeper red so the white text passes (recommended).** It matches how the light theme
     already looks.
   - Keep the bright red and switch to dark text on it.
3. **Header on a phone**, when "Ready to Work" doesn't fit next to the links.
   - **Below 640px, show only the check-mark logo and hide the words (recommended).** The
     words are back on wider screens.
   - Keep the words in a smaller size.
   - Move Readiness and Admin into the avatar menu on phones.
