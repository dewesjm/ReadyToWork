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
- [ ] M3 Readiness page (toolbar + tree view): plan for review

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
- Design table lists "Program requirements" as a category; in the core, program checks live in
  the required item's own category (with "required by"). Decide in M4 whether the person
  summary strip also shows a Programs tile.
- M7: the persona can only change in code/settings until the View-as control exists (default
  is the Foreman persona).

## Later (real app, not this mockup)
- Real data integrations (HR, AD/Entra, SAP, learning system, asset management, Yubikeys)
- Where real program assignments come from
- Notifications / weekly digest email
- History and audit trail
