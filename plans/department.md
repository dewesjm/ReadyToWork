# Plan: A department on each person

Status: **on hold** 2026-10-31 (user: "maybe not yet"; trades came first). User request 2026-10-31: "add
department to each person."
Since then (2026-10-31): crews are by trade (one per superintendent), so departments could follow the trade.

Acceptance ("Done when"):

> Every fake person has a department, shown on their person page and in the list and export,
> and the search box finds people by department.

## Starting point

- A person has an id, employee ID, name, title and manager. The real app will get people from
  HR (`DataSource.getPeople()`), which would carry the department.
- The tree row shows name and title; the list shows name, title and manager; the person page
  shows title and employee ID; the export has name, employee ID, title and reports-to.
- Search matches name, title and employee ID.

## What changes

- **Model**: `Person.department` (text), filled by the fake data generator (question 1).
- **Shown**: person page header ("Shipfitter · Structural · E10571"); a Department column in
  the list and in the export; in the tree, after the title only when the search matched it
  (as the employee ID does now), to keep tree rows short (question 2).
- **Search** matches department too ("piping" finds everyone in Piping).

## Steps

1. Model, fake data (seeded, so the same every time), search; tests.
2. Person page, list column, tree, export; tests.
3. Check desktop and phone; docs and a change log line.

## Questions for the user

1. **How departments are assigned in the fake data.**
   - **By crew trade (recommended):** each foreman's crew belongs to one department that fits the
     work (Structural, Piping, Electrical, Paint and Coatings, Outfitting, Rigging), and crew
     titles match it (shipfitters and welders in Structural, pipefitters in Piping). Managers
     above get a department like "Production". Reads most like a real yard.
   - Randomly per person, from the same list. Simpler, but a crew mixes departments.
   - A different list you give me.
2. **In the tree.**
   - **Only when the search matches it, like the employee ID (recommended).** Rows stay short.
   - Always, after the title ("Kelly Peterson · Painter · Paint and Coatings").
3. **A department filter** next to the categories, to show one department.
   - **Not now; search covers it (recommended).**
   - Yes, a Department picker in the toolbar.
