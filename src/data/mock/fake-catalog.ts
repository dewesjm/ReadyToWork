import { Announcement, Program, Requirement } from '../../core';
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

// Item IDs look like the codes a learning system, quals database or SAP would use (invented).
export const NETWORK_ACCOUNT = item('network', 'NET-DOMAIN', 'Domain account');
export const SAP_PASSWORD = item('sap-password', 'SAP-PRD', 'SAP PRD password');
export const SAFETY_REFRESHER = item('training', 'SAF-100', 'Annual Shipyard Safety Refresher');

export const TRAININGS: CatalogItem[] = [
  SAFETY_REFRESHER,
  item('training', 'HW-210', 'Hot Work and Fire Watch'),
  item('training', 'CS-220', 'Confined Space Entry'),
  item('training', 'FP-230', 'Fall Protection'),
  item('training', 'LOTO-240', 'Lockout/Tagout'),
  item('training', 'HAZ-250', 'Hazard Communication'),
  item('training', 'HC-260', 'Hearing Conservation'),
  item('training', 'EXP-300', 'Export Control Basics'),
  item('training', 'CYB-310', 'Cybersecurity Awareness'),
  item('training', 'ELEC-101', 'Electrical Safety Basics'),
  item('training', 'ELEC-201', 'Electrical Safety for Marine Systems'),
];

export const QUALIFICATIONS: CatalogItem[] = [
  item('qualification', 'QL-CRN-01', 'Crane Operator'),
  item('qualification', 'QL-RIG-01', 'Qualified Rigger'),
  item('qualification', 'QL-WLD-01', 'Structural Welding'),
  item('qualification', 'QL-PWL-01', 'Pipe Welding'),
  item('qualification', 'QL-MEL-01', 'Marine Electrician'),
  item('qualification', 'QL-SCP-01', 'Shipyard Competent Person'),
  item('qualification', 'QL-FW-01', 'Fire Watch'),
];

/** SAP roles go by their technical names. */
export const ROLES: CatalogItem[] = [
  item('access-role', 'MM_BUYER', 'SAP role MM_BUYER'),
  item('access-role', 'PM_TECH', 'SAP role PM_TECH'),
  item('access-role', 'QM_INSPECTOR', 'SAP role QM_INSPECTOR'),
  item('access-role', 'WM_CLERK', 'SAP role WM_CLERK'),
  item('access-role', 'PS_PLANNER', 'SAP role PS_PLANNER'),
];

/** Items the generator hands out and programs can require. */
export const CATALOG: CatalogItem[] = [
  NETWORK_ACCOUNT,
  SAP_PASSWORD,
  ...TRAININGS,
  ...QUALIFICATIONS,
  ...ROLES,
];

export const CRANE_QUALIFICATION_ID = 'QL-CRN-01';

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

/** A requirement on one catalog item, or on any one of several (`name` labels it). */
const req = (id: string, itemIds: string[], name?: string): Requirement => ({
  id,
  ...(name ? { name } : {}),
  anyOf: itemIds.map((itemId) => {
    const found = CATALOG.find((c) => c.itemId === itemId);
    if (!found) throw new Error(`Unknown catalog item ${itemId}`);
    return { category: found.category, itemId };
  }),
});

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
    requirements: [
      req('req-1', [CRANE_QUALIFICATION_ID]),
      req('req-2', ['QL-RIG-01']),
      req('req-3', ['HW-210']),
      req('req-4', ['NET-DOMAIN']),
      req('req-5', ['SAP-PRD']),
    ],
  },
  {
    id: 'prog-ridgeline-r02',
    name: 'Ridgeline R-02 (supply ship)',
    requirements: [
      req('req-1', ['QL-RIG-01']),
      req('req-2', ['HW-210']),
      req('req-3', ['CS-220']),
      req('req-4', ['NET-DOMAIN']),
      req('req-5', ['SAP-PRD']),
    ],
  },
  {
    id: 'prog-bastion-b01',
    name: 'Bastion B-01 (amphibious ship)',
    requirements: [
      req('req-1', ['EXP-300']),
      req('req-2', ['CYB-310']),
      req('req-3', ['PS_PLANNER']),
      req('req-4', ['NET-DOMAIN']),
      req('req-5', ['SAP-PRD']),
    ],
  },
  {
    // Modular builds on the waterfront: no computer accounts required.
    id: 'prog-kestrel',
    name: 'Kestrel class (patrol boat)',
    requirements: [req('req-1', ['QL-WLD-01']), req('req-2', ['CS-220'])],
  },
  {
    id: 'prog-tern',
    name: 'Tern class (survey vessel)',
    requirements: [
      req('req-1', ['ELEC-101', 'ELEC-201', 'QL-MEL-01'], 'Electrical safety'),
      req('req-2', ['LOTO-240']),
    ],
  },
  {
    id: 'prog-harrier',
    name: 'Harrier class (fast attack craft)',
    requirements: [
      req('req-1', ['EXP-300']),
      req('req-2', ['QL-PWL-01']),
      req('req-3', ['NET-DOMAIN']),
    ],
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
