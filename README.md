# Ready to Work

Clickable mockup of a workforce-readiness dashboard for foremen and managers. Fake data only,
no backend. See DESIGN.md for the spec and build plan.

## Running

Requires Node 22.12 or newer (Angular 21).

- `npm install`
- `npm start` serves the app at http://localhost:4200
- `npm test` runs the unit tests (Vitest)
- `npm run build` builds the static PWA into `dist/ready-to-work/browser`

The service worker only runs in the production build. To try offline/install locally, serve
the build with an SPA fallback, for example `npx serve -s dist/ready-to-work/browser`.

## Deploying

Vercel, as a static site. `vercel.json` sets the build output folder, rewrites every path to
`index.html` so deep links work, and stops the service worker files from being cached.

## Layout

- `src/core/`: plain TypeScript domain logic (no Angular), unit tested
- `src/data/`: `DataSource`, `SettingsStore`, `Clock` and their mock implementations
- `src/app/features/`: screens (readiness page with tree and list views, person detail, admin)
- `src/app/shared/`: app shell, avatar menu, theme list, shared UI pieces
- `src/app/services/`: Angular services wrapping core and data; `tokens.ts` is where the mock
  data source, settings store and clock are swapped for real ones
