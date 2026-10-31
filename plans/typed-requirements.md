# Plan: Requirements typed in by the admin, with "any of"

Status: **waiting on the user's answers** to the second round of questions (end). User request
2026-10-31: the admin types the course, qualification or role ID to make it a requirement; it
isn't picked from a predefined list, and it matches something in an external system. A
requirement can also be met by any one of several items ("electrical course 1 or course 2
fulfills the electrical requirement").

First answers (2026-10-31): the admin types an **ID** (course ID, qual ID, role name); a
**plain text box**, no suggestions (admins know what they're doing); **network account and SAP
password stay addable**, since some programs may not use computers.

Acceptance ("Done when"):

> On a program, an admin adds a requirement by typing one ID, or several IDs of which any one
> will do. People holding a matching record count as holding it; everyone else on the program
> turns red. A program's requirements together are "all of". An ID nobody holds is allowed,
> with a note saying so.

## Starting point

- A requirement is `{ category, itemId, itemName }`, picked from the data source's fixed
  catalog. The program rule matches records by `itemId`. A program's requirements are "all of";
  there is no "any of".
- The fake records use internal ids ("trn:hot-work") that look nothing like a real course or
  qual ID.

## What the user sees

**In Admin › a program › Add requirement**, a small form:
- **Type**: Network account, SAP password, Training, Qualification or Role.
- **ID**: a text box ("HW-210").
- **Or**: "Add another ID (any one will do)" adds a second box, then a third. With more than one
  ID the admin also types a short **name** for the requirement ("Electrical safety").
- The program lists its requirements as: "Electrical safety: any of ELEC-101, ELEC-201" or
  "Crane Operator (QL-CRN-01)". If no one anywhere holds an ID, a note sits next to it: "No
  records with ID ELEC-201 yet. Check the ID."

**On a person**:
- Holding one of the IDs: the check shows the record they hold, as now, with "Required by".
  Holding several: the best one counts.
- Holding none: one red check, "Electrical safety: Missing (any of ELEC-101, ELEC-201), required
  by Tern class (patrol boat)".

## How it works

- A requirement becomes `{ id, category, name?, anyOf: string[] }`; one ID is an "any of" with
  one entry. Program requirements stay "all of".
- The program rule: a requirement is met when the person has a record of that type whose ID is
  in `anyOf` (question 3); its status is the best of the matching records.
- The fixed catalog goes away. The "no records with this ID" note checks the IDs in the records
  the data source returns.
- **Fake data gets realistic IDs**: courses like "HW-210 Hot Work and Fire Watch", quals like
  "QL-CRN-01 Crane Operator", roles keep their SAP names (PS_PLANNER). Person detail shows the ID
  next to the name. One sample "any of" goes in: Tern class requires "Electrical safety: any of
  ELEC-101, ELEC-201", with a second electrical course added to the fake training list.
- Saved settings: requirements change shape. Only the user has opened the demo, so Reset to
  defaults after this ships; no upgrade code.

## Steps

1. Core: the new requirement shape, the any-of rule (best match wins, one red check when none),
   admin edits (add, add an ID to a requirement, remove), with tests.
2. Fake data: realistic IDs, the sample any-of, ID shown on checks; settings file parsing.
3. Admin form: type, ID box(es), name for any-of, the "no records" note; tests.
4. Check and document: desktop and phone; DESIGN.md, DECISIONS.md; a change log line.

## Questions for the user (second round)

1. **Can one "any of" mix types?** For example "Course ELEC-101 or the Electrical qualification".
   - **No: one type per requirement (recommended).** Simpler to set up and to read; your example
     (two courses) fits.
   - Yes: each ID gets its own type.
2. **Naming requirements.**
   - **Only "any of" requirements get a name; a single ID shows the ID plus the item's name from
     the records when one exists (recommended).**
   - Every requirement gets a name the admin types.
3. **Matching IDs.**
   - **Exact, but ignoring upper/lower case and spaces around it (recommended).** "hw-210 " still
     matches "HW-210".
   - Exactly as typed.
4. **Network account and SAP password for people on no program.** Today everyone gets these two
   checks.
   - **Keep giving them to everyone for now; adding them to a program just marks them required by
     it (recommended).** No change to who sees them, and the "no computers" case is noted for the
     real app.
   - Check them only for people whose program requires them. Fits "some programs don't use
     computers", but most people are on no program, so most would lose these checks in the demo.
