# M4 plan: Person detail and both layouts

Status: **done** 2026-10-30. Questions answered the same day (all recommended options). Spec: DESIGN.md
sections 5.2 and 5.4. Acceptance ("Done when", DESIGN.md section 10):

> Any person can be opened in both layouts, with manager chain and "responsible for" working.

## Starting point (end of M3)

- `src/core/`: everything from M1 plus `ReadinessFilter`, `supervisorOptions`,
  `resolveSupervisor`, `highlightParts`, `compareByUrgency` (person detail check order).
- `src/app/features/readiness/`: `ReadinessQueryService` (query in the URL), `TreeModel`,
  `TreeStateService` (expand state and focused row, root-provided), toolbar.
- `src/app/features/org-tree/`: the tree. Clicking a row or pressing Enter goes to
  `/person/:id`, which is still a placeholder.
- `src/app/shared/`: `Icon`, `StatusBadge`, `CategoryChip`, `RollupBadge`, `Legend`, `Highlight`.
- `Preferences.layout` already exists (`'dashboard' | 'drilldown'`, default `'dashboard'`) but
  nothing reads it yet.
- Each check already has `reason` ("Expires in 12 days"), `dueDate`, `daysRemaining`,
  `source`, `lastSynced`, `stale` and `requiredBy`.

## What the user sees

