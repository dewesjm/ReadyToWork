# Plan: Requirements typed in by the admin

Status: **waiting on the user's answers** (questions at the end). User request 2026-10-31: in
reality the admin types the course, qualification or role name to make it a requirement; it
isn't picked from a predefined list. It matches up with something in an external system.

Acceptance ("Done when"):

> On a program, an admin adds a training, qualification or role requirement by typing it; people
> who hold a matching record in the (fake) source system count as holding it, everyone else on
> the program turns red; a typed item nobody holds is allowed, with a note saying so.

## Starting point

- A requirement is `{ category, itemId, itemName }`. The program rule matches a person's
  records by `itemId`; no match means "Missing, required by <program>" (red).
- The Admin "Add requirement" picker lists the data source's **catalog**
  (`DataSource.getCatalog()`): a fixed list of the fake trainings, qualifications and SAP roles.
  Nothing outside that list can be added.
- Network account and SAP password are in the catalog too, but they aren't things an admin
  would add per program in reality.

## What the user sees

- **Add requirement** opens a small form instead of the list: a **type** (Training,
  Qualification or Role) and a **text box** for the name or code as it appears in that system.
- As the admin types, matching names already seen in the source data are **suggested**, so a
  typo is less likely, but anything can be added (question 2).
- After adding, the requirement shows how many people on the program hold it. If **no one
  anywhere holds it**, a note says so ("No records match 'Hot Work Refresher' in the learning
  system yet. Check the spelling."), since that usually means a typo, though it may be a new
  course.
- Matching ignores upper and lower case and extra spaces (question 1).

## How it works

- A requirement keeps `category` and a typed **key** (the name or code). The program rule
  matches a person's record when the category is the same and the key matches the record's
  name or code.
- The catalog goes away as a fixed list. Suggestions come from the names in the records the
  data source already returns.
- Saved settings keep working: today's requirements already carry an item id and name, so they
  read as typed keys.

## Steps

1. Core: the requirement key and matching rule, with tests (case, spaces, nobody holds it).
2. The Admin form: type, text box with suggestions, the "no records" note; tests.
3. Check and document: desktop and phone; DESIGN.md, DECISIONS.md; a change log line.

## Questions for the user

1. **What does the admin type, and what does it match?**
   - **The name, or the code if the system has one (recommended).** We match either against a
     record's name and its code, ignoring case and spaces. Works for courses with codes
     ("SAF-101") and for SAP roles, whose technical name is the code.
   - The exact code only. Safest match (names get renamed), but admins must look up codes.
   - The exact name only, as it appears in the source system.
2. **Suggestions while typing.**
   - **Suggest names seen in the source data, but allow anything (recommended).**
   - No suggestions: a plain text box.
   - Only allow names that exist in the source (a search over the external system, closest to a
     picker; needs a lookup the real app may not have).
3. **Network account and SAP password**: everyone already gets them as standard checks.
   - **Leave them out of Add requirement; only Training, Qualification and Role (recommended).**
   - Keep them addable.
