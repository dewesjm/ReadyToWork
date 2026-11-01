import { DEFAULT_CONFIG } from './config';
import { CategoryId, Check, Person, Status } from './model';
import { OrgIndex } from './org-index';
import {
  DEFAULT_QUERY,
  FilterViewer,
  ReadinessFilter,
  ReadinessQuery,
  highlightParts,
  issuesFilterApplies,
  opensByDefault,
  resolveSupervisor,
  supervisorOptions,
} from './readiness-filter';
import { TEST_ORG } from './test-org';

/*
 *   dir
 *   ├─ m1
 *   │  ├─ f1
 *   │  │  ├─ c1   SAP password expiring          "Ana Ruiz", Electrician
 *   │  │  └─ c2   tool not ready                  employee ID E-90210
 *   │  └─ f2      training overdue, data out of date
 *   └─ m2
 *      └─ f3      no checks at all (not ready)    "Crane Foreman"
 */
const PEOPLE: Person[] = TEST_ORG.map((p) => {
  if (p.id === 'c1') return { ...p, name: 'Ana Ruiz', title: 'Electrician' };
  if (p.id === 'c2') return { ...p, employeeId: 'E-90210' };
  if (p.id === 'f3') return { ...p, title: 'Crane Foreman' };
  return p;
});
const org = new OrgIndex(PEOPLE);

function check(personId: string, category: CategoryId, status: Status): Check {
  return {
    personId,
    category,
    itemId: `${category}:x`,
    itemName: category,
    source: 'test',
    status,
    reason: '',
    stale: personId === 'f2',
    requiredBy: [],
  };
}

const checksByPerson = new Map<string, Check[]>(
  PEOPLE.filter((p) => p.id !== 'f3').map((p) => [p.id, [check(p.id, 'network', 'ready')]]),
);
checksByPerson.get('c1')!.push(check('c1', 'sap-password', 'expiring'));
checksByPerson.get('c2')!.push(check('c2', 'tool', 'not-ready'), check('c2', 'sap-password', 'expiring'));
checksByPerson.get('f2')!.push(check('f2', 'training', 'not-ready'));
const statusByPerson = new Map<string, Status>(PEOPLE.map((p) => [p.id, 'ready']));
statusByPerson.set('c1', 'expiring').set('c2', 'not-ready').set('f2', 'not-ready').set('f3', 'not-ready');

const assignments: Record<string, string[]> = { c1: ['crane'], f3: ['crane'], f2: ['other'] };

const director: FilterViewer = { personId: 'dir', isAdmin: false };
const filter = new ReadinessFilter(DEFAULT_CONFIG.categories);

function run(query: Partial<ReadinessQuery>, viewer: FilterViewer = director) {
  return filter.apply({
    readiness: { org, checksByPerson, statusByPerson },
    assignments,
    viewer,
    query: { ...DEFAULT_QUERY, issuesOnly: false, ...query },
  });
}
const ids = (r: ReturnType<typeof run>) => r.rows.map((row) => row.person.id);
const contextIds = (r: ReturnType<typeof run>) =>
  r.rows.filter((row) => row.context).map((row) => row.person.id);