**Drill-down**: clicking a person opens `/person/:id`, a full page. A "Back to readiness" link
(and the browser's Back) returns to the tree with its filters, expand state and focused row.

**Dashboard**: clicking a person keeps you on the Readiness page and opens their detail in a
panel on the right (`/readiness?...&person=p042`). The tree stays usable on the left; the
selected row is highlighted. The panel has Close and "Open full page".

**Person detail** (the same component in both):
- **Header**: name, title, employee ID, status badge; manager chain as a breadcrumb (each
  manager clickable, opening them the same way); programs as badges.
- **Summary strip**: one tile per category (8) with the worst status and a count ("2 of 5 not
  ready"). Clicking a tile filters the check table to that category; click again to clear.
- **Check table**: every check, worst first then soonest due (`compareByUrgency`). Columns:
  item, category, status, reason, due date, days remaining, source, last synced, required by.
  Out-of-date rows say so. On phones the table becomes stacked cards (no sideways scroll).
- **Responsible for** (managers only): roll-up badge for everyone below, number of direct
  reports, and "View the tree from [name]", which opens the Readiness page scoped to them
  (`sup=`).

**Who can be opened**: anyone in the viewer's subtree (admins: anyone). Managers above the
viewer appear in the breadcrumb as plain text, not links, since the viewer can't open them. An
unknown id or someone outside the viewer's view shows a short message with a link back.

## Steps (commit after each, with doc updates)

### 1. Core: person detail and display wording (`src/core/`, no Angular)
- `PersonDetailBuilder.build(result, assignments, programs, viewer, personId)` returns
  `null` (unknown or not visible) or: person, status, manager chain (each flagged `canOpen`),
  programs (each with the worst status among the checks it requires), category tiles,
  checks in urgency order, and for managers the roll-up and direct-report count.
- `canView(org, viewer, personId)`: subtree check, admins see everyone. The filter's
  `resolveSupervisor` uses it too, so the rule lives in one place.
- Display wording (`src/core/format.ts`): `formatDate('2026-12-01')` gives "Dec 1, 2026";
  `describeDays(n)` gives "12 days", "Today", "3 days overdue"; `describeSynced(lastSynced,
  today)` gives "Today", "Yesterday", "9 days ago". Dates stay strings with UTC arithmetic,
  as decided in M1.
- Source labels as a config table (`ad` Active Directory, `sap` SAP, `mdm` Device management,
  `lms` Learning system, `quals` Qualifications register, `yubikey` Yubikey register, and the
  tools source). Unknown sources show their id.
- Tests: tiles (worst status, counts, empty categories), chain flags for a foreman and an
  admin, program statuses including the crane candidate once assigned, roll-up for a manager
  and none for crew, not-visible and unknown ids, each wording edge (0, 1, -1 days; today,
  yesterday).

### 2. Person detail components (`src/app/features/person-detail/`)
- `PersonDetail` (input `personId`, `mode: 'page' | 'panel'`), built from small pieces:
  `PersonHeader` (with breadcrumb), `CategoryTiles`, `CheckTable`, `ResponsibleFor`.
- Opening a manager from the breadcrumb, or a person from anywhere, goes through one
  `PersonNavigator` service (step 4) so it does the right thing in each layout.
- Tests: header shows name, status (color + icon + text), chain links only for viewable
  managers; tiles show every category and filter the table; table order and columns; stacked
  card view markup; "Responsible for" only for managers and its link sets `sup`.

### 3. Drill-down: the person page
- Route `/person/:id` renders `PersonDetail` in page mode. Page title "Name · Ready to Work".
- "Back to readiness": a root-provided `ReturnPathService` remembers the last Readiness URL
  (with its query), so the link restores the filters even after following breadcrumb links
  between people. Falls back to `/readiness`. The tree already restores expand state and
  focus (M3).
- Not-found and not-in-your-view states.
- Tests: opening from the tree and coming back keeps the URL, expand state and focus;
  breadcrumb navigation then Back to readiness; title; unknown id; foreman opening the
  director's id.

### 4. Dashboard: the side panel
- `PersonNavigator.open(id)`: Drill-down layout goes to `/person/:id`. Dashboard layout on a
  wide screen sets `person=id` on the Readiness URL (see question 2 for narrow screens, and
  question 3 for history).
- Readiness page: two columns on wide screens (tree left, panel right with its own scroll,
  sticky under the header). `person` is read through `ReadinessQueryService`, ignored if not
  viewable, and kept by Clear filters.
- Tree: in the dashboard the open person is the selected row (`aria-selected`, highlight).
  Enter or click opens; arrow keys only move focus, so the panel doesn't jump while moving.
- Panel: Close (also Escape inside the panel) returns focus to the person's row; "Open full
  page" goes to `/person/:id`.
- Tests: open from tree by click and Enter, URL has `person`, row selected; close and focus
  return; switching person; breadcrumb inside the panel changes the panel; "View the tree
  from" scopes the tree and keeps the panel open; invalid `person` ignored; drill-down layout
  never shows the panel.

### 5. Layout switch (see question 1)
- Recommended: a Layout choice (Dashboard / Drill-down) in the avatar menu's Preferences,
  saved through `SettingsService`. M7's demo panel will reuse it.
- Tests: switching layout changes what a row click does, and survives a reload.

### 6. Check and document
- Screenshots (desktop 1200 wide and real 390px phone via DevTools emulation, light and dark):
  drill-down page for a crew member and a manager; dashboard with the panel open.
- Walk the planted scenarios: a member of the Foreman's tool crew shows expired Tools rows;
  the crane candidate turns red with "required by Crane Operations" after assignment
  (assignment edits are M6, so checked in a test); a stale-crew member's Yubikey row says the
  data is out of date.
- Update Tasks.md, DECISIONS.md, README.md, DESIGN.md (5.2 and 5.4 details).

## Questions for the user (answered: the recommended option each time)

1. **Where should the Layout switch live until the demo controls exist (M7)?**
   - (Recommended) In the avatar menu's Preferences, next to the default scope, from M4. It is
     already a saved preference, and you can try both layouts straight away. M7 adds it to the
     presenter panel too.
   - Or: only switchable in code until M7.
2. **What should the Dashboard layout do on narrow screens (phones, small tablets)?**
   - (Recommended) Act like Drill-down: tapping a person opens their full page. Side by side
     doesn't fit, and a full page reads best on a phone.
   - Or: the panel slides over the tree, full width, with a Close button.
3. **In the Dashboard, should each person you click be a step in the browser's Back history?**
   - (Recommended) No: picking a person replaces the current history entry, so Back leaves
     the Readiness page rather than stepping back through everyone you looked at.
   - Or: yes, each pick is a history step.
4. **Programs (follow-up from M3): how should a person's programs appear?**
   - (Recommended) As badges in the header, each with its own status: "Crane Operations: Not
     ready" when a required item is missing or expired. No extra tile; the problem checks
     still sit in their own categories, marked "required by".
   - Or: also add a ninth "Programs" tile to the summary strip.
5. **Categories where a person has nothing tracked (for example no qualifications):**
   - (Recommended) Show the tile greyed out as "Nothing tracked", with no status color, so all
     8 tiles always line up and nobody mistakes it for Unknown.
   - Or: hide those tiles.

## Decisions already made (do not reopen)
See DECISIONS.md. In short: both layouts in the demo; Back from drill-down returns to the same
view with filters kept; check table sorted worst first then soonest due; viewers see only
their subtree, admins everyone; status is always color + icon + text; manager roll-ups count
everyone below.
