# Plan: Expand a person to see what they're missing, in place

Status: **waiting on the user's answers** (questions at the end). User request 2026-10-31: "I
really think I need to be able to expand an individual to see a tree of what they are missing."
Comes before the export (plans/export-csv.md, answered with the recommended options; built
after this).

Acceptance ("Done when"):

> In the tree and the list, a person's row opens in place to show their items, grouped by
> category, each with status (color, icon, text), due date and days left; it closes again;
> Details still opens the full person view; keyboard works.

## Starting point

- Tree: a manager's row expands to show their team; a person with no one under them doesn't
  expand at all. Each row shows chips for the categories with issues.
- List: one row per person, a cell per category with its worst status.
- The items themselves (which course, which tool, due when) are only on Details: the side panel
  (Dashboard layout) or the person page (Drill-down).

## What the user sees

- **A person's issue chips become a toggle** (in the tree; in the list, the row gets a small
  "3 issues" toggle). Opening it shows, under the row and indented:

  ```
  ▾ Not ready · Anthony Wilson · Apprentice            [Tools ⨯] [Training ⚠]
      Tools
        ⨯ Not ready   Torque wrench TW-1042   Calibration overdue   39 days overdue
      Training
        ⚠ Expiring    Hot Work and Fire Watch (HW-210)   Due Nov 27   27 days
  ```

- Items are grouped by category in the usual order, worst first within each, the same wording
  as Details. A "Required by Ridgeline R-01" note shows where a program requires the item.
- **Managers**: clicking the row still opens or closes their team (as now); the chips toggle
  their own items. The two are separate, so a manager can see both.
- Several people can be open at once. Expand all / Collapse all stay about teams only.
- **Keyboard**: on a row, a key opens and closes the items (question 3); items are read out as a
  group under the person.

## Steps

1. Core: a person's items grouped by category (reusing the person detail ordering), with tests.
2. Tree: the toggle, the item rows, keyboard; tests.
3. List: the toggle and item rows (table and phone cards); tests.
4. Check on desktop, dark and phone; docs and a change log line.

## Questions for the user

1. **Which items show when opened.**
   - **The issues only (not ready and expiring), with "Show all N items" to see the ready ones
     too (recommended).** Answers "what are they missing" at a glance.
   - Every item, ready ones included.
   - Follow the Issues only toggle: issues when it is on, everything when it is off.
2. **Where.**
   - **Both the tree and the list (recommended).**
   - Tree only; the list already shows a status per category.
3. **Keyboard.**
   - **Space opens and closes a person's items; Enter still opens Details; Right and Left still
     open and close a team (recommended).**
   - Another key you prefer.
