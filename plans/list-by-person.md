# Plan: List view with a column per category

Status: **done** 2026-10-31. The user took the recommended option on all five questions. User request 2026-10-31: "the
list view, i feel like it should have a column for each type of issue for a person".

Acceptance ("Done when"):

> The List view shows one row per person with a column for each category, each cell showing
> that category's worst status (color, icon and text); the same people appear as in the tree
> for every view-as persona, and the toolbar filters still apply.

## Starting point (M5)

- Today the list has **one row per check** (person × item): person, manager, category, item,
  status, due, days left, soonest first. A person with three issues takes three rows.
- `listChecks` in `src/core/readiness-filter.ts` builds those rows from the same filtering as
  the tree; a parity test checks them against the tree for every persona.
- There are 8 categories (config table): Network access, SAP password, Devices, Training,
  Access and roles, Qualifications, Yubikeys, Tools.
- With the Dashboard side panel open, the table drops to its "compact" columns to make room.

## What the user sees

- **One row per person**: name (with title underneath), manager, then one column per
  category, then the person's overall status.
- **Each category cell** shows the worst status of that person's checks in it, as a small
  badge (color + icon + text), with the soonest days left under it ("3 days overdue", "12
  days"). If the person has nothing in that category, the cell shows a dash.
- **Headers** are the category icon plus a short label, so 8 columns fit on a laptop screen.
- **Order**: worst first (Not ready, then Expiring), then by soonest due date.
- **Clicking a row** opens the person as it does now. Their detail page still lists the
  individual items.
- **Phones**: cards, each one person with the category chips for their issues (like the
  tree's chips).

## Steps

1. Core: person rows (worst status and soonest date per category), replacing or alongside
   `listChecks` (question 1), with tests and the persona parity test updated.
2. The table and phone cards.
3. Check on desktop (with and without the side panel), dark and phone; docs, and a change
   log line.

## Questions for the user

1. **Replace the current list, or keep both?**
   - **Replace it (recommended).** One list, one row per person. The item-level detail is one
     click away on the person.
   - Keep both, with a "By person / By item" switch in the toolbar. More to explain to users.
2. **What a category cell shows.**
   - **Worst status badge plus soonest days left (recommended).**
   - The status badge only (cleaner, less to read).
   - A count of issues in that category ("2 not ready").
3. **When Issues only is on, which cells show ready categories?**
   - **Show every category for the people listed, so green cells show too (recommended).**
     You see the whole picture for each person with an issue.
   - Leave ready categories blank so only the issues stand out.
4. **The category filter.**
   - **Picking categories hides the other columns (recommended).** Fewer, wider columns.
   - Keep all 8 columns and only filter which people show.
5. **With the Dashboard side panel open**, the table is narrower.
   - **Show icons only in the cells, with the status in a tooltip and for screen readers
     (recommended).** Color plus icon still gives the status; the text is on hover.
   - Keep the full badges and let the table scroll sideways.
