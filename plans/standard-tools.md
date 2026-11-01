# Review: custom code where a standard tool exists

Status: **answered** 2026-11-01: switch 1-3; item 4 dropped instead (the user removed the
tree's keyboard support); item 5 stays for the real app. User: "in general we want to use
standard tools and not build things. My team may not have an AI to do all the hard parts for
them... evaluate existing patterns."

The question for each piece: would a developer who inherits this find a library they already
know, or code they have to learn? Pieces only the mockup uses (fake data, browser storage) count
for less, since the real app replaces them.

## Already standard (keep)

- **Angular, Tailwind, daisyUI, Vitest**: the framework's defaults.
- **Playwright with axe** for browser and accessibility checks (added today, replacing my own
  screenshot scripts).
- **URL state** through Angular's Router query parameters; **update notice** through Angular's
  service worker (`SwUpdate`); **confirm dialog** on the browser's own `<dialog>`; **download**
  through the usual Blob-and-link pattern. Short, and what any Angular developer would write.

## Worth switching

1. **Icons** (`src/app/shared/icon/`). Lucide icons are copied in by hand as SVG path data, with
   our own `<rtw-icon>` component. Adding an icon means finding and pasting its paths.
   **Standard: `lucide-angular`**, the Lucide project's own Angular package: import an icon by
   name. Small change (28 icons, one component), real app keeps it.
2. **CSV export** (`src/core/csv-export.ts`). Our own quoting and spreadsheet-formula guard, about
   20 lines. **Standard: Papa Parse** (`unparse`, with `escapeFormulae` for the same guard). Small
   change; the quoting rules are easy to get subtly wrong, and the real app keeps the export.
3. **Dropdown menus** (avatar menu, category filter, legend). *Done with CDK Overlay; they hold
   form controls, so not `cdkMenu`.* Each handles its own open and
   close, Escape, outside clicks and ARIA attributes. **Standard: Angular CDK** (`@angular/cdk`,
   from the Angular team): `cdkMenu` for menus, Overlay for popups. It handles keyboard,
   focus and screen readers the same way everywhere. Medium change, real app keeps it.

## Worth switching later, in the real app

4. **The tree's keyboard handling** (`org-tree.ts`, about 45 lines, plus a small model for
   which rows are open). It follows the WAI-ARIA tree pattern by hand. **Standard: CDK Tree**
   (`@angular/cdk/tree`), which has the keys built in. Our tree is unusual (context rows,
   filters that open paths, items under a row), so fitting it to CDK Tree is a bigger job than
   the code it replaces. The code is short and tested; better done when the real app's tree is
   built.
5. **Settings checks** (`src/data/settings.ts`, about 370 lines). Our own checks for the saved
   settings and the settings file. **Standard: Zod** (schemas that check data and give the
   TypeScript types). In the real app the server stores settings, so this code goes away; use
   Zod (or the server's own checks) there rather than rewrite it now.

## Keep as is (custom, with the reason)

- **Date helpers** (`src/core/dates.ts`): three one-line functions on `2026-11-01`-style dates.
  date-fns would add a library for less code than the import lines. Switch if date logic grows.
- **Fake data generator and seeded random** (`src/data/mock/`, `src/data/random.ts`): mockup
  only, the real app drops them. Faker would only replace the name lists.
- **Status engine, roll-ups, program rules, filters** (`src/core/`): this is the app's own
  logic, not a solved problem with a library. It stays plain, tested TypeScript.

## Questions for the user

1. **Switch now: icons, CSV and menus (recommended), or only some of them?** Each is its own
   commit with tests; users shouldn't see any difference.
2. **Tree and settings checks: leave for the real app (recommended), or switch now?**
