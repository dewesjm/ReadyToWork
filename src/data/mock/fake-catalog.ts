import { Announcement, Program } from '../../core';
import { CatalogItem } from '../data-source';

// Invented names and items only. No real people, ships, classes, hull numbers or companies.

export const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas',
  'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kevin', 'Brian', 'Ryan', 'Jason', 'Eric', 'Jeffrey', 'Scott', 'Brandon', 'Gregory', 'Tyler',
  'Kyle', 'Aaron', 'Jacob', 'Nathan', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
  'Susan', 'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Ashley', 'Emily', 'Michelle',
  'Amanda', 'Melissa', 'Rebecca', 'Laura', 'Amy', 'Angela', 'Megan', 'Rachel', 'Heather',
  'Nicole', 'Katie', 'Brittany', 'Danielle', 'Kelly', 'Christina', 'Rose', 'Hannah', 'Lauren',
];

export const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson',
  'Taylor', 'Thomas', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Harris', 'Clark',
  'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Hill', 'Green',
  'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Roberts', 'Turner', 'Phillips', 'Campbell',
  'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Morris', 'Murphy', 'Cook', 'Rogers',
  'Morgan', 'Cooper', 'Peterson', 'Reed', 'Bailey', 'Kelly', 'Howard', 'Ward', 'Cox', 'Garcia',
  'Martinez', 'Rodriguez', 'Lopez', 'Hernandez', 'Gonzalez', 'Sullivan', 'Russell', 'Hayes',
];

export const TITLES = {
  director: 'Director of Production',
  manager: ['Superintendent', 'Production Manager'],
  generalForeman: 'General Foreman',
  foreman: 'Foreman',
  crew: [
    'Shipfitter', 'Pipefitter', 'Welder', 'Marine Electrician', 'Rigger', 'Outside Machinist',
    'Painter', 'Insulator', 'Sheet Metal Worker', 'Apprentice',
  ],
};

const item = (category: string, itemId: string, itemName: string): CatalogItem => ({
  category,
  itemId,
  itemName,
});

export const NETWORK_ACCOUNT = item('network', 'net:domain', 'Domain account');
export const SAP_PASSWORD = item('sap-password', 'sap:prd-password', 'SAP PRD password');
export const SAFETY_REFRESHER = item('training', 'trn:safety-refresher', 'Annual Shipyard Safety Refresher');

export const TRAININGS: CatalogItem[] = [
  SAFETY_REFRESHER,
  item('training', 'trn:hot-work', 'Hot Work and Fire Watch'),
  item('training', 'trn:confined-space', 'Confined Space Entry'),
  item('training', 'trn:fall-protection', 'Fall Protection'),
  item('training', 'trn:loto', 'Lockout/Tagout'),
  item('training', 'trn:hazcom', 'Hazard Communication'),
  item('training', 'trn:hearing', 'Hearing Conservation'),
  item('training', 'trn:export-control', 'Export Control Basics'),
  item('training', 'trn:cyber', 'Cybersecurity Awareness'),
];

export const QUALIFICATIONS: CatalogItem[] = [
  item('qualification', 'qual:crane', 'Crane Operator'),
  item('qualification', 'qual:rigging', 'Qualified Rigger'),
  item('qualification', 'qual:welding', 'Structural Welding'),
  item('qualification', 'qual:pipe-welding', 'Pipe Welding'),
  item('qualification', 'qual:marine-electrician', 'Marine Electrician'),
  item('qualification', 'qual:competent-person', 'Shipyard Competent Person'),
  item('qualification', 'qual:fire-watch', 'Fire Watch'),
];

export const ROLES: CatalogItem[] = [
  item('access-role', 'role:MM_BUYER', 'SAP role MM_BUYER'),
  item('access-role', 'role:PM_TECH', 'SAP role PM_TECH'),
  item('access-role', 'role:QM_INSPECTOR', 'SAP role QM_INSPECTOR'),
  item('access-role', 'role:WM_CLERK', 'SAP role WM_CLERK'),
  item('access-role', 'role:PS_PLANNER', 'SAP role PS_PLANNER'),
];

/** Items that can be program requirements (shared by everyone who holds them). */
export const CATALOG: CatalogItem[] = [
  NETWORK_ACCOUNT,
  SAP_PASSWORD,
  ...TRAININGS,
  ...QUALIFICATIONS,
  ...ROLES,
];

export const TOOL_TYPES = [
  { prefix: 'TW', name: 'Torque wrench' },
  { prefix: 'MM', name: 'Multimeter' },
  { prefix: 'PG', name: 'Pressure gauge' },
  { prefix: 'GM', name: '4-gas meter' },
  { prefix: 'CL', name: 'Caliper' },
  { prefix: 'MC', name: 'Micrometer' },
  { prefix: 'IR', name: 'Insulation resistance tester' },
  { prefix: 'UT', name: 'Ultrasonic thickness gauge' },
];

const req = (id: string) => {
  const found = CATALOG.find((c) => c.itemId === id);
  if (!found) throw new Error(`Unknown catalog item ${id}`);
  return found;
};

/** The program that needs the crane qualification the planted crane candidate lacks. */
export const CRANE_PROGRAM_ID = 'prog-ridgeline-r01';

/**
 * Shipbuilding programs: one ship on larger builds, the whole class on smaller, modular ones.
 * The real app gets its program list from elsewhere; the name says which it is.
 */
export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: CRANE_PROGRAM_ID,
    name: 'Ridgeline R-01 (supply ship)',
    requirements: [req('qual:crane'), req('qual:rigging'), req('trn:hot-work')],
  },
  {
    id: 'prog-ridgeline-r02',
    name: 'Ridgeline R-02 (supply ship)',
    requirements: [req('qual:rigging'), req('trn:hot-work'), req('trn:confined-space')],
  },
  {
    id: 'prog-bastion-b01',
    name: 'Bastion B-01 (amphibious ship)',
    requirements: [req('trn:export-control'), req('trn:cyber'), req('role:PS_PLANNER')],
  },
  {
    id: 'prog-kestrel',
    name: 'Kestrel class (patrol boat)',
    requirements: [req('qual:welding'), req('trn:confined-space')],
  },
  {
    id: 'prog-tern',
    name: 'Tern class (survey vessel)',
    requirements: [req('qual:marine-electrician'), req('trn:loto')],
  },
  {
    id: 'prog-harrier',
    name: 'Harrier class (fast attack craft)',
    requirements: [req('trn:export-control'), req('qual:pipe-welding')],
  },
];

/** The demo starts with one live notice so users see the banner. No dates: always live. */
export const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    type: 'delayed',
    message:
      'Training records from the learning system are 2 days behind. Courses completed in the last 2 days may not show yet.',
    startsOn: null,
    endsOn: null,
    on: true,
    revision: 1,
  },
];
