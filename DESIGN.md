# Ready to Work: Design

## 1. Purpose

Foremen and their managers need one place to see whether their people are ready to work: that
their access, passwords, devices, training, qualifications, 2FA keys, program requirements and
tools are all current. Today each item lives in a different system, and problems are found when
someone is already locked out or out of compliance.

**This project is a clickable mockup**, not the production app. It is built to put in front of
users and ask "is this what you want, and how does it look?" It has no backend and uses only
fake data. It is built so the real app can grow out of it: the logic is real, the data is mocked
behind one interface, and the real system integrations are written later (not in this project).

## 2. Users and what they need

| Who | Main question | What they use most |
|---|---|---|
| Foreman | "Who on my crew can't work, or soon can't?" | List view, person detail |
| General foreman / superintendent | "Which crews have problems?" | Tree view with roll-ups, Issues only |
| Director / manager | "How ready is my whole org?" | Roll-up counts at the top of the tree |
| Admin | "What does each program require?" | Admin screens (programs, rules, thresholds) |

Everyone sees only their own reporting subtree. Admins can see everyone.

## 3. What gets tracked (categories)

Every tracked item becomes a **check**: one person, one requirement, one status. The categories:

| Category | Example item | How it goes bad |
|---|---|---|
| Network access | Domain account | Expiration date approaching or passed |
| SAP password | SAP PRD account | Password expiration approaching or passed |
| Devices | Laptop LT-40213 | Device access/compliance expiring, or device not checked in recently |
| Training | Annual safety refresher | Assigned and not complete; due date approaching or passed |
| Access and roles | SAP role `MM_BUYER` | Required role missing, or role grant expiring |
| Qualifications | Forklift certification | Expiration approaching or passed, or missing when required |
| Yubikeys (2FA) | Yubikey serial 1834… | None assigned, reported lost, or certificate expiring |
| Program requirements | Program XYZ needs training ABC | A program the person is on requires something they lack |
| Tools | Torque wrench TW-118 | Calibration expiring or expired |

Category names, icons and warning windows live in a config table, so adding or renaming a
category doesn't require new screens.

## 4. Status rules

Four statuses, always shown as **color plus icon plus text** (never color alone):

| Status | Color | Meaning |
|---|---|---|
| Ready | Green | Everything valid |
| Expiring | Yellow | Something goes bad within its category's warning window |
| Not ready | Red | Something expired, missing, or overdue |
| Unknown | Grey | No data, or the data source is stale |

- **Warning windows are set per category** (defaults: SAP password 14 days, network access 30,
  training 30, qualifications 60, tools 30, Yubikey certificate 30, devices 14). Admins can change
  them.
- **A person's status is their worst check.** Red beats yellow beats grey beats green.
  (Grey ranks above green on purpose: missing data must never look like "all good.")
- **Roll-ups**: a manager's row shows their own status plus counts for everyone below them,
  e.g. "23 people: 18 ready, 3 expiring, 2 not ready." The roll-up color is the worst in the
  subtree.
- **"Today"** comes from a clock service, so the demo can move the date forward (section 8).

### Program requirements

- A **program** has a name and a list of requirements. Each requirement is a category plus an
  item, e.g. "Training: Export Control Basics" or "Qualification: Crane Operator."
- Requirements are "all of" in the mockup (no AND/OR logic). Optional later: "any one of."
- People are **assigned to programs** by admins in the mockup. Where real assignments come from
  is an open question for the real app.
- Each requirement a person's programs bring produces a check. Missing means red. Held but
  expiring within the window means yellow.

## 5. Screens

### 5.1 Readiness page (home)

One page with two views of the same people, switched with a **Tree / List** control. The tree
answers "where are the problems?"; the list answers "what do I fix today?". They share one
toolbar, so filters carry over when switching.

- **Scope (shared)**: two pick lists that combine.
  - **Supervisor**: "Showing people under [You]". Lists the viewer and every manager below
    them, indented by level.
  - **Program**: "All programs" or one program, narrowing to people on that program.
  - Defaults (You, All programs) are set under **Preferences** in the avatar menu and
    remembered in the browser. Trial design: the user will judge it once it can be clicked.
- **Toolbar (shared)**: Tree / List switch, **keyword search**, **Issues only** toggle switch,
  category filter (show only SAP issues, for example), status filter, direct reports vs whole
  subtree, legend. Tree view adds expand/collapse all.
- **Keyword search** filters the results already on the page as you type: person name, title
  and employee ID, plus item names in the list view. In the tree, matches keep their manager
  path visible.
