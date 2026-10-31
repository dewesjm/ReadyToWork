# Plan: Change log in the avatar menu

Status: **waiting on the user's answers** (questions at the end). User request 2026-10-31: "a
little submenu like this, with a changelog we maintain as we go. can go under the profile
avatar thingie" (screenshot: a menu with icon rows "Change Log" and "Manage Quick Links").
Comes before M7 (demo controls).

Acceptance ("Done when"):

> The avatar menu has a "Change log" row with a history icon; choosing it shows the entries,
> newest first, each with a date and plain-language bullets; adding an entry to the one source
> file is all it takes to publish a new one.

## Starting point

- The avatar menu is one panel: the viewer's name, Preferences, then the theme list. There's no
  row of menu items yet.
- The icon set (`src/app/shared/icon/icons.ts`) has no history icon; we'd add Lucide's
  `history`, as we did for the others.
- The app already has a dialog pattern (`confirm-dialog.ts`, a native `<dialog>`).

## What the user sees

- A new section in the avatar menu, right under the name: one icon row, **Change log**
  (history icon). There's room for more rows later, like the screenshot's Quick links.
- Choosing it closes the menu and opens the change log (see question 1): entries newest first,
  each a date, a short title and a few bullets written for users, not developers ("Clicking a
  row no longer opens the person; use Details"), not commit messages.

## How we keep it up to date

- One data file, `src/app/changelog.ts`: a typed list of `{ date, title, items[] }`. It's
  plain data with no logic; a test checks that the dates are valid and newest first.
- A new rule under "How we work" in CLAUDE.md: any commit users would notice adds a line to the
  change log. Internal changes (tests, docs, refactors) don't.

## Steps

1. The data file, the history icon and the test.
2. The menu row and the change log view (dialog or page), with component tests.
3. Check on desktop, dark and phone; docs (DESIGN.md, DECISIONS.md, Tasks.md, README.md,
   the CLAUDE.md rule).

## Questions for the user

1. **Where the change log opens.**
   - **A dialog over the current page (recommended).** Quick to open and close, and you don't
     lose your place in the tree.
   - A page of its own (`/changelog`). Has its own link to send people, but takes you away from
     what you were doing.
2. **What goes in at the start.**
   - **Backfill one short entry per milestone so far (recommended)**, worded for users (M3 tree,
     M4 person detail, M5 list, M6 admin, announcements, recent fixes). It shows reviewers how
     far the mockup has come.
   - Start empty from today.
3. **A "new" marker.**
   - **A small dot on the avatar and on the Change log row when there are entries you haven't
     seen; opening the log clears it (recommended).** Returning reviewers see at a glance that
     something changed. Stored per browser like the other preferences.
   - No marker.
4. **Entry dates.**
   - **Date only, one entry per day of user-visible changes (recommended).**
   - Version numbers as well (for example 0.7.0), which we'd have to bump by hand.
