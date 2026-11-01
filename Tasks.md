# Tasks

## Now
- [ ] User checks in the browser (each built and tested, not yet looked at by the user):
  - [ ] M5 list view and M6 Admin
  - [ ] Announcements
  - [ ] Change log
  - [ ] List by person
  - [ ] Shipyard data and crews by trade
  - [ ] Typed requirements
  - [ ] Items in place (and revise the wording)
  - [ ] An export opened in Excel
  - [ ] Phone and accessibility pass (on a real phone if possible: manager rows with long counts
    still put Details on a line of their own)
- [ ] Department per person: on hold, draft in [plans/department.md](plans/department.md)
- [ ] Devices: plan the "not issued a device" rule (user, 2026-11-01)

## Open questions (user's to decide)
- Roughly how big is the real org, and how deep? (Mockup assumes about 200 people, 5 levels.)
- Devices: does "not issued a device" replace the expiry and check-in checks, or join them?
- Access and roles: is the concern only missing or expiring roles, or also people holding
  roles they shouldn't (excess access)?
- Tools: assigned to individuals, crews, or both? (They come from a separate system.)

## Follow-ups
- Demo: ask users whether they miss sorting the list by column (M5 shipped one fixed order).
- Demo: ask admins whether "Add everyone under" should be a standing rule (new people under that
  supervisor join the program) rather than a one-time add.
- Hosting: password-protect the Vercel site with basic-auth middleware (`middleware.ts`,
  credentials in Vercel environment variables). Decided, not built; see DECISIONS.md 2026-10-31.
- Demo: ask whether people want a "Show items" switch that opens everyone's items at once
  (proposed 2026-10-31, held until asked).
- Items in place repeat the days ("Expires in 28 days · Due Nov 28, 2026 · 28 days"), as Details
  does; revise the wording with the user.
- Announcements: remove the viewer's ability to close (dismiss) Info and Delayed notices (user,
  2026-10-31: probably not a good thing to have). Noted for later, not changed yet.

