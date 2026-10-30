# M3 plan: Readiness page toolbar and tree view

Status: **planned, waiting for user review** of the questions at the end. Spec: DESIGN.md
section 5.1. Acceptance ("Done when", DESIGN.md section 10):

> The whole fake org renders, scope pickers, Issues only and keyword search behave as in 5.1,
> filters survive a reload via the URL, and the tree can be fully used from the keyboard.

## Starting point (end of M2)

- `src/core/`: status engine, program rules, `OrgIndex`, `RollupCalculator`,
  `ReadinessEvaluator`, check ordering. Public API in `src/core/index.ts`.
- `src/data/`: `DataSource`, `SettingsStore`, `Clock`, mock implementations, fake org
  generator with planted scenarios. Public API in `src/data/index.ts`.
- `src/app/services/`: `ReadinessService.result()` (org, checks, statuses, roll-ups as a
  signal), `SettingsService` (settings + `preferences()`), `ClockService`, `ViewerService`
  (`persona()`, `viewer()` with `personId` and `isAdmin`), `ThemeService`.
- `src/app/features/readiness/`: page with Tree / List switch and Issues only toggle; both in
  the URL (`view=list`, `issues=all`). Tree and list are placeholders.
- `Preferences` already has `defaultSupervisorId` and `defaultProgramId` (null = viewer / all).

## Steps (commit after each, with doc updates)

### 1. Icons and shared status pieces (`src/app/shared/`)
- `Icon` component: inline SVGs for the icon names already in `src/core/config.ts`
  (`STATUS_META` icons and category icons) plus chevrons, search, filter, x. Paths copied from
  Lucide (ISC license; add the licence note in a comment and README). No icon dependency.
- `StatusBadge`: icon + text + daisyUI color from `STATUS_META`. Compact variant for tree rows
  still shows the text (status is always color + icon + text).
- `CategoryChip`: category icon + label, colored by that category's worst status.
- `RollupBadge`: "23 people: 18 ready, 3 expiring, 2 not ready" with small status icons; hide
  zero counts except total.
- `Legend`: the four statuses with meaning, in a small popover.
- Tests: each renders icon + text, correct color class, roll-up wording and zero hiding.

### 2. Core filtering (`src/core/readiness-filter.ts`, no Angular)
A pure `ReadinessFilter` service: given the `ReadinessResult`, assignments, viewer root and a
`ReadinessQuery`, returns what to show.
- `ReadinessQuery`: `supervisorId`, `programId | null`, `issuesOnly`, `categories[]` (empty =
  all), `statuses[]` (empty = all non-ready), `directOnly`, `keyword`.
- Scope: the supervisor's subtree (must be inside the viewer's subtree; otherwise fall back to
  the viewer; admin can pick anyone). `directOnly` = supervisor plus direct reports.
  Program: only people assigned that program (managers above them kept as path).
- Issue rule (see question 1): a person "has an issue" if they have a check with status not
  ready, in the selected categories, and in the selected statuses.
- Keyword: case-insensitive match on name, title, employee ID (and, for the list view in M5,
  item name). Matches are flagged so the UI can highlight them.
- **Path kept**: any shown person's managers up to the scope root stay visible, flagged as
  "context" so the UI can dim them.
- Output: ordered visible person ids (depth-first), per-person flags (`match`, `context`),
  ids that must be expanded to reveal matches, and counts for an "N people shown" line.
- Tests: scope by supervisor, outside-scope fallback, admin, direct only, program filter,
  issues only with path kept, category and status filters, keyword on each field, keyword +
  issues only together, empty result.

### 3. Query state in the URL and the toolbar
- `ReadinessQueryService` (`src/app/features/readiness/`): reads and writes the query in URL
  params: `view`, `issues`, `sup`, `prog`, `cat` (comma list), `status` (comma list), `direct`,
  `q`. Missing `sup` / `prog` fall back to `preferences().defaultSupervisorId` /
  `defaultProgramId`, then to the viewer / all programs. Defaults are left out of the URL so
  links stay short. Keyword updates the URL with `replaceUrl` after a short debounce.
