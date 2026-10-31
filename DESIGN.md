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
| Qualifications | Pipe Welding | Expiration approaching or passed, or missing when required |
| Yubikeys (2FA) | Yubikey serial 1834… | None assigned, reported lost, or certificate expiring |
| Tools | Torque wrench TW-118 | Calibration expiring or expired |

Program requirements are not a category of their own: a program's missing item shows as a red
check in that item's category (a missing course under Training), marked "Required by".

Category names, icons and warning windows live in a config table, so adding or renaming a
category doesn't require new screens.

## 4. Status rules

Three statuses, always shown as **color plus icon plus text** (never color alone):

| Status | Color | Meaning |
|---|---|---|
| Ready | Green | Everything valid |
| Expiring | Yellow | Something goes bad within its category's warning window |
| Not ready | Red | Something expired, missing, or overdue, or there is no data |

- **Warning windows are set per category** (defaults: SAP password 14 days, network access 30,
  training 30, access and roles 30, qualifications 60, tools 30, Yubikey certificate 30, devices
  14). Admins can change them.
- **A person's status is their worst check.** Red beats yellow beats green. Someone with no
  data at all is red, so missing data never looks like "all good."
- **Status comes from dates alone.** When a source hasn't synced within its limit (3 days by
  default), the check keeps its status and shows an "Out of date" note next to its last-synced
  time.
- **Roll-ups**: a manager's row shows their own status plus counts for everyone below them,
  e.g. "23 people: 18 ready, 3 expiring, 2 not ready." The roll-up color is the worst in the
  subtree.
- **"Today"** comes from a clock service, so the demo can move the date forward (section 8).

### Program requirements

- A **program** is a shipbuilding program: on larger ships usually one specific ship, on
  smaller, modular builds the whole class. The real app gets the list of programs from
  elsewhere and doesn't decide which is which; the name says it ("Ridgeline R-01 (supply
  ship)", "Kestrel class (patrol boat)").
