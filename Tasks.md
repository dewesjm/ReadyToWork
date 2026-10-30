# Tasks

## Now
- [x] User reviews DESIGN.md
- [ ] M0 Setup
  - [x] Scaffold Angular 21 with Tailwind and Vitest
  - [x] daisyUI, brand theme, avatar theme menu
  - [x] Folder layout, app shell, routes, placeholder pages
  - [ ] PWA (service worker, manifest, icons)
  - [ ] Vercel rewrite config
  - [ ] Check "Done when"

## Open questions (user's to decide)
- Roughly how big is the real org, and how deep? (Mockup assumes about 200 people, 5 levels.)
- Will the demo be presented live, or sent as a link for users to try alone? (A link needs
  more on-screen guidance.)
- Devices: what makes a device "not ready" for your users (access expiring, not checked in,
  compliance)? Mockup assumes access expiry plus last check-in.
- Access and roles: is the concern only missing or expiring roles, or also people holding
  roles they shouldn't (excess access)?
- Tools: assigned to individuals, crews, or both?

## Follow-ups
- M2: move the saved theme into SettingsStore with the other demo preferences.
- M2/M7: avatar initials come from a fixed placeholder viewer until view-as exists.

## Later (real app, not this mockup)
- Real data integrations (HR, AD/Entra, SAP, learning system, asset management, Yubikeys)
- Where real program assignments come from
- Notifications / weekly digest email
- History and audit trail
