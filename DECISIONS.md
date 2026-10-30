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
