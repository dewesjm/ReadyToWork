# M5 plan: List view

Status: **in progress**. Questions answered 2026-10-30 (all recommended options). Spec: DESIGN.md
section 5.1 (List view). Acceptance ("Done when", DESIGN.md section 10):

> The list matches the checks behind the tree for every view-as persona, and switching between
> Tree and List keeps the filters.

## Starting point (end of M4)

- `src/core/`: `ReadinessFilter` (scope, Issues only, category and status filters, keyword,
  path kept) returns tree rows; `compareBySoonest` (list order) exists but has no screen yet.
- `src/app/features/readiness/`: `ReadinessQueryService` (all filters in the URL, including
  `view=list` and `person=`), toolbar, `PersonNavigator` (panel or page by layout),
  `ReturnPathService`, `TreeStateService`.
- `src/app/features/issues-list/`: placeholder shown when `view=list`.
- `src/app/features/person-detail/check-table.ts` already renders checks as a table on wide
  screens and cards on narrow ones; the list reuses its look, not the component (different
  columns).
- Tree / List switching already keeps every filter, since they all live in the URL.

## What the user sees

One table of checks, soonest first (overdue at the top), using the same toolbar as the tree:
- **Columns**: person (name, with title underneath), manager, category, item, status, due
  date, days left. Status is a badge (color + icon + text).
- **Issues only on** (default): only checks that count as issues under the category and status
  filters. **Off**: every check of everyone in scope, ready ones included.
- **Keyword**: matches person name, title and employee ID (all of that person's checks show)
  or the item name (only that check shows). Matches are highlighted.
- **Clicking a row** (or Enter on it) opens the person the same way the tree does: the side
  panel in the Dashboard layout on a wide screen, otherwise the person page. In the
  Dashboard, the open person's rows are highlighted.
- **Count line**: "38 checks for 21 people" instead of the tree's "N of M people shown".
- **Phones**: rows become stacked cards; no sideways scroll.
- **Empty states**: the same as the tree ("No one matches these filters" with Clear filters,
  or "No issues: everyone here is ready").

## Steps (commit after each, with doc updates)

### 1. Core: list rows (`src/core/`, no Angular)
- Split `ReadinessFilter` so the tree and the list share one definition of scope and of
  "counts as an issue": `scopedPeople(input)` and `isIssue(check, query)`, then
  `apply()` (tree, unchanged behavior) and a new `listChecks(input)`.
- `listChecks` returns rows `{ check, person, manager, match: { person, item } }`: everyone in
  scope (supervisor, direct only, program), their checks filtered by Issues only and the
  category / status filters, then the keyword (person fields or item name).
- Sort by `compareBySoonest`, changed per question 1.
- Tests: the parity rule behind "Done when" (with no keyword, the people in the list are
  exactly the people the tree shows in their own right, and each person's list checks are
  exactly their issue checks); Issues only off lists every check; each filter; keyword on
  person fields vs item name; direct only; program; out-of-scope supervisor falls back; order
  including undated checks.

### 2. List component (`src/app/features/issues-list/`)
- Table on wide screens, cards on phones. Highlighted keyword matches (`Highlight`).
- The person name in each row is a button (keyboard reachable, Enter opens); the whole row is
  also clickable with the mouse. Opens through `PersonNavigator`.
- When the Dashboard panel is open the list column is narrower, so the manager and category
  columns fold under the person and item names instead of having their own columns.
- Large lists: see question 3.
- Tests: columns and order, status badge, Issues only off shows ready checks, keyword
  highlight on person and item, opening in both layouts, selected rows in the Dashboard,
  empty states.

### 3. Toolbar and focus
- Count line per view ("38 checks for 21 people" in the list). Search placeholder in the list
  view mentions item names. Expand / Collapse all already show only in the tree.
- Coming back from a person page puts focus on the same row's button. A root-provided
  `ListStateService` remembers that row (and, if question 3 goes that way, how many rows were
  showing), like `TreeStateService` does for the tree.
- Tests: count wording, placeholder, focus restored after Back, switching Tree / List keeps
  every URL parameter.

### 4. Check and document
- An app-level test of "Done when" with the real fake org: for each of the four personas,
  Issues only on and off, the list's people and checks match the tree's.
- Screenshots: list desktop (Issues only on and off), with the Dashboard panel open, 390px
  phone, light and dark.
- The Foreman persona's list should open with the tool crew's expired calibrations at the
  top; check it.
- Update Tasks.md, DECISIONS.md, README.md, DESIGN.md.

## Questions for the user (answered: the recommended option each time)

1. **Where do checks with no date go in the soonest-first order?** Some red items have no date
   (a required qualification someone doesn't hold, a lost Yubikey, a revoked role), and grey
   ones often don't either. Today they would sort to the very bottom, below green items.
   - (Recommended) Not ready with no date goes to the top with the overdue items (it blocks
     work today); unknown with no date goes after everything dated. Within each group, worst
     status first, then item name.
   - Or: keep every undated check at the bottom.
2. **With a program picked, which checks should the list show?**
   - (Recommended) The same people as the tree (people on that program) and all of their
     issue checks, so the list and tree always agree. The "required by" program shows on the
     row.
   - Or: only the checks that program requires ("who isn't ready for Crane Operations").
     More focused, but the list would then show fewer people than the tree.
3. **With Issues only off, the director's list has every check in the org (well over 2,000
   rows). How should a long list behave?**
   - (Recommended) Show the first 100 rows and a "Show 100 more" button, with "Showing 100 of
     2,140". Simple, fast, and nobody scrolls 2,000 rows anyway; the filters are the real way
     to narrow it.
   - Or: show everything at once (slow to render on phones), or page numbers.
4. **Should column headers re-sort the list?**
   - (Recommended) Not in M5: one fixed order, soonest first, as designed. Ask users in the
     demo whether they miss sorting.
   - Or: clickable headers to sort by person, category, status or due date (kept in the URL).

## Decisions already made (do not reopen)
See DECISIONS.md. In short: one Readiness page with Tree / List switch sharing one toolbar;
list sorted soonest first, overdue at the top; keyword search matches item names in the list;
category and status filters only apply with Issues only on; Dashboard layout opens people in
the side panel on wide screens; viewers see only their subtree.