- `ReadinessToolbar` component:
  - Supervisor `<select>`: viewer first, then every manager in the viewer's subtree, indented
    by level ("people under ..."). Native select: keyboard and screen-reader friendly.
  - Program `<select>`: "All programs" plus programs from settings.
  - Keyword search input with clear button and "N people shown".
  - Issues only toggle (exists), Tree / List switch (exists).
  - Category filter (dropdown with checkboxes), status filter (three toggle chips), Direct
    reports only toggle, legend button, Clear filters.
  - Tree view only: Expand all / Collapse all.
  - Wraps on narrow screens (phone width with 16px gutter, no horizontal scroll).
- Tests: URL round trip for every param, defaults from preferences, invalid params ignored
  (unknown supervisor or program falls back), Clear filters.

### 4. Tree view (`src/app/features/org-tree/`)
- Renders the filter output as a flat list of rows with indentation (simpler and faster than
  nested components; 200 rows needs no virtual scrolling; note it for a bigger real org).
- Row: expand/collapse chevron (managers), `StatusBadge` (compact), name (keyword match
  highlighted), title, `CategoryChip`s for categories with issues, `RollupBadge` for managers.
  Context rows (kept only as path) are dimmed.
- Expand state lives in a root-provided `TreeStateService` (not the URL), so it survives going
  to a person and pressing Back. Initial state: see question 3. Keyword and Issues only
  auto-expand the paths to what they show.
- Clicking a row (or Enter) opens the person: `/person/:id` for now (placeholder page until
  M4 builds the detail and both layouts).
- Empty state: "No one matches these filters" with Clear filters.
- Tests: whole org renders with Issues only off (row count = scope size), Issues only shows
  only people with issues plus their manager path, keyword expands to and highlights matches,
  expand/collapse all, roll-up numbers match `ReadinessService.result().rollups`.

### 5. Keyboard navigation (WAI-ARIA tree pattern)
- `role="tree"` / `treeitem`, `aria-level`, `aria-setsize`, `aria-posinset`,
  `aria-expanded`, `aria-selected`; roving `tabindex` (one row tabbable).
- Keys: Up / Down (previous / next visible row), Right (expand, or move to first child), Left
  (collapse, or move to parent), Home / End, Enter (open person), `*` (expand siblings).
  Focus stays visible (`focus-visible` ring).
- Tests: each key, focus restored to the same row after returning from a person.

### 6. Preferences in the avatar menu
- New "Preferences" section above the themes: Default supervisor and Default program selects
  (same options as the toolbar), saved via `SettingsService.updatePreferences`.
- Tests: changing a default changes what `/readiness` shows with no URL params.

### 7. Check and document
- Screenshot check with headless Chrome (see CLAUDE.md working notes) at desktop and phone
  width, light and dark brand themes.
- Verify the planted scenarios are visible from the Foreman persona (tool crew red) and from
  the director (SAP crew yellow, stale crew grey).
- Update Tasks.md, DECISIONS.md, README.md, DESIGN.md.

## Questions for the user (answer before step 2)

1. **What do the category and status filters do when Issues only is off?**
   - (Recommended) Issues only off shows everyone in scope; the category and status filters
     only apply while Issues only is on (they define what counts as an issue). Simple to
     explain: "Issues only, for SAP, not ready."
   - Or: the filters always narrow the list, even with Issues only off.
2. **Should manager roll-up counts follow the filters?**
   - (Recommended) No: roll-ups always count everyone below the manager, so the numbers are
     true no matter what is filtered. Filters only change which rows are shown.
   - Or: roll-ups count only people matching the current filters.
3. **How open should the tree be when it first loads (Issues only off, no search)?**
   - (Recommended) Open down to foremen, crews collapsed. Shows structure and roll-ups at a
     glance without 160 crew rows.
   - Or: fully expanded, or only the top level.

## Decisions already made (do not reopen)
See DECISIONS.md. In short: one Readiness page with Tree / List switch; Issues only is a
toggle switch, on by default; supervisor + program pick lists on trial; keyword search filters
the page's results; default scope in avatar menu Preferences; viewer sees only their subtree,
admin sees everyone.