- **Issues only** is on by default. Off shows everyone (tree) or every check (list).
- The chosen view and filters are kept in the URL (`/readiness?view=list&...`), so a view can
  be bookmarked or shared, and Back returns to it.

**Tree view**
- Collapsible, indented reporting tree, scoped to the current viewer.
- Each row: status icon, name, title, small chips for the categories with issues, and for
  managers, a roll-up badge with counts.
- **Issues only keeps the path**: managers above a person with an issue stay visible so the
  structure makes sense; everything else is hidden.

**List view**
- One table of checks in the viewer's subtree, sorted soonest first (overdue at the top).
- Columns: person, manager, category, item, status, due date, days remaining.
- Clicking a row opens that person's detail.

### 5.2 Person detail

- Header: name, title, status, manager chain (breadcrumb, each link clickable), programs.
- Summary strip: one tile per category with its status.
- Check table: every check, sorted worst-first then soonest-due, with item, status, due date,
  days remaining, source and last-synced time.
- **Responsible for**: if they manage people, the roll-up of their subtree and a link to view
  the tree from them.

### 5.3 Admin (admin view only)

- **Programs**: create, rename, delete programs; add and remove requirements from a picker of
  known items per category.
- **Program assignments**: assign people to programs (search and pick, or assign a whole
  subtree).
- **Thresholds**: warning window in days per category.
- **Settings file**: export settings as JSON, import a JSON file, reset to defaults.

### 5.4 Two layouts (both shown in the demo)

- **Dashboard**: the readiness page (tree or list) on the left, the selected person's detail
  in a panel on the right. One screen.
- **Drill-down**: the readiness page on its own; clicking a person opens their own detail page
  (Back returns to the same view with its filters kept).

Switched from the demo controls, so users can say which they prefer. Same components, arranged
differently.

## 6. Architecture

```
Angular views     readiness (tree, list) · person detail · admin · demo controls
     │  read through Angular services (dependency injection)
core/ (plain TS)  model types · status engine · roll-ups · program rules · default config
     │
data/             DataSource interface      → MockDataSource (seeded fake org)
                  SettingsStore interface   → LocalSettingsStore (browser storage)
                  Clock                     → DemoClock (adjustable "today")
```

- **`src/core/` is plain TypeScript with no Angular imports.** It holds the types, the status
  engine, roll-ups and program-rule evaluation as pure functions. It is the part that carries
  into the real app (front end or back end) and the part that gets unit tests.
- **`DataSource` is the seam to the real systems.** Every screen gets data through it and never
  touches the fake data directly. The real app swaps `MockDataSource` for an API-backed one
  provided through Angular dependency injection; screens don't change.
- **`SettingsStore`** loads and saves admin settings (programs, requirements, assignments,
  thresholds) and demo preferences. The mockup uses browser storage with a `schemaVersion`
  field so later builds can upgrade older saved settings. The real app swaps it for an API.
- **Wiring**: `DATA_SOURCE`, `SETTINGS_STORE` and `CLOCK` are Angular injection tokens in
  `src/app/services/tokens.ts` that default to the mock implementations. App services
  (`SettingsService`, `ClockService`, `ReadinessService`, `ViewerService`, `ThemeService`) expose
  everything as signals; `ReadinessService.result` recalculates whenever data, settings or the
  demo date change. Data and settings load before the first screen renders.
- **Settings live in each viewer's own browser.** Someone opening the link sees the shipped
  defaults, not the presenter's edits. That is what export/import is for.
- **The fake people and checks are generated, not stored**: the same seed always gives the
  same org, so demos are repeatable. Only settings are saved.

### Folder layout (planned)

```
src/
  core/          model, status engine, rollups, program rules, default config (no Angular)
  data/          DataSource + MockDataSource, fake-org generator, SettingsStore, Clock
  app/
    features/    readiness (page + toolbar), org-tree, issues-list, person-detail, admin,
                 demo-controls
    shared/      status badge, category chip, roll-up badge, layout shell
    services/    Angular wrappers that provide data/ implementations and computed state
```

### Stack

- **Angular 21**, standalone components, zoneless, signals for state. (Angular 22 needs a
  newer Node than the dev machine has; 21 is fine for a mockup.)
- **Tailwind CSS 4 + daisyUI 5** for styling. daisyUI's `success` / `warning` / `error` /
  `neutral` colors map to the four statuses.
