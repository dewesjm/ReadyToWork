import { DEFAULT_CONFIG } from './config';
import { CategoryId, Check, Person, Status } from './model';
import { OrgIndex } from './org-index';
import {
  DEFAULT_QUERY,
  FilterViewer,
  ReadinessFilter,
  ReadinessQuery,
  highlightParts,
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
    expect(rows.get('c2')).toMatchObject({ depth: 3, parentId: 'f1', posInSet: 2, setSize: 2 });
    expect(rows.get('m2')).toMatchObject({ posInSet: 2, setSize: 2, childIds: ['f3'] });
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

  it('combines the keyword with Issues only', () => {
    const r = run({ keyword: 'person', issuesOnly: true });
    expect(ids(r)).toEqual(['dir', 'm1', 'f1', 'c2', 'f2', 'm2', 'f3']);
    // dir matches the keyword but has no issue, so it is only context.
    expect(contextIds(r)).toEqual(['dir', 'm1', 'f1', 'm2']);
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

describe('ReadinessFilter.listChecks', () => {
  function list(query: Partial<ReadinessQuery>, viewer: FilterViewer = director) {
    return filter.listChecks({
      readiness: { org, checksByPerson, statusByPerson },
      assignments,
      viewer,
      query: { ...DEFAULT_QUERY, issuesOnly: false, ...query },
    });
  }
  const items = (r: ReturnType<typeof list>) => r.rows.map((row) => `${row.person.id}:${row.check.category}`);

  it('lists only issue checks with Issues only on, red first', () => {
    const r = list({ issuesOnly: true });
    expect(items(r)).toEqual(['c2:tool', 'f2:training', 'c1:sap-password', 'c2:sap-password']);
    expect(r.personCount).toBe(3);
    expect(r.scopeCount).toBe(8);
  });

  it('lists every check, ready ones included, with Issues only off', () => {
    const total = [...checksByPerson.values()].reduce((n, c) => n + c.length, 0);
    expect(list({}).rows.length).toBe(total);
  });

  it('gives each row its person and direct manager', () => {
    const row = list({ issuesOnly: true }).rows[0];
    expect(row.person.id).toBe('c2');
    expect(row.manager?.id).toBe('f1');
    expect(list({ supervisorId: 'dir' }).rows.find((r) => r.person.id === 'dir')!.manager).toBeNull();
  });

  it('applies the category and status filters only with Issues only on', () => {
    expect(items(list({ issuesOnly: true, categories: ['sap-password'] }))).toEqual([
      'c1:sap-password',
      'c2:sap-password',
    ]);
    expect(items(list({ issuesOnly: true, statuses: ['not-ready'] }))).toEqual(['c2:tool', 'f2:training']);
    expect(list({ categories: ['tool'], statuses: ['not-ready'] }).rows.length).toBe(list({}).rows.length);
  });

  it("keeps all of a matched person's checks, but only the matching item otherwise", () => {
    const byPerson = list({ keyword: 'ana' });
    expect(items(byPerson)).toEqual(['c1:sap-password', 'c1:network']);
    expect(byPerson.rows.every((r) => r.match.person && !r.match.item)).toBe(true);

    const byItem = list({ keyword: 'TOOL' });
    expect(items(byItem)).toEqual(['c2:tool']);
    expect(byItem.rows[0].match).toEqual({ person: false, item: true });
  });

  it('scopes by supervisor, direct reports and program like the tree', () => {
    expect(new Set(list({ supervisorId: 'm2' }).rows.map((r) => r.person.id))).toEqual(new Set(['m2']));
    expect(new Set(list({ supervisorId: 'm1', directOnly: true }).rows.map((r) => r.person.id))).toEqual(
      new Set(['m1', 'f1', 'f2']),
    );
    expect(new Set(list({ programId: 'crane' }).rows.map((r) => r.person.id))).toEqual(new Set(['c1']));
    expect(list({ supervisorId: 'dir' }, { personId: 'm2', isAdmin: false }).scopeCount).toBe(2);
  });

  it("agrees with the tree: same people, and each person's issue checks", () => {
    const queries: Partial<ReadinessQuery>[] = [
      { issuesOnly: true },
      { issuesOnly: true, categories: ['sap-password'] },
      { issuesOnly: true, statuses: ['not-ready'] },
      { issuesOnly: true, supervisorId: 'm1', directOnly: true },
      { issuesOnly: true, programId: 'crane' },
      {},
    ];
    for (const q of queries) {
      const treePeople = run(q).rows.filter((r) => !r.context).map((r) => r.person.id);
      // People with no checks at all show in the tree as not ready but have no list rows.
      const withChecks = treePeople.filter((id) => (checksByPerson.get(id) ?? []).length > 0);
      const listPeople = new Set(list(q).rows.map((r) => r.person.id));
      expect([...listPeople].sort()).toEqual([...withChecks].sort());
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
