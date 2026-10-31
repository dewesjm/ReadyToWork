# M6 plan: Admin

Status: **done** 2026-10-30. Questions answered the same day (all recommended options). Spec: DESIGN.md section 5.3.
Acceptance ("Done when", DESIGN.md section 10):
Since then: on 2026-10-31 the requirement picker gave way to typed IDs with "any of" (plans/typed-requirements.md).

> Adding a requirement to a program turns the right people red immediately, and the settings
> survive a reload and an export/import round trip.

## Starting point (end of M5)

- `src/data/settings.ts`: `Settings` already holds `programs`, `assignments` (program ids per
  person) and `warningDays` (overrides per category), with `exportSettings`, `importSettings`
  (checked field by field, readable errors) and `readinessConfigFrom`. No schema change is
  needed for M6.
- `SettingsService` saves every `update()` through the `SettingsStore`; `ReadinessService.result`
  recalculates from settings, so an admin edit shows across the app right away. The pipeline
  for "immediately" already exists; M6 adds the screens that make the edits.
- `DataSource.getCatalog()` lists the items a requirement can be picked from: network account,
  SAP password, 8 trainings, 6 qualifications, 5 SAP roles. Devices, Yubikeys and tools are
  per-person items (one laptop, one key, one wrench), so they are not offered as requirements.
- The fake org has 5 programs and default assignments. Planted scenario: `craneCandidateId` is
  all green but lacks the crane qualification, so assigning Crane Operations turns them red.
- Personas: Foreman (default), Superintendent, Director, Admin (the director, `isAdmin`). There
  is no way to switch persona in the app until M7 (see question 1).
- `/admin` is a placeholder page, linked in the top bar for everyone.

## What the user sees

The Admin page has three tabs, each its own URL (`/admin/programs`, `/admin/thresholds`,
`/admin/file`; the program editor is `/admin/programs/:id`), so Back and bookmarks work.

