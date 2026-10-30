# Decisions

## 2026-10-30

- **Mockup, not production.** The project is a clickable mockup to present to users. No
  backend; fake data only. The user will build the real system integrations separately.
  Built so the real app can grow out of it (real logic, mocked data behind interfaces).
- **Angular** over React. Both would work; the deciding factor is that the team already has
  Angular pipeline templates. The core logic is plain TypeScript, so the choice only affects
  the view layer.
- **Tailwind CSS + daisyUI** for styling. Requirement: free, well maintained, unlikely to be
  paywalled. daisyUI is MIT, pure CSS and framework-independent; worst case it can be vendored.
  PrimeNG was ruled out (paid tiers). Open-core libraries in general avoided for the same
  reason. The tree component is built in-house since daisyUI has none.
- **PWA**, fully static, installable and offline-capable.
- **Admin settings stored in the browser** (no backend), behind a `SettingsStore` interface
  with a schema version, plus export/import JSON and reset to defaults.
- **Both layouts in the demo** (Dashboard and Drill-down), switchable, so users can choose.
- **Grey (unknown) ranks above green** when picking a person's worst status, so missing data
  never looks like "all good."
- **Hosted on Vercel** (user). Static site with clean URLs; `vercel.json` rewrites every path
  to `index.html` so deep links work.
- **Brand colors navy, white and gold** (user). Custom daisyUI theme as the default, plus a
  dark navy variant. Gold stays distinct from the amber "Expiring" color so status is never
  confused with branding.
- **Theme picker in an avatar menu** (user). Top-right button showing the viewer's initials;
  the menu lists the brand themes and all daisyUI built-in themes.
- **Code is a reference, not a starting point for the team's pipeline** (user). The mockup is
  for validating with business users; the team is not expected to reuse the code directly, so
  stock Angular CLI defaults are kept rather than matching the team's pipeline templates.
- **Angular 21 instead of 22.** Every Angular 22 release needs Node 24.15 or newer; the dev
  machine has 24.14.1. The user left the choice to Claude. Angular 21 runs on the current Node
  with no system change, and the version difference doesn't show in a mockup.
- **Scaffold defaults**: Angular CLI's Tailwind option (PostCSS), Vitest, zoneless, no SSR,
  component prefix `rtw`, 2025 file naming (`app.ts`, not `app.component.ts`).
- **Theme stored under `rtw.theme`** in browser storage, applied as `data-theme` on `<html>`.
  An inline script in `index.html` applies it before Angular starts to avoid a flash of the
  default theme. Unknown saved values fall back to the brand theme.
- **Neutral is slate grey in the brand themes** because it doubles as the "Unknown" status
  color; navy is the primary color instead.
