# Plan: Export to Excel (CSV) from the Readiness page

Status: **done** 2026-10-31. Answered 2026-10-31 ("your plan sounds fine": the recommended option on all three);
built after plans/inline-items.md. User request 2026-10-31: an
export button on both views (tree and list), likely just CSV.

Acceptance ("Done when"):

> On the Readiness page, in Tree or List, an Export button downloads a CSV that opens cleanly in
> Excel and holds the people the page shows under the current filters.

## Starting point

- Tree and List already share one query (scope, program, Issues only, categories, statuses,
  keyword) and show the same people; the list rows (`listPeople`) already have each person's
  manager, overall status and worst status per category.
- Admin › Settings file already downloads a file from the browser (a Blob and a link), so no
  library is needed.

## What the user sees

- An **Export** button (download icon) in the toolbar next to the Tree / List switch, on both
  views. It downloads `readiness-<date>.csv` at once; no dialog.
- The file opens in Excel with one header row and plain text values ("Not ready", "12 days
  overdue"), so it can be filtered and sorted there.

## How it works

- Core: a pure function builds the rows and columns from the same query as the page; a small
  CSV writer quotes commas, quotes and line breaks, and the file starts with a byte-order mark
  so Excel reads it as UTF-8.
- The button lives in the shared toolbar, so both views get it from one place.

## Steps

1. Core: export rows and the CSV writer, with tests (quoting, the same people as the page).
2. The toolbar button and the download; tests.
3. Check that the file opens in Excel's import (spot check in the browser); docs and a change
   log line.

## Questions for the user

1. **What one row is.**
   - **One row per person, like the List view (recommended):** name, title, employee ID,
     manager, overall status, then a column per category with its worst status and days left.
     The same file from both views.
   - One row per item (person × course, qual, tool, and so on) with item name, ID, status, due
     date and days left. Better for detailed filtering in Excel, but many more rows.
   - Both, as two buttons ("Export people" and "Export items").
2. **Which people.**
   - **Exactly what the page shows under the current filters (recommended).** Turn off Issues
     only first to export everyone in scope.
   - Everyone in scope, ignoring Issues only and the other filters.
3. **The tree's shape.** The tree also shows managers above the people with issues, for context.
   - **Leave those context rows out; add a "Reports to" column so the hierarchy can be rebuilt
     (recommended).** The same as the list.
   - Include them, with a "Level" column for the indent.
