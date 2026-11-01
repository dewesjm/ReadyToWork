# Ready to Work

Clickable mockup of a workforce-readiness dashboard for foremen and managers. Fake data only,
no backend. See DESIGN.md for the spec and build plan.

## Running

Requires Node 22.12 or newer (Angular 21).

- `npm install`
- `npm start` serves the app at http://localhost:4200
- `npm test` runs the unit tests (Vitest)
- `npm run e2e` runs the browser checks (Playwright with axe accessibility checks; uses the
  installed Chrome)
- `npm run build` builds the static PWA into `dist/ready-to-work/browser`

The service worker only runs in the production build. To try offline/install locally, serve
the build with an SPA fallback, for example `npx serve -s dist/ready-to-work/browser`.
After a new deploy, open copies of the app show a "new version is available" notice; Refresh
loads it.

## Deploying

Vercel, as a static site. `vercel.json` sets the build output folder, rewrites every path to
`index.html` so deep links work, and stops the service worker files from being cached.

## Layout

- `plans/`: one plan per milestone or feature, written and reviewed before it is built

- `src/core/`: plain TypeScript domain logic (no Angular), unit tested
- `src/data/`: `DataSource`, `SettingsStore`, `Clock` and their mock implementations; the fake
  org (people, trades, items, programs) is in `src/data/mock/`
- `src/app/features/`: screens (readiness page with tree and list views, person detail, admin,
  change log); `readiness/` holds the URL-backed query, the toolbar, the tree's expand state and
  the items shown in place; `admin/` holds the admin tabs and their child routes
- `src/app/shared/`: app shell, avatar menu, theme list, shared UI pieces and the file download
- `src/app/changelog.ts`: the change log shown at `/changelog`; add a line for any change users
  would notice
- `src/app/services/`: Angular services wrapping core and data; `tokens.ts` is where the mock
  data source, settings store and clock are swapped for real ones

## Credits

Icons are from [Lucide](https://lucide.dev) (ISC License), through the `lucide-angular` package;
the ones in use are listed in `src/app/shared/icon/icons.ts`.
