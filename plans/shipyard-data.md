# Plan: Shipyard sample data

Status: **waiting on the user's answers** (questions at the end). User request 2026-10-31: get
the sample data closer to reality without real company data. A program is a shipbuilding
program: on larger ships usually one specific ship, on smaller, modular builds the whole class.
Fake ship names are fine; job titles, tool names and training are a good start.

Acceptance ("Done when"):

> The demo's programs are fictional ships and ship classes with requirements that fit them, and
> titles, trainings, qualifications and tools read like a shipyard; no real ship, class, hull
> number or company name appears; every planted scenario still works.

## Starting point

- All fake names live in `src/data/mock/fake-catalog.ts`: titles, trainings, qualifications,
  SAP roles, tool types and the 5 default programs (today work types such as "Crane
  Operations" and "Electrical Work").
- People are put on programs by the generator (`programAssignmentRate`, 30% of crew). The
  planted "crane candidate" is green until an admin adds them to Crane Operations, which
  requires a crane qualification they lack. Admin tests use `CRANE_PROGRAM_ID`.
- "Program" stays the word in the UI; only the data changes.
- Programs and assignments are saved in each viewer's browser with the rest of the settings
  (schema version 1), so anyone who has opened the demo still has the old programs (question 1).

## What changes

**Programs** (invented classes, named after birds and landforms; no real class names or hull
numbers):

| Program | Kind | Requires (examples) |
|---|---|---|
| Ridgeline R-01 (supply ship) | One ship | Crane Operator, Qualified Rigger, Hot Work |
| Ridgeline R-02 (supply ship) | One ship | Crane Operator, Qualified Rigger, Hot Work |
| Bastion B-01 (amphibious ship) | One ship | Export Control Basics, Cybersecurity Awareness, SAP role PS_PLANNER |
| Kestrel class (patrol boat) | Whole class | Structural Welding, Confined Space Entry |
| Tern class (survey vessel) | Whole class | Marine Electrician, Lockout/Tagout |
| Harrier class (fast attack craft) | Whole class | Export Control Basics, Pipe Welding |

The crane candidate scenario moves to Ridgeline R-01, which needs the crane qualification.

**Job titles**: Director of Production; Superintendent, Production Manager; General Foreman;
Foreman; crew: Shipfitter, Pipefitter, Welder, Marine Electrician, Rigger, Outside Machinist,
Painter, Insulator, Sheet Metal Worker, Apprentice.

**Trainings**: Annual Shipyard Safety Refresher, Hot Work and Fire Watch, Confined Space Entry,
Fall Protection, Lockout/Tagout, Hazard Communication, Hearing Conservation, Export Control
Basics, Cybersecurity Awareness.

**Qualifications**: Crane Operator, Qualified Rigger, Structural Welding, Pipe Welding, Marine
Electrician, Shipyard Competent Person, Fire Watch.

**Tools** (calibrated): Torque wrench, Multimeter, Pressure gauge, 4-gas meter, Caliper,
Micrometer, Insulation resistance tester, Ultrasonic thickness gauge.

**Unchanged**: people's names, SAP role codes (generic module codes), network account, SAP
password, devices, Yubikeys, the org shape and the status mix.

## Steps

1. Catalog: the new lists, programs and requirements; the crane scenario on Ridgeline R-01;
   tests updated (they read names from `fakeOrg()`, so few hard-coded names change).
2. Saved settings in viewers' browsers (question 1).
3. Check the screens (tree, list, person, Admin › Programs) on desktop and phone; docs and a
   change log line.

## Questions for the user

1. **Viewers who already opened the demo** still have the old programs saved in their browser.
   - **Replace the programs and assignments with the new ones once, keeping their preferences,
     thresholds and announcements (recommended).** A small settings upgrade (version 2); no
     one sees the old programs again.
   - Leave it; they use Admin › Settings file › Reset to defaults. Simpler, but reviewers
     will see a mix of old and new.
2. **Showing ship versus class.**
   - **Just in the name (recommended)**: "Ridgeline R-01 (supply ship)" versus "Kestrel class
     (patrol boat)". Nothing new to build or explain.
   - A "Kind" field (One ship / Whole class) shown as a small badge on programs and picked in
     Admin when creating one.
3. **The program list above**: keep it, or change names, how many, or the ship/class mix?
