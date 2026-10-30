import { Program } from '../../core';
import { CatalogItem } from '../data-source';

// Invented names and items only. No real people.

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
  director: 'Director of Field Operations',
  manager: ['Superintendent', 'Operations Manager'],
  generalForeman: 'General Foreman',
  foreman: 'Foreman',
  crew: [
    'Electrician', 'Pipefitter', 'Ironworker', 'Carpenter', 'Laborer', 'Equipment Operator',
    'Welder', 'Millwright', 'Rigger', 'Apprentice',
  ],
};

const item = (category: string, itemId: string, itemName: string): CatalogItem => ({
  category,
  itemId,
  itemName,
});

export const NETWORK_ACCOUNT = item('network', 'net:domain', 'Domain account');
export const SAP_PASSWORD = item('sap-password', 'sap:prd-password', 'SAP PRD password');
export const SAFETY_REFRESHER = item('training', 'trn:safety-refresher', 'Annual Safety Refresher');

export const TRAININGS: CatalogItem[] = [
  SAFETY_REFRESHER,
  item('training', 'trn:export-control', 'Export Control Basics'),
  item('training', 'trn:hazcom', 'Hazard Communication'),
  item('training', 'trn:fall-protection', 'Fall Protection'),
  item('training', 'trn:cyber', 'Cybersecurity Awareness'),
  item('training', 'trn:loto', 'Lockout/Tagout'),
  item('training', 'trn:confined-space', 'Confined Space Entry'),
  item('training', 'trn:first-aid', 'First Aid and CPR'),
];

export const QUALIFICATIONS: CatalogItem[] = [
  item('qualification', 'qual:forklift', 'Forklift Certification'),
  item('qualification', 'qual:crane', 'Crane Operator'),
  item('qualification', 'qual:rigging', 'Qualified Rigger'),
  item('qualification', 'qual:welding', 'Structural Welding'),
  item('qualification', 'qual:aerial-lift', 'Aerial Lift Operator'),
  item('qualification', 'qual:electrical', 'Electrical Qualified Person'),
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
  { prefix: 'GD', name: 'Gas detector' },
  { prefix: 'CL', name: 'Caliper' },
];

const req = (id: string) => {
  const found = CATALOG.find((c) => c.itemId === id);
  if (!found) throw new Error(`Unknown catalog item ${id}`);
  return found;
};

export const CRANE_PROGRAM_ID = 'prog-crane';

export const DEFAULT_PROGRAMS: Program[] = [
  {
    id: 'prog-export',
    name: 'Export Controlled Work',
    requirements: [req('trn:export-control'), req('trn:cyber')],
  },
  {
    id: CRANE_PROGRAM_ID,
    name: 'Crane Operations',
    requirements: [req('qual:crane'), req('qual:rigging')],
  },
  {
    id: 'prog-confined',
    name: 'Confined Space Work',
    requirements: [req('trn:confined-space'), req('trn:first-aid')],
  },
  {
    id: 'prog-purchasing',
    name: 'Field Purchasing',
    requirements: [req('role:MM_BUYER'), req('trn:export-control')],
  },
  {
    id: 'prog-electrical',
    name: 'Electrical Work',
    requirements: [req('qual:electrical'), req('trn:loto')],
  },
];
