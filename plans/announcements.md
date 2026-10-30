# Plan: Announcements (admin banner messages)

Status: **plan, waiting for the user's answers** (2026-10-30). User request: "a banner message
admin capability, to announce outages or things that are delayed."
Comes before M7 (demo controls); not in DESIGN.md yet (step 4 adds it).

Acceptance ("Done when"):

> An admin posts an outage notice and it shows at the top of every page at once; a scheduled
> notice shows only between its dates; notices survive a reload and an export/import round trip.

## Starting point

- Admin has three tabs (Programs, Thresholds, Settings file), each its own URL, and edits save
  at once through `SettingsService`, so anything stored in `Settings` shows across the app
  immediately.
- `Settings` is schema version 1 with an empty `MIGRATIONS` table. Adding notices is the first
  schema change: version 2, with a migration that adds an empty list to saved version 1 data.
- Settings live in each viewer's browser. In the mockup, a notice an admin posts shows in that
  browser only (and in an exported settings file). The real app would store notices on a server
  so everyone sees them; the screens would be the same.
- The `Clock` gives "today" as a date (the demo date when set), so scheduling by date works with
  the M7 date control later.

## What the user sees

- **The banner**: a full-width strip under the top bar on every page, above the page title. Each
  notice is color plus icon plus a type word plus the message, for example
  "⚠ Delayed · Training records from the learning system are 2 days behind. Completions since
  Oct 28 may not show yet." Several notices stack, outages first, then delays, then info, newest
  first within each type. It is a `role="status"` region so screen readers announce it.
- **Admin › Announcements** (fourth tab, `/admin/announcements`):
  - A list of notices, each with its type, message and state: Live, Scheduled (starts Nov 3),
    Ended, or Off.
  - "New announcement" and each notice's Edit open a form: type (Outage, Delayed, Info),
    message (required, up to 300 characters), optional start and end dates, and an On/Off
    switch. A preview shows the banner exactly as it will appear.
  - Delete asks first.
- The settings file carries notices along with programs, assignments and warning windows, and
  its summary line counts them ("5 programs, 61 assignments, 2 warning windows,
  1 announcement").

## Steps (commit after each, with doc updates)

### 1. Core: notices (no Angular)
- `src/core/announcements.ts`: the `Announcement` type (id, type, message, optional `startsOn`
  and `endsOn` dates, `on`, `updatedAt`), `activeAnnouncements(list, today)` (on, within the
  dates, ordered as above), `announcementState` (Live, Scheduled, Ended, Off), and
  `validateAnnouncement` (message present and not too long, end not before start).
- The three types, their labels, icons and colors in a config table.
- `src/data/settings.ts`: schema version 2 with the migration, `announcements` checked field by
  field on import, counted in `describeSettings`, covered by Reset.
- Tests: ordering, every date edge (the start day, the end day, the day after), states,
  validation, migration from a saved version 1, import errors.

### 2. The banner
- `src/app/shared/announcement-banner/`: reads active notices from settings and the clock, sits
  in the app shell under the top bar. Dismiss per question 2.
- Tests: shows on every route, order, hides outside its dates, dismiss behavior.

### 3. Admin › Announcements tab
- Route, tab, list, form with preview, delete with confirm. Saving per question 4.
- Tests: create, edit, turn off, delete; validation messages; the acceptance check (post an
  outage, it appears in the shell banner at once).

### 4. Check and document
- Screenshots: banner on the Readiness page, person page and admin, desktop and 390px phone,
  light and dark; the admin tab.
- DESIGN.md (5.3 and a short banner section), README, DECISIONS.md, Tasks.md.

## Questions for the user

1. **What kinds of notice, and how do they look?** Readiness already uses red, amber and green
   for people's status, so banner colors could be mistaken for it.
   - (Recommended) Three types: **Outage** (red), **Delayed** (amber), **Info** (blue), each
     with its own icon and the type word, on a full-width strip that looks clearly different
     from the status badges (no pill shape).
   - Or: one neutral style for every notice (blue), with the type word only. No color clash,
     but an outage doesn't stand out.
2. **Can viewers dismiss a notice?**
   - (Recommended) Info and Delayed notices have a close button; the viewer's browser
     remembers it, and the notice comes back if the admin edits it. Outages can't be dismissed.
   - Or: no dismissing; a notice stays until it ends or the admin turns it off.
   - Or: every notice can be dismissed.
3. **Scheduling?**
   - (Recommended) Optional start and end **dates**; the notice shows from the start day through
     the end day and then hides by itself. Times go in the message text ("Saturday 6 am to
     noon"). Works with the M7 demo date.
   - Or: start and end date and time. More precise, but the demo clock only knows dates, so
     the clock would need times too.
   - Or: no scheduling; the admin turns notices on and off by hand.
4. **When does an edit go live?** Every other admin edit saves at once with no Save button.
   - (Recommended) Notices are the exception: the form has a **Publish** button (and Cancel),
     so a half-typed message never shows to anyone. The preview shows it before publishing.
   - Or: same as the rest of Admin: saves as you type.
5. **Should the demo start with a sample notice?**
   - (Recommended) Yes: the fake data includes one live Delayed notice ("Training records
     from the learning system are 2 days behind…") so users see the banner without an admin
     posting one first. Reset brings it back.
   - Or: start with none.

## Not in this plan (could ask users at the demo)
- Tying a notice to a category (for example, a training delay putting a "may be delayed" note on
  every Training chip).
- Targeting notices to part of the org or one program.
- A history of past notices.