- **Programs**: one card per program: name, its requirements, how many people are on it, and
  their readiness for that program ("14 people: 9 ready, 5 not ready"). "New program" asks for
  a name. Opening a program shows:
  - **Name**: rename in place (Enter or leaving the field saves; empty or duplicate names are
    refused with a message).
  - **Requirements**: list with Remove; "Add requirement" opens a picker grouped by category,
    with a search box, leaving out items the program already requires.
  - **People** (see question 2): who is on the program, each with their status for it.
  - **Delete program**: asks first, naming what goes with it ("Crane Operations is assigned to
    14 people. Delete it and remove those assignments?").
  - A summary line at the top updates as you edit: add "First Aid and CPR" and it reads
    "14 people: 3 ready, 11 not ready" at once. This is the "Done when" made visible.
- **Thresholds**: one row per category: label and icon, warning window in days (number field,
  0 to 3650), the default next to it, and "Use default" when it's overridden. Changes apply as
  you type (after a short pause).
- **Settings file**:
  - **Export** downloads `ready-to-work-settings-2026-10-30.json`.
  - **Import** picks a file, says what it contains ("5 programs, 61 assignments, 2 warning
    windows"), and asks before replacing. A bad file shows the readable error from
    `importSettings` and changes nothing.
  - **Reset to defaults** asks first.
- Every change saves at once and applies everywhere: there is no Save button. A short "Saved"
  note confirms it. (The "Done when" asks for "immediately"; a draft-and-save flow would also
  mean handling unsaved changes on leaving the page.)

## Steps (commit after each, with doc updates)

### 1. Core: admin edits (no Angular)
- `src/core/program-edits.ts`: pure functions on programs and assignments: `createProgram`
  (id from the name plus a suffix if taken), `renameProgram`, `deleteProgram` (also strips its
  assignments), `addRequirement`, `removeRequirement`, `assign`, `unassign`, `assignMany`, and
  `validateProgramName` (empty, duplicate ignoring case).
- `programSummary(program, result)`: people on it and their status counts for that program's
  requirements. The per-person rule (worst of the checks the program requires, ready when it
  requires nothing) moves out of `person-detail.ts` into one shared `programStatus` helper, so
  the summary and the M4 header badges can't disagree.
- In `src/data/settings.ts`: `setWarningDays` / `clearWarningDays`, `describeSettings` (the
  "5 programs, 61 assignments" line), and import scope per question 4. Assignments to program
  ids that don't exist are dropped on import, and a deleted program used as someone's default
  program falls back to All programs.
- Tests: every edit, including deleting a program that is assigned and is a default; name
  rules; summary counts; the core "Done when" (adding a requirement to a program turns exactly
  the assigned people who lack it red, and no one else changes).

### 2. Admin page shell and access
- Child routes and tabs as above; `/admin` goes to Programs.
- Access per question 1.
- Tests: tabs and URLs, access rule, unknown program id shows "Program not found" with a link
  back.

### 3. Programs and requirements
- Program cards, New program, the program editor (rename, requirements, picker, delete with
  confirm, live summary). Confirmations use a daisyUI `modal` on a native `<dialog>`.
- Tests: create, rename (empty and duplicate refused), add and remove a requirement and see
  the summary change, picker leaves out held items and filters by search, delete with confirm.

### 4. Program assignments
- Per question 2 and question 3: search people by name, title or employee ID and add them;
  "Add everyone under..." with the supervisor pick list; remove one person. Each person shows
  their status for the program and links to their detail.
- Tests: add by search, add a whole subtree, remove, the crane candidate turns red when added.

### 5. Thresholds
- The category table, with question 5's answer deciding whether device check-in limits are
  here too.
- Tests: a change moves a check from ready to expiring at the boundary; Use default; values
  outside 0 to 3650 are refused.

### 6. Settings file
- Export (Blob download), Import (file input, summary, confirm, readable errors), Reset
  (confirm).
- Tests: export then import gives back equal settings; a bad file changes nothing and shows its
  error; reset restores the defaults.

### 7. Check and document
- App-level test of "Done when" with the real fake org: add a requirement, check the right
  people turn red in the readiness result; reload (a new `SettingsService` on the same storage)
  and they are still red; export, reset, import, and the settings match.
- Screenshots: programs, program editor with the picker open, thresholds, settings file,
  390px phone, light and dark.
- Demo check: assign Crane Operations to the crane candidate and see them turn red in the tree.
- Update Tasks.md, DECISIONS.md, README.md, DESIGN.md.

## Questions for the user (answered: the recommended option each time)

1. **How does someone reach the Admin screens before M7's View-as control exists?** The app
   opens as the Foreman, and right now there is no way to switch to the Admin persona.
   - (Recommended) Add "View as" to Preferences in the avatar menu now (as Layout was in M4;
     M7's presenter panel reuses it). Admin then shows only for the Admin persona; other
     personas get no Admin link, and `/admin` tells them it's for admins.
   - Or: leave Admin open to every persona during M6 and add the restriction in M7.
2. **Where are program assignments edited?**
   - (Recommended) On each program's page: a People section listing who is on it, with add and
     remove. Matches "what does this program require, and who is on it."
   - Or: a separate Assignments tab: pick a person, tick their programs.
   - Or both, plus an "Edit programs" button on the person detail for admins (more to build).
3. **"Assign a whole subtree": a one-time action, or a standing rule?**
   - (Recommended) One-time: it adds everyone currently under that supervisor, one by one, and
     they can be removed individually later. Settings keep the same shape.
   - Or: a standing rule ("everyone under Dana Holt"), so people who join that subtree later
     get the program too. Closer to how a real org might work, but the fake org never changes,
     so the demo wouldn't show the difference, and it needs a settings schema change.
4. **What does the settings file carry, and what does Reset clear?** Settings also hold each
   viewer's own preferences (theme, layout, default scope, persona, demo date).
   - (Recommended) The file holds only the admin settings (programs, assignments, warning
     windows); importing keeps the viewer's own preferences. Admin's Reset restores the admin
     settings only; M7's demo Reset is the one that clears everything.
   - Or: the file and Reset cover everything, as M2 built it (importing someone's file would
     also change your theme and persona).
5. **Which limits go on the Thresholds tab?**
   - (Recommended) Only the warning window per category, as DESIGN.md says. Device check-in
     limits (14 days yellow, 30 red) stay in config, since the devices question is still open.
   - Or: also the device check-in limits, and the days before a source counts as out of date.
     More to tune, and a settings schema change (version 2 with a migration).

## Decisions already made (do not reopen)
See DECISIONS.md. In short: settings are one JSON object under `rtw.settings` with a
`schemaVersion` and a migrations table; imports are checked field by field with readable
errors; settings live in each viewer's own browser (export/import is how edits are shared);
program requirements are "all of"; a requirement the person doesn't hold is one red "missing"
check marked "required by"; programs show as header badges with their own status; admins see
everyone; status is always color plus icon plus text.
