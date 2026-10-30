# Ready to Work

Clickable mockup of a workforce-readiness dashboard (access, passwords, devices, training,
qualifications, Yubikeys, program requirements, tools), built to show users and gather
feedback. Read DESIGN.md first; it is the spec and the build plan.

## Architecture rules
- `src/core/` is plain TypeScript with no Angular imports: types, status engine, roll-ups,
  program rules. Pure functions, unit tested.
- Screens get data only through the `DataSource`, `SettingsStore` and `Clock` interfaces in
  `src/data/`. Never import fake data directly into a component.
- Every tunable value (warning windows, categories, status mix, seeds) lives in config tables,
  not in logic.
- Fake data only. Never add real names or real employee data.
- Styling with Tailwind + daisyUI classes. Status is always color plus icon plus text.
- Use only established cross-browser features.

## How we work
- One milestone at a time (DESIGN.md section 10). Plan it, the user reviews, then build. The
  milestone's "Done when" line is the acceptance check.
- Commit after every working step and say so. The user does all pushes.
- Open questions are the user's to decide: explain the options and wait.
- Every commit carries its doc updates (Tasks.md, DECISIONS.md, README.md, DESIGN.md).
- Record tech decisions and user decisions in DECISIONS.md with date and reasoning.
- Tasks.md is the one task list.
- Write tests alongside the code. Typecheck with `npm run build`.
- After every change, summarize: files touched, behavior changed, anything unverified.
