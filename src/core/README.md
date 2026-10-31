# core

Plain TypeScript with no Angular imports, pure functions, unit tested. See DESIGN.md section 6.

- `model.ts`, `config.ts`: types, statuses, categories (with `categoryConfig`), sources
- `dates.ts`, `format.ts`: 'YYYY-MM-DD' date math, and dates, days and counts in words
- `status-engine.ts`, `check-order.ts`: a record's status and reason, and check ordering
- `program-rules.ts`, `requirements.ts`, `program-edits.ts`: programs, typed "any of"
  requirements and admin edits
- `readiness-evaluator.ts`, `rollup-calculator.ts`, `org-index.ts`: everyone's checks, status
  and roll-ups
- `readiness-filter.ts`: who the Readiness page shows (scope, Issues only, search) and the
  list's rows
- `person-detail.ts`, `person-items.ts`: one person's view and their items grouped in place
- `csv-export.ts`, `announcements.ts`: the export file and banner notices
- `names.ts`: initials and name helpers
- `test-org.ts`: a small fixed org for unit tests