describe('ReadinessFilter', () => {
  it('shows the whole subtree depth first with Issues only off', () => {
    const r = run({});
    expect(ids(r)).toEqual(['dir', 'm1', 'f1', 'c1', 'c2', 'f2', 'm2', 'f3']);
    expect(contextIds(r)).toEqual([]);
    expect(r.shownCount).toBe(8);
    expect(r.scopeCount).toBe(8);
    expect(r.narrowed).toBe(false);
  });

  it('gives each row its depth, parent, children and place among siblings', () => {
    const rows = new Map(run({}).rows.map((row) => [row.person.id, row]));
    expect(rows.get('dir')).toMatchObject({ depth: 0, parentId: null, childIds: ['m1', 'm2'] });
    expect(rows.get('c2')).toMatchObject({ depth: 3, parentId: 'f1' });
    expect(rows.get('m2')).toMatchObject({ childIds: ['f3'] });
  });

  it('scopes to a supervisor subtree', () => {
    const r = run({ supervisorId: 'm1' });
    expect(r.rootId).toBe('m1');
    expect(ids(r)).toEqual(['m1', 'f1', 'c1', 'c2', 'f2']);
    expect(r.rows[0].depth).toBe(0);
  });

  it('falls back to the viewer for a supervisor outside their subtree or unknown', () => {
    const viewer = { personId: 'm2', isAdmin: false };
    expect(run({ supervisorId: 'f1' }, viewer).rootId).toBe('m2');
    expect(run({ supervisorId: 'nobody' }, viewer).rootId).toBe('m2');
    expect(ids(run({ supervisorId: 'dir' }, viewer))).toEqual(['m2', 'f3']);
  });

  it('lets an admin scope to anyone', () => {
    const admin = { personId: 'm2', isAdmin: true };
    expect(run({ supervisorId: 'f1' }, admin).rootId).toBe('f1');
    expect(resolveSupervisor(org, admin, 'dir')).toBe('dir');
  });

  it('shows only the supervisor and direct reports with Direct only', () => {
    const r = run({ supervisorId: 'm1', directOnly: true });
    expect(ids(r)).toEqual(['m1', 'f1', 'f2']);
    expect(r.rows.find((row) => row.person.id === 'f1')!.childIds).toEqual([]);
  });

  it('narrows to a program, keeping managers above as context', () => {
    const r = run({ programId: 'crane' });
    expect(ids(r)).toEqual(['dir', 'm1', 'f1', 'c1', 'm2', 'f3']);
    expect(contextIds(r)).toEqual(['dir', 'm1', 'f1', 'm2']);
    expect(r.scopeCount).toBe(2);
  });

  it('shows only people with issues plus their manager path', () => {
    const r = run({ issuesOnly: true });
    expect(ids(r)).toEqual(['dir', 'm1', 'f1', 'c1', 'c2', 'f2', 'm2', 'f3']);
    expect(contextIds(r)).toEqual(['dir', 'm1', 'f1', 'm2']);
    expect(r.shownCount).toBe(4);
    expect(r.narrowed).toBe(true);
  });

  it('counts an issue only in the picked categories', () => {
    const r = run({ issuesOnly: true, categories: ['sap-password'] });
    expect(ids(r)).toEqual(['dir', 'm1', 'f1', 'c1', 'c2']);
    // No checks at all is not an issue in any particular category.
    expect(ids(run({ issuesOnly: true, categories: ['training'] }))).toEqual(['dir', 'm1', 'f2']);
  });

  it('counts an issue only in the picked statuses', () => {
    expect(ids(run({ issuesOnly: true, statuses: ['expiring'] }))).toEqual(['dir', 'm1', 'f1', 'c1', 'c2']);
    expect(ids(run({ issuesOnly: true, statuses: ['not-ready'] }))).toEqual(['dir', 'm1', 'f1', 'c2', 'f2', 'm2', 'f3']);
    expect(ids(run({ issuesOnly: true, statuses: ['expiring'], categories: ['tool'] }))).toEqual([]);
  });

  it('ignores category and status filters while Issues only is off', () => {
    expect(run({ categories: ['tool'], statuses: ['not-ready'] }).shownCount).toBe(8);
  });

  it('matches the keyword on name, title and employee ID, case-insensitively', () => {
    const byName = run({ keyword: 'ana r' });
    expect(ids(byName)).toEqual(['dir', 'm1', 'f1', 'c1']);
    expect(byName.rows.filter((r) => r.match).map((r) => r.person.id)).toEqual(['c1']);
    expect(ids(run({ keyword: 'CRANE' }))).toEqual(['dir', 'm2', 'f3']);
    expect(ids(run({ keyword: '90210' }))).toEqual(['dir', 'm1', 'f1', 'c2']);
    expect(run({ keyword: '  ' }).narrowed).toBe(false);
  });

  it('searches everyone in scope, ignoring Issues only and its filters while there is a keyword', () => {
    const searched = run({ keyword: 'person', issuesOnly: true, categories: ['tool'], statuses: ['not-ready'] });
    expect(searched).toEqual(run({ keyword: 'person', issuesOnly: false }));
    // dir has no issue but matches, so it is a match, not just context.
    expect(contextIds(searched)).not.toContain('dir');
    expect(searched.rows.find((row) => row.person.id === 'dir')!.match).toBe(true);
    expect(issuesFilterApplies({ issuesOnly: true, keyword: '  ' })).toBe(true);
    expect(issuesFilterApplies({ issuesOnly: true, keyword: 'x' })).toBe(false);
  });

  it('marks the root as a match when it matches', () => {
    const r = run({ keyword: 'person dir' });
    expect(ids(r)).toEqual(['dir']);
    expect(r.rows[0]).toMatchObject({ match: true, context: false });
  });

  it('returns no rows when nothing matches', () => {
    const r = run({ keyword: 'zzz' });
    expect(r.rows).toEqual([]);
    expect(r.shownCount).toBe(0);
    expect(r.scopeCount).toBe(8);
  });

  it('lists categories with issues, worst status each, in config order', () => {
    expect(filter.issueCategories(checksByPerson.get('c2')!)).toEqual([
      { category: 'sap-password', status: 'expiring' },
      { category: 'tool', status: 'not-ready' },
    ]);
    expect(filter.issueCategories(checksByPerson.get('m1')!)).toEqual([]);
  });
});