## Later (real app, not this mockup)
- Real data integrations (HR, AD/Entra, SAP, learning system, asset management, Yubikeys)
- Where real program assignments come from (likely by who you work for: "you work for X, so you
  get their program")
- Notifications / weekly digest email
- History and audit trail
- Trade-specific qualifications within a program (a program may need different quals per trade)

## Done
- [x] User reviews DESIGN.md
- [x] M0 Setup (scaffold, brand themes + avatar menu, shell and routes, PWA, Vercel config)
- [x] User checks M0 in the browser; colors approved
- [x] Merge Org tree and Issues into one Readiness page (Tree / List switch, Issues only toggle)
- [x] M1 plan reviewed
- [x] M1 Core logic (model, dates, config, StatusEngine, ProgramRules, OrgIndex,
  RollupCalculator, ReadinessEvaluator, check ordering; 73 tests)
- [x] Decide scope picker: supervisor + program pick lists (trial), keyword search, defaults in
  avatar menu Preferences
- [x] M2 plan reviewed (fake dates relative to the real date)
- [x] M2 Fake data and storage (seeded org, MockDataSource, settings store, Angular wiring;
  110 tests)
- [x] M3 plan written: [plans/M3-readiness-tree.md](plans/M3-readiness-tree.md)
- [x] User answers the 3 questions at the end of the M3 plan (all recommended options)
- [x] M3 Readiness page (toolbar + tree view), steps 1-7 in the plan (164 tests)
  - [x] 1. Icons and shared status pieces
  - [x] 2. Core filtering (`ReadinessFilter`, supervisor options, keyword highlight)
  - [x] 3. Query state in the URL and the toolbar
  - [x] 4. Tree view
  - [x] 5. Keyboard navigation
  - [x] 6. Preferences in the avatar menu
  - [x] 7. Check and document (screenshots: desktop and 390px phone, light and dark)

- [x] User checks M3 in the browser
- [x] M4 plan written: [plans/M4-person-detail.md](plans/M4-person-detail.md)
- [x] User answers the 5 questions at the end of the M4 plan (all recommended options)
- [x] M4 Person detail and both layouts, steps 1-6 in the plan (205 tests)
  - [x] 1. Core: person detail and display wording
  - [x] 2. Person detail components
  - [x] 3. Drill-down: the person page
  - [x] 4. Dashboard: the side panel
  - [x] 5. Layout switch in Preferences
  - [x] 6. Check and document (screenshots: dashboard, drill-down, 390px phone, light and dark)

- [x] User checks M4 in the browser
- [x] M5 plan written: [plans/M5-list-view.md](plans/M5-list-view.md)
- [x] User answers the 4 questions at the end of the M5 plan (all recommended options)
- [x] M5 List view, steps 1-4 in the plan (227 tests)
  - [x] 1. Core: list rows (shared scope and issue rule, `listChecks`)
  - [x] 2. List component (with focus restore and Show more)
  - [x] 3. Toolbar and focus
  - [x] 4. Check and document (parity test for all personas; screenshots desktop, panel, 390px phone, light and dark)

- [x] M6 plan written: [plans/M6-admin.md](plans/M6-admin.md)
- [x] User answers the 5 questions at the end of the M6 plan (all recommended options)
- [x] M6 Admin, steps 1-7 in the plan (276 tests)
  - [x] 1. Core: admin edits
  - [x] 2. Admin page shell and access (View as in Preferences)
  - [x] 3. Programs and requirements
  - [x] 4. Program assignments
  - [x] 5. Thresholds
  - [x] 6. Settings file
  - [x] 7. Check and document (acceptance test with the fake org; screenshots desktop and
    390px phone, light and dark; crane candidate turns red in the tree)

- [x] Remove the Unknown status: three statuses, judged by dates only (user request; 274 tests)
- [x] Full-width pages; common American fake names (user requests)
- [x] Tree: aligned issue chips; row click expands, Details opens the person; "new version available" notice with Refresh (user requests; 281 tests)
- [x] Announcements plan written (user request: admin banner for outages and delays): [plans/announcements.md](plans/announcements.md)
- [x] User answers the 5 questions at the end of the announcements plan (all recommended options)
- [x] Announcements, steps 1-4 in the plan (307 tests)
  - [x] 1. Core: notices (292 tests)
  - [x] 2. The banner (298 tests)
  - [x] 3. Admin › Announcements tab (307 tests)
  - [x] 4. Check and document (screenshots desktop, dark and 390px phone)
- [x] Tree: only the Details button opens a person; leaf row clicks do nothing (user request; 307 tests)
- [x] Change log plan written (user request: change log in the avatar menu): [plans/changelog.md](plans/changelog.md)
- [x] User answers the 4 questions at the end of the change log plan (own page, start today,
  no dot, dates only; New / Changes / Fixes)
- [x] Change log page and avatar menu row (311 tests)
- [x] List by person plan written (user request: a column per category): [plans/list-by-person.md](plans/list-by-person.md)
- [x] User answers the 5 questions at the end of the list by person plan (all recommended options)
- [x] List by person: one row per person, a column per category (310 tests)
- [x] Shipyard sample data plan written (user request: fake ships, titles, tools, training): [plans/shipyard-data.md](plans/shipyard-data.md)
- [x] User answers the 3 questions at the end of the shipyard data plan
- [x] Shipyard sample data: ships and classes as programs, shipyard titles, training, quals, tools (310 tests)
- [x] Typed requirements plan written (user request: admin types the course, qualification or role): [plans/typed-requirements.md](plans/typed-requirements.md)
- [x] User answers the 3 questions at the end of the typed requirements plan (IDs, plain text box,
  network and SAP addable; plus a new need: "any of" requirements)
- [x] User answers the second round of 4 questions in the typed requirements plan
- [x] Typed requirements: IDs typed in Admin, "any of" with mixed types, optional names (326 tests)
- [x] Saved settings upgrade (version 2): older saved settings get the new sample programs, no manual reset (328 tests)
- [x] Export plan written (user request: export to Excel/CSV on both views): [plans/export-csv.md](plans/export-csv.md)
- [x] User answers the 3 questions at the end of the export plan (recommended options; build after inline items)
- [x] Inline items plan written (user request: expand a person to see what they're missing): [plans/inline-items.md](plans/inline-items.md)
- [x] User answers the 3 questions at the end of the inline items plan (recommended, no keyboard shortcut)
- [x] Inline items: open a person's items under their row in the tree and the list (335 tests)
- [x] Export to CSV from both views, per plans/export-csv.md (339 tests)
- [x] Crews by trade: crew titles and quals follow their superintendent's trade, odd person on loan (343 tests)
- [x] Search looks through everyone in scope, pausing Issues only (user decision)
- [x] M7 demo controls dropped (user, 2026-11-01): persona switching in Preferences is enough
- [x] Browser checks with Playwright and axe; contrast and screen-reader fixes (M8 step 1)
- [x] Phone tap targets at least 44px for the most-tapped controls (M8 step 2)
- [x] Phone header and tree rows (M8 steps 3-4); phone and accessibility pass done (32 browser checks)