- A program has a name and a list of requirements, which are "all of". Each requirement is
  **"any of" one or more items**, each a type plus the ID the admin types as it appears in the
  source system: a course ID ("HW-210"), qual ID ("QL-CRN-01"), SAP role name, or the network
  account / SAP password. Types can be mixed ("Electrical safety: any of ELEC-101, ELEC-201,
  QL-MEL-01"), and any requirement can have an optional name.
- IDs match ignoring upper/lower case and spaces around them. Of several matching records the
  best one counts; none means one red "missing" check. An ID no record has is allowed, with a
  note in Admin to check it (it may be a typo, or a new course).
- No fixed list of items: admins know their systems, so it is a plain text box. Network account
  and SAP password are addable like the rest; the sample programs require them except where the
  work has no computers, and a new program starts with nothing.
- People are **assigned to programs** by admins in the mockup. Where real assignments come from
  is an open question for the real app (likely by who you work for: "you work for X, so you
  get their program").
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
  - Defaults (You, All programs) are set under **Preferences** in the avatar menu (above the
    themes) and remembered in the browser. Trial design: the user will judge it once it can be clicked.
- **Toolbar (shared)**: Tree / List switch, **keyword search**, **Issues only** toggle switch,
  category filter (show only SAP issues, for example), status filter, direct reports vs whole
  subtree, legend. Tree view adds expand/collapse all.
- **Keyword search** filters as you type: person name, title and employee ID. It looks
  through everyone in scope: while there is a keyword, Issues only and its category and status
  filters pause, so a ready person can be found by name. The switch stays on and says "(paused:
  searching everyone)"; clearing the search brings the filter back. In the tree, matches keep
  their manager path visible.
- **Issues only** is on by default. Off shows everyone in scope. The category and status
  filters only apply while it is on: they define what counts as an issue.
- Manager roll-ups always count everyone below them, whatever is filtered.
- The chosen view and filters are kept in the URL (`/readiness?view=list&...`), so a view can
  be bookmarked or shared, and Back returns to it.

**Tree view**
- Collapsible, indented reporting tree, scoped to the current viewer. Opens down to the crew
  leads (crews collapsed) unless Issues only or a search narrows it, which opens every path.
- Keyboard: the WAI-ARIA tree pattern (arrows, Home / End, Enter opens the person, `*` opens
  siblings). Focus returns to the same row after Back.
- Each row: status icon, name, title, small chips for the categories with issues (lined up in
  one column), for managers a roll-up badge with counts, and a Details button.
- Clicking a manager's row opens or closes it; only Details (or Enter) opens the person.
  Clicking the row of someone with no one under them does nothing.
- **A person's items open in place**: clicking a row's issue chips (or "Items" when there are
  none) shows that person's issues under the row, grouped by category, worst first, with status,
  reason, due date and "Required by"; "Show all N items" adds the ready ones. A manager's chips
  open their own items, separate from opening their team. Several can be open at once. No
  keyboard shortcut (user): Enter on a row opens Details, which lists everything.
- **Issues only keeps the path**: managers above a person with an issue stay visible so the
  structure makes sense; everything else is hidden.

**List view**
- One row per person, the same people as the tree (changed 2026-10-31 from one row per check).
- Columns: person, manager, one per category, overall status. Each category cell shows the
  worst status of the person's checks in it (ready ones too), with the soonest days left under
  an issue; a dash when the person has nothing in that category. Picking categories (with
  Issues only on) hides the other columns.
- Sorted worst first, then by the soonest due issue (not-ready checks with no date count as
  most overdue), then name. One fixed order, no column sorting.
- Below very wide screens (2xl) the manager folds under the name; if the table is still too wide,
  it scrolls inside its box, never the page.
- Phones get cards with chips for the categories that have issues. With the Dashboard panel
  open, the manager folds under the name and cells show the status icon only (text as a
  tooltip and for screen readers).
- Under each name, "3 issues" (or "Items") opens the person's items in a row below, the same
  view as in the tree; on phones the card's chips do it.
- 100 rows at a time, with "Show 100 more".
- Clicking a row (or Enter on the person's name) opens that person's detail.

**Export** (both views)
- An Export button next to Tree / List downloads `readiness-<date>.csv` for Excel: one row per
  person the page shows (the same people in both views, context managers left out), with name,
  employee ID, title, reports to, overall status, then a status column and a days-left column
  per category shown. UTF-8 with a byte-order mark so Excel reads it correctly; cells that
  would start a formula get an apostrophe.

### 5.2 Person detail

- Header: name, title, employee ID, status, manager chain (breadcrumb; managers above the
  viewer are plain text), programs as badges with their own status ("Ridgeline R-01 (supply
  ship): Not ready").
- Summary strip: one tile per category with its status; "Nothing tracked" tiles are greyed out.
  Clicking a tile filters the check table to that category.
- Check table: every check, sorted worst-first then soonest-due, with item (and its course or
  qual ID), status, due date, days remaining, source and last-synced time.
- **Responsible for**: if they manage people, the roll-up of their subtree and a link to view
  the tree from them.

### 5.3 Admin (admin view only)

Four tabs, each its own URL: Programs (`/admin/programs`, each program at
`/admin/programs/:id`), Thresholds, Announcements (`/admin/announcements`, each notice at
`/admin/announcements/:id`, a new one at `new`) and Settings file. The Admin link shows only
for the admin persona; anyone else opening `/admin` is told it is for admins.

- **Programs**: create, rename, delete programs; add requirements by typing one or more IDs
  (type plus ID per row, "any one will do" for several, optional name) and remove them. Each
  program shows how many people are on it and how ready they are for it, updating live.
- **Program assignments**: on each program's page, assign people (search and pick, or add
  everyone under a supervisor in one go) and remove them one by one.
- **Thresholds**: warning window in days per category, applied as you type.
- **Announcements**: banner notices (see 5.5). A list showing each notice as the banner shows
  it, with its state (Live, Scheduled, Ended, Off), when it shows, an On switch and Edit. The
  form has type (Outage, Delayed, Info), message (up to 300 characters), optional first and
  last day, On, a live preview, and Publish / Cancel / Delete (asks first).
- Every admin change saves and applies at once (no Save button); a "Saved" note confirms it.
  The exception is an announcement's form: nothing goes live until Publish, so a half-typed
  message never shows.
- **Settings file**: export the admin settings (programs, assignments, warning windows,
  announcements) as JSON, import a JSON file, reset them to defaults. Each viewer's own preferences (theme, layout,
  default scope, persona, demo date) stay out of the file and are kept on import and reset.

### 5.4 Two layouts (both shown in the demo)

- **Dashboard**: the readiness page (tree or list) on the left, the selected person's detail
  in a panel on the right. One screen. The open person is in the URL (`person=`); picking
  another replaces the history entry. Below 1024px wide it opens the full page instead.
- **Drill-down**: the readiness page on its own; clicking a person opens their own detail page
  (Back returns to the same view with its filters kept).

Switched under Preferences in the avatar menu (and later the demo controls), so users can say
which they prefer. Same components, arranged differently. The panel has Open full page and a
Close button; Escape also closes it.

### 5.5 Announcements banner

- Admins' notices for outages and delays, full width under the top bar on every page, one
  strip per notice: color plus icon plus type word plus message. Outage is red, Delayed amber,
  Info blue. Outages show first, then delays, then info.
- A notice shows while it is on and from its first day through its last day (both optional,
  dates only; times go in the message). It hides by itself after the last day.
- Viewers can close Info and Delayed notices; their browser remembers it, and the notice comes
  back if an admin publishes an edit. Outages can't be closed.
- The demo starts with one live Delayed notice about training records.
- In the mockup, notices live in the admin's browser like the other settings (the settings
  file shares them). The real app would store them on a server so everyone sees them.