describe('ReadinessFilter.listPeople', () => {
  function list(query: Partial<ReadinessQuery>, viewer: FilterViewer = director, checks = checksByPerson) {
    return filter.listPeople({
      readiness: { org, checksByPerson: checks, statusByPerson },
      assignments,
      viewer,
      query: { ...DEFAULT_QUERY, issuesOnly: false, ...query },
    });
  }
  const ids = (r: ReturnType<typeof list>) => r.rows.map((row) => row.person.id);
  const cellOf = (r: ReturnType<typeof list>, personId: string, category: CategoryId) =>
    r.rows.find((row) => row.person.id === personId)!.cells[r.columns.indexOf(category)];

  it('lists one row per person, worst first, with a column for every category', () => {
    const r = list({ issuesOnly: true });
    expect(r.columns).toEqual(DEFAULT_CONFIG.categories.map((c) => c.id));
    expect(new Set(ids(r))).toEqual(new Set(['c1', 'c2', 'f2', 'f3']));
    expect(r.rows.map((row) => row.status)).toEqual(['not-ready', 'not-ready', 'not-ready', 'expiring']);
    // Undated not-ready issues count as most overdue; f3 has no checks, so nothing is due.
    expect(ids(r)[2]).toBe('f3');
  });

  it('shows each category as its worst status, ready ones included, and a gap when empty', () => {
    const r = list({ issuesOnly: true });
    expect(cellOf(r, 'c2', 'tool')).toEqual({ status: 'not-ready' });
    expect(cellOf(r, 'c2', 'sap-password')).toEqual({ status: 'expiring' });
    expect(cellOf(r, 'c2', 'network')).toEqual({ status: 'ready' });
    expect(cellOf(r, 'c2', 'device')).toBeNull();
    expect(r.rows.find((row) => row.person.id === 'f3')!.cells.every((c) => c === null)).toBe(true);
  });

  it("gives a cell the soonest days left among its worst checks", () => {
    const dated = (category: CategoryId, status: Status, daysRemaining: number): Check => ({
      ...checksByPerson.get('c1')![0],
      itemId: `${category}:${daysRemaining}`,
      category,
      status,
      daysRemaining,
    });
    const checks = new Map(checksByPerson);
    checks.set('c1', [dated('sap-password', 'expiring', 10), dated('sap-password', 'expiring', 4), dated('sap-password', 'ready', 1)]);
    expect(cellOf(list({}, director, checks), 'c1', 'sap-password')).toEqual({ status: 'expiring', daysRemaining: 4 });
  });

  it('narrows the columns to the picked categories, only with Issues only on', () => {
    const r = list({ issuesOnly: true, categories: ['tool', 'sap-password'] });
    expect(r.columns).toEqual(['sap-password', 'tool']);
    expect(r.rows[0].cells.length).toBe(2);
    expect(list({ categories: ['tool'] }).columns.length).toBe(DEFAULT_CONFIG.categories.length);
  });

  it('gives each row its direct manager and keyword match', () => {
    const r = list({ keyword: 'ana' });
    expect(ids(r)).toEqual(['c1']);
    expect(r.rows[0].match).toBe(true);
    expect(r.rows[0].manager?.id).toBe('f1');
    expect(list({ supervisorId: 'dir' }).rows.find((row) => row.person.id === 'dir')!.manager).toBeNull();
  });

  it('agrees with the tree: the same people', () => {
    const queries: Partial<ReadinessQuery>[] = [
      { issuesOnly: true },
      { issuesOnly: true, categories: ['sap-password'] },
      { issuesOnly: true, statuses: ['not-ready'] },
      { issuesOnly: true, supervisorId: 'm1', directOnly: true },
      { issuesOnly: true, programId: 'crane' },
      { keyword: 'ana' },
      {},
    ];
    for (const q of queries) {
      const treePeople = run(q).rows.filter((r) => !r.context).map((r) => r.person.id);
      expect(ids(list(q)).sort()).toEqual([...treePeople].sort());
    }
  });
});

describe('supervisorOptions', () => {
  it('lists the viewer then every manager below, with depth', () => {
    const options = supervisorOptions(org, director).map((o) => `${o.depth}:${o.person.id}`);
    expect(options).toEqual(['0:dir', '1:m1', '2:f1', '1:m2']);
  });

  it('lists the viewer even when they manage no one', () => {
    expect(supervisorOptions(org, { personId: 'c1', isAdmin: false }).map((o) => o.person.id)).toEqual(['c1']);
  });

  it('gives an admin every manager in the org', () => {
    const options = supervisorOptions(org, { personId: 'm2', isAdmin: true });
    expect(options.map((o) => o.person.id)).toEqual(['m2', 'dir', 'm1', 'f1']);
  });
});

describe('tree helpers', () => {
  it('opens managers of managers by default, not crew leads', () => {
    expect(opensByDefault(org, 'dir')).toBe(true);
    expect(opensByDefault(org, 'm1')).toBe(true);
    expect(opensByDefault(org, 'f1')).toBe(false);
    expect(opensByDefault(org, 'm2')).toBe(false);
  });

  it('splits text around keyword matches', () => {
    expect(highlightParts('Ana Banana', 'ana')).toEqual([
      { text: 'Ana', match: true },
      { text: ' B', match: false },
      { text: 'ana', match: true },
      { text: 'na', match: false },
    ]);
    expect(highlightParts('Ana', '')).toEqual([{ text: 'Ana', match: false }]);
  });
});
