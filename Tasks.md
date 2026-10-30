# Tasks

## Now
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

- [ ] User checks M5 in the browser
- [x] M6 plan written: [plans/M6-admin.md](plans/M6-admin.md)
- [x] User answers the 5 questions at the end of the M6 plan (all recommended options)
- [ ] M6 Admin, steps 1-7 in the plan
  - [x] 1. Core: admin edits
  - [x] 2. Admin page shell and access (View as in Preferences)
  - [x] 3. Programs and requirements
  - [x] 4. Program assignments
  - [x] 5. Thresholds
  - [x] 6. Settings file
  - [ ] 7. Check and document

## Open questions (user's to decide)
- Roughly how big is the real org, and how deep? (Mockup assumes about 200 people, 5 levels.)
- Will the demo be presented live, or sent as a link for users to try alone? (A link needs
  more on-screen guidance.)
- Devices: what makes a device "not ready" for your users (access expiring, not checked in,
  compliance)? Mockup assumes access expiry plus last check-in (14 days yellow, 30 red).
- Access and roles: is the concern only missing or expiring roles, or also people holding
  roles they shouldn't (excess access)?
- Tools: assigned to individuals, crews, or both?

## Follow-ups
- M8: the "Ready to Work" brand wraps onto two lines in the header at phone width.
- Demo: ask users whether they miss sorting the list by column (M5 shipped one fixed order).
- M8: context rows are dimmed with opacity; check their contrast in the accessibility pass.

## Later (real app, not this mockup)
- Real data integrations (HR, AD/Entra, SAP, learning system, asset management, Yubikeys)
- Where real program assignments come from
- Notifications / weekly digest email
- History and audit trail