## 6. Architecture

```
Angular views     readiness (tree, list) · person detail · admin · demo controls
     │  read through Angular services (dependency injection)
core/ (plain TS)  model · status engine · roll-ups · program rules · filter · requirements ·
                  person detail · CSV export · default config
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
  defaults, not the presenter's edits. That is what export/import is for. Saved settings carry
  a schema version; when a release changes the sample programs, the version goes up and older
  saved settings drop their programs and assignments on load, so returning viewers get the new
  ones without a manual reset.
- **The fake people and checks are generated, not stored**: the same seed always gives the
  same org, so demos are repeatable. Only settings are saved.

### Folder layout

```
src/
  core/          model, status engine, roll-ups, program rules, readiness filter, typed
                 requirements, person items, CSV export, default config (no Angular)
  data/          DataSource + MockDataSource, fake-org generator, SettingsStore, settings
                 schema and upgrades
  app/
    features/    readiness (page, toolbar, query in the URL, items in place), org-tree,
                 issues-list, person-detail, admin, changelog, not-found
    shared/      app shell, avatar menu, status badge, category chip, roll-up badge, icons,
                 announcement banner, update prompt, download
    services/    Angular wrappers that provide data/ implementations and computed state
    changelog.ts the change log's entries
```

Demo controls (M7) are not built yet.

### Stack

- **Angular 21**, standalone components, zoneless, signals for state. (Angular 22 needs a
  newer Node than the dev machine has; 21 is fine for a mockup.)
- **Tailwind CSS 4 + daisyUI 5** for styling. daisyUI's `success` / `warning` / `error`
  colors map to the three statuses.
- **Themes**: a custom brand theme (navy, white, gold) is the default, with a dark navy
  variant. An avatar button at the top right shows the current viewer's initials; clicking it
  opens a menu to pick the brand themes or any of daisyUI's built-in themes. The choice is
  saved in the browser. Brand gold is kept clearly different from the yellow/amber "Expiring"
  status color.
- **Change log**: a Change log row near the top of the avatar menu opens its own page
  (`/changelog`). One entry per day, newest first, with short plain-language lines under New,
  Changes and Fixes. Kept by hand in `src/app/changelog.ts`, started 2026-10-31.
- **Hosting**: Vercel, as a static site. Clean URLs, with a `vercel.json` rewrite sending every
  path to `index.html` so deep links and refreshes work.
- **PWA**: `@angular/pwa` (service worker plus manifest). The app is fully static, so it works
  offline and can be installed. When a newer build has downloaded, a notice at the bottom of
  every page says "A new version of Ready to Work is available" with Refresh and Later. The
  app checks for a new build every 15 minutes while open and when its tab comes back into view.
- **Tests**: Angular's default Vitest runner. The core logic has unit tests; screens have
  component tests through the router (no browser needed).
- No backend, no external calls at runtime.

## 7. Fake data plan

- A seeded random generator builds an org of about **200 people, 5 levels deep**: director →
  managers / superintendents → general foremen → foremen → crew.
- Believable fake names (common American first and last names, randomly paired), titles,
  employee IDs, devices, tools and training. No real people.
- Shipyard flavor (2026-10-31): shipyard trade titles (shipfitter, pipefitter, marine
  electrician), shipyard training and qualifications (hot work and fire watch, pipe welding,
  shipyard competent person) and calibrated tools (4-gas meter, ultrasonic thickness gauge).
  Programs are invented ships and classes. No real ship, class, hull number or company name.
- **Crews by trade** (2026-10-31): each superintendent has one trade (Welding, Electrical,
  Pipefitting, Shipfitting) and every crew member under them has a title from it (Welder,
  Welder Helper, Welding Apprentice), except the odd person on loan from another trade.
  Foreman and above keep their usual titles. Crew members generally hold their own trade's
  qualification. The trades, loan rate and qualification rate are tables in the mock data.
- Default mix: about 73% ready, 18% expiring, 9% not ready, spread unevenly so
  some crews look clearly worse than others.
- A few **planted scenarios** for the demo script: one crew with a cluster of expired tool
  calibrations (the Foreman persona's crew); one person whose new program assignment makes them
  red (the crane candidate); SAP passwords expiring across a team next week.
- 6 sample programs (three single ships, three whole classes) with requirements, and default
  assignments. The crane candidate turns red when added to Ridgeline R-01.

## 8. Demo controls

A small panel (toggle with a button or keyboard shortcut) for the presenter:

- **Today**: date picker plus "+1 week / +1 month" buttons. Statuses update live.
- **View as**: switch between a sample foreman, general foreman, superintendent, director and
  admin. Shows subtree scoping and the admin screens without a real login. Also under Preferences in the
  avatar menu (from M6).
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
(Since 2026-10-31 one row per person with a column per category; see 5.1.)
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