- **Themes**: a custom brand theme (navy, white, gold) is the default, with a dark navy
  variant. An avatar button at the top right shows the current viewer's initials; clicking it
  opens a menu to pick the brand themes or any of daisyUI's built-in themes. The choice is
  saved in the browser. Brand gold is kept clearly different from the yellow/amber "Expiring"
  status color.
- **Hosting**: Vercel, as a static site. Clean URLs, with a `vercel.json` rewrite sending every
  path to `index.html` so deep links and refreshes work.
- **PWA**: `@angular/pwa` (service worker plus manifest). The app is fully static, so it works
  offline and can be installed.
- **Tests**: Angular's default Vitest runner. The core logic is tested; screens get a few
  smoke tests.
- No backend, no external calls at runtime.

## 7. Fake data plan

- A seeded random generator builds an org of about **200 people, 5 levels deep**: director →
  managers / superintendents → general foremen → foremen → crew.
- Believable fake names, titles, employee IDs, devices, tools and training. No real people.
- Default mix: about 70% ready, 18% expiring, 9% not ready, 3% unknown, spread unevenly so
  some crews look clearly worse than others.
- A few **planted scenarios** for the demo script, for example: one crew with a cluster of
  expired tool calibrations; one person whose new program assignment makes them red; a source
  marked stale so a group shows grey; SAP passwords expiring across a team next week.
- 4 to 6 sample programs with requirements, and default assignments.

## 8. Demo controls

A small panel (toggle with a button or keyboard shortcut) for the presenter:

- **Today**: date picker plus "+1 week / +1 month" buttons. Statuses update live.
- **View as**: switch between a sample foreman, superintendent, director and admin. Shows
  subtree scoping and the admin screens without a real login.
- **Layout**: Dashboard or Drill-down.
- **Theme**: lives in the avatar menu at the top right (see section 6, Stack), not here.
- **Reset**: restores default settings and the default date.

## 9. Out of scope for the mockup

- Real integrations (HR, AD/Entra, SAP, learning system, asset management, Yubikey records).
- Real login and authorization.
- Notifications and email digests. (Possibly shown as a static "what a weekly email would look
  like" page if users ask.)
- History and audit trail.
- Boxes-and-lines org chart view. (Indented tree first; add a chart only if users ask.)

## 10. Build plan

One milestone at a time. Each has a "Done when" line as its acceptance check.

**M0. Setup.** Angular project, Tailwind + daisyUI, PWA, Vitest, folder layout, app shell
with routing and empty pages.
Done when: `npm start` serves an installable app shell with themed placeholder pages and the
avatar theme menu, and
`npm test` and `npm run build` pass.

**M1. Core logic.** Model types, status engine, worst-status rule, roll-ups, program-rule
evaluation, default config, all tested.
Done when: unit tests cover every status rule, window edge (exactly on the boundary, overdue,
no data), roll-up counts and program requirement outcomes.

**M2. Fake data and storage.** Seeded org generator, MockDataSource, LocalSettingsStore with
schema version, DemoClock.
Done when: the same seed always produces the same org with the target status mix and the
planted scenarios; settings round-trip through storage and export/import.

**M3. Readiness page: toolbar and tree view.** Shared toolbar (supervisor and program pick
lists, Tree / List switch, keyword search, Issues only, filters, state in the URL), default
scope under Preferences in the avatar menu; tree with status icons, chips and roll-ups; issues
only with path kept; expand/collapse; keyboard navigation.
Done when: the whole fake org renders, scope pickers, Issues only and keyword search behave as
in 5.1, filters
survive a reload via the URL, and the tree can be fully used from the keyboard.

**M4. Person detail and both layouts.** Detail panel/page and the Dashboard and Drill-down
layouts.
Done when: any person can be opened in both layouts, with manager chain and "responsible for"
working.

**M5. List view.** Sorted table of checks on the readiness page, using the shared toolbar.
Done when: the list matches the checks behind the tree for every view-as persona, and
switching between Tree and List keeps the filters.

**M6. Admin.** Programs, requirements, assignments, thresholds, export/import/reset.
Done when: adding a requirement to a program turns the right people red immediately, and the
settings survive a reload and an export/import round trip.

**M7. Demo controls.** Today, view-as, layout, reset.
Done when: moving the date forward turns statuses yellow then red as expected, and each
persona sees only their own subtree.

**M8. Polish and demo script.** Visual pass, accessibility pass (contrast, labels, focus),
offline/installed check, short written demo script built on the planted scenarios.
Done when: the demo script runs start to finish without surprises, and the build passes.
