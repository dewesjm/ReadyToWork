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
- Any change users would notice gets a line in the change log (`src/app/changelog.ts`) in the
  same commit, under New, Changes or Fixes for that day. Keep it short and plain: what changed
  for the user, not how. Internal work (tests, docs, refactors) stays out.
- Write tests alongside the code. Typecheck with `npm run build`.
- After every change, summarize: files touched, behavior changed, anything unverified.

## Working notes (for a fresh session)
- Start here: Tasks.md "Now" shows where things stand; milestone plans live in `plans/`.
- Angular 21 (not 22: the dev machine's Node 24.14 is too old for 22). Tailwind 4 + daisyUI 5.
- `npm start` (dev server), `npm test -- --watch=false` (Vitest), `npm run build` (typecheck).
- Run one spec file: `npx ng test --watch=false --include src/path/to/file.spec.ts`.
- Component and service tests that need data call `loadAppState()` from `src/app/testing.ts`.
- Fake org facts for tests come from `MockDataSource.fakeOrg()` (`scenarios`, `targets`);
  don't hard-code generated names.
- Visual check without a browser tool: `npm run build`, serve with
  `npx serve -s dist/ready-to-work/browser -l 4321` (background), then
  `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu
  --window-size=1200,800 --virtual-time-budget=5000 --screenshot=<scratchpad>/x.png <url>`
  and read the PNG.
- Headless Chrome windows can't go below about 500px wide, so `--window-size=390,...` crops
  rather than testing phone width. For a real phone viewport, start Chrome with
  `--remote-debugging-port` and use the DevTools `Emulation.setDeviceMetricsOverride` command
  (Node 24 has a built-in WebSocket). Run parallel screenshots with separate `--user-data-dir`s.
- Persona and theme are saved preferences in localStorage (`rtw.settings`), not URL params. To
  screenshot another persona, serve a copy of the build whose index.html sets that key in a
  script before the app boots.
- Git warns "LF will be replaced by CRLF" on every commit; harmless.
- Changing the default sample programs (`DEFAULT_PROGRAMS`)? Browsers that opened the demo keep
  their saved copy. Bump `SETTINGS_SCHEMA_VERSION` in `src/data/settings.ts` and add
  `replaceSamplePrograms` to `MIGRATIONS` for the old version, so they get the new ones.
