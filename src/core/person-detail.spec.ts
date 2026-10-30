import { DEFAULT_CONFIG, SOURCE_LABELS, sourceLabel } from './config';
import { describeDays, describeSynced, formatDate } from './format';
import { CategoryId, Check, Program, Status } from './model';
import { OrgIndex } from './org-index';
import { PersonDetailBuilder } from './person-detail';
import { canView } from './readiness-filter';
import { RollupCalculator } from './rollup-calculator';
import { TEST_ORG } from './test-org';

/*
 *   dir ─ m1 ─ f1 ─ c1, c2
 *        │    └ f2
 *        └ m2 ─ f3
 */
const org = new OrgIndex(TEST_ORG);

function check(category: CategoryId, status: Status, days: number, requiredBy: string[] = []): Check {
  return {
    personId: 'c1',
    category,
    itemId: `${category}:${status}:${days}`,
    itemName: `${category} ${status}`,
    source: 'sap',
    status,
    reason: '',
    daysRemaining: days,
    stale: false,
    requiredBy,
  };
}

const c1Checks = [
  check('network', 'ready', 200),
  check('tool', 'expiring', 20),
  check('tool', 'not-ready', -3, ['crane']),
  check('qualification', 'ready', 90, ['crane']),
  check('tool', 'ready', 300),
];
const checksByPerson = new Map<string, Check[]>([['c1', c1Checks]]);
const statusByPerson = new Map<string, Status>(TEST_ORG.map((p) => [p.id, 'ready']));
statusByPerson.set('c1', 'not-ready');
const readiness = {
  org,
  checksByPerson,
  statusByPerson,
  rollups: new RollupCalculator().compute(org, statusByPerson),
};
const programs: Program[] = [
  { id: 'crane', name: 'Crane Operations', requirements: [] },
  { id: 'empty', name: 'Nothing required', requirements: [] },
];
const assignments = { c1: ['crane', 'empty', 'gone'] };
const builder = new PersonDetailBuilder(DEFAULT_CONFIG.categories);

function build(personId: string, viewerId = 'dir', isAdmin = false) {
  return builder.build({
    readiness,
    assignments,
    programs,
    viewer: { personId: viewerId, isAdmin },
    personId,
  });
}

describe('PersonDetailBuilder', () => {
  it('returns the person with their status and checks worst first, then soonest due', () => {
    const view = build('c1')!;
    expect(view.person.id).toBe('c1');
    expect(view.status).toBe('not-ready');
    expect(view.checks.map((c) => c.daysRemaining)).toEqual([-3, 20, 90, 200, 300]);
  });

  it('gives one tile per category in config order, with worst status and counts', () => {
    const tiles = build('c1')!.tiles;
    expect(tiles.map((t) => t.category.id)).toEqual(DEFAULT_CONFIG.categories.map((c) => c.id));
    const tool = tiles.find((t) => t.category.id === 'tool')!;
    expect(tool).toMatchObject({ status: 'not-ready', total: 3 });
    expect(tool.counts).toEqual({ 'not-ready': 1, expiring: 1, ready: 1 });
  });

  it('leaves a category with nothing tracked without a status', () => {
    const yubikey = build('c1')!.tiles.find((t) => t.category.id === 'yubikey')!;
    expect(yubikey).toMatchObject({ status: null, total: 0 });
  });

  it('gives each program the worst status of the checks it requires', () => {
    expect(build('c1')!.programs.map((p) => [p.program.id, p.status])).toEqual([
      ['crane', 'not-ready'],
      ['empty', 'ready'], // requires nothing
    ]); // 'gone' no longer exists and is dropped
  });

  it('lists the manager chain top first, openable only inside the viewer subtree', () => {
    const chain = (viewer: string, admin = false) =>
      build('c1', viewer, admin)!.chain.map((l) => `${l.person.id}:${l.canOpen}`);
    expect(chain('dir')).toEqual(['dir:true', 'm1:true', 'f1:true']);
    expect(chain('f1')).toEqual(['dir:false', 'm1:false', 'f1:true']);
    expect(chain('c1', true)).toEqual(['dir:true', 'm1:true', 'f1:true']);
  });

  it('shows what a manager is responsible for, and nothing for crew', () => {
    expect(build('m1')!.responsibleFor).toEqual({
      rollup: { total: 4, counts: { 'not-ready': 1, expiring: 0, ready: 3 }, worst: 'not-ready' },
      directReports: 2,
    });
    expect(build('c1')!.responsibleFor).toBeNull();
  });

  it('returns null for an unknown id or someone outside the viewer subtree', () => {
    expect(build('nobody')).toBeNull();
    expect(build('m2', 'm1')).toBeNull();
    expect(build('m2', 'm1', true)).not.toBeNull();
  });

  it('treats someone with no checks as not ready with every tile empty', () => {
    const view = build('f3')!;
    expect(view.checks).toEqual([]);
    expect(view.tiles.every((t) => t.status === null)).toBe(true);
  });
});

describe('canView', () => {
  it('allows the viewer subtree, everyone for admins, never unknown ids', () => {
    expect(canView(org, { personId: 'm1', isAdmin: false }, 'c2')).toBe(true);
    expect(canView(org, { personId: 'm1', isAdmin: false }, 'm1')).toBe(true);
    expect(canView(org, { personId: 'm1', isAdmin: false }, 'dir')).toBe(false);
    expect(canView(org, { personId: 'c1', isAdmin: true }, 'dir')).toBe(true);
    expect(canView(org, { personId: 'dir', isAdmin: true }, 'nobody')).toBe(false);
  });
});

describe('display wording', () => {
  it('formats dates like "Dec 1, 2026"', () => {
    expect(formatDate('2026-12-01')).toBe('Dec 1, 2026');
    expect(formatDate('2027-01-31')).toBe('Jan 31, 2027');
    expect(formatDate('not a date')).toBe('not a date');
  });

  it('describes days remaining', () => {
    expect(describeDays(0)).toBe('Today');
    expect(describeDays(1)).toBe('1 day');
    expect(describeDays(12)).toBe('12 days');
    expect(describeDays(-1)).toBe('1 day overdue');
    expect(describeDays(-3)).toBe('3 days overdue');
  });

  it('describes when a source last synced', () => {
    expect(describeSynced('2026-10-30', '2026-10-30')).toBe('Today');
    expect(describeSynced('2026-10-29', '2026-10-30')).toBe('Yesterday');
    expect(describeSynced('2026-10-21', '2026-10-30')).toBe('9 days ago');
    expect(describeSynced('2026-11-02', '2026-10-30')).toBe('Today');
  });

  it('names every source the fake data uses, and falls back to the id', () => {
    for (const id of ['ad', 'sap', 'mdm', 'lms', 'quals', 'yubikey', 'assets', 'program']) {
      expect(SOURCE_LABELS[id]).toBeDefined();
    }
    expect(sourceLabel('hr')).toBe('hr');
  });
});
