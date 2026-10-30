import { CategoryConfig, STATUS_META } from './config';
import { CategoryId, Check, Person, Status } from './model';
import { OrgIndex } from './org-index';
import { ReadinessResult } from './readiness-evaluator';

/** What the Readiness page is asked to show. Kept in the URL by the page. */
export interface ReadinessQuery {
  /** Scope root. Null, unknown or outside what the viewer may see means the viewer. */
  supervisorId: string | null;
  /** Only people assigned this program; null is all programs. */
  programId: string | null;
  issuesOnly: boolean;
  /** Categories that count as issues while Issues only is on; empty is all. */
  categories: readonly CategoryId[];
  /** Statuses that count as issues while Issues only is on; empty is every non-ready status. */
  statuses: readonly Status[];
  /** Only the scope root and their direct reports. */
  directOnly: boolean;
  keyword: string;
}

export const DEFAULT_QUERY: ReadinessQuery = {
  supervisorId: null,
  programId: null,
  issuesOnly: true,
  categories: [],
  statuses: [],
  directOnly: false,
  keyword: '',
};

/** Statuses that can be an issue, worst first. */
export const ISSUE_STATUSES: readonly Status[] = ['not-ready', 'expiring', 'unknown'];

export interface FilterViewer {
  personId: string;
  /** Admins may scope to anyone; everyone else only to their own subtree. */
  isAdmin: boolean;
}

export interface FilterInput {
  readiness: Pick<ReadinessResult, 'org' | 'checksByPerson' | 'statusByPerson'>;
  /** Program ids per person id. */
  assignments: Readonly<Record<string, readonly string[]>>;
  viewer: FilterViewer;
  query: ReadinessQuery;
}

/** One person on the page, in tree order. */
export interface FilterRow {
  person: Person;
  /** 0 is the scope root. */
  depth: number;
  /** The row's parent among the rows; null for the scope root. */
  parentId: string | null;
  /** Ids of this row's children among the rows, in order. */
  childIds: string[];
  /** 1-based position among its siblings in the rows, and how many siblings there are. */
  posInSet: number;
  setSize: number;
  /** Not shown in its own right: kept so the path to someone below makes sense. */
  context: boolean;
  /** Name, title or employee ID matches the keyword. Always false with no keyword. */
  match: boolean;
}

export interface FilterResult {
  /** The scope root actually used, after falling back from a supervisor the viewer can't see. */
  rootId: string;
  /** Depth first from the root: everyone shown plus their managers up to the root. */
  rows: FilterRow[];
  /** People shown in their own right (context rows not counted). */
  shownCount: number;
  /** People in scope (supervisor, direct only, program) before Issues only and keyword. */
  scopeCount: number;
  /** Issues only or a keyword is narrowing the rows, so every path should start open. */
  narrowed: boolean;
}

export interface SupervisorOption {
  person: Person;
  /** 0 is the viewer (or a top of the org, for an admin). */
  depth: number;
}

export interface CategoryIssue {
  category: CategoryId;
  /** Worst non-ready status in that category. */
  status: Status;
}

/**
 * Decides who the Readiness page shows: scope (supervisor, direct reports, program), then
 * Issues only with its category and status filters, then the keyword. Managers above anyone
 * shown are kept as context so the tree keeps its shape.
 */
export class ReadinessFilter {
  /** `categories` gives the display order of category chips. */
  constructor(private readonly categories: readonly CategoryConfig[]) {}

  apply(input: FilterInput): FilterResult {
    const { org, checksByPerson, statusByPerson } = input.readiness;
    const { query } = input;
    const rootId = resolveSupervisor(org, input.viewer, query.supervisorId);
    const root = org.get(rootId);
    if (!root) return { rootId, rows: [], shownCount: 0, scopeCount: 0, narrowed: false };

    const inScope = query.directOnly ? [root, ...org.childrenOf(rootId)] : org.subtree(rootId);
    const scoped = query.programId
      ? inScope.filter((p) => (input.assignments[p.id] ?? []).includes(query.programId!))
      : inScope;

    const keyword = query.keyword.trim();
    const matches = new Set<string>();
    const shown = new Set<string>();
    for (const p of scoped) {
      if (query.issuesOnly && !hasIssue(p.id, checksByPerson, statusByPerson, query)) continue;
      if (keyword) {
        if (!matchesKeyword(p, keyword)) continue;
        matches.add(p.id);
      }
      shown.add(p.id);
    }

    // Everyone shown plus their managers up to the root.
    const kept = new Set(shown);
    for (const id of shown) {
      if (id === rootId) continue;
      for (const m of org.managerChain(id).reverse()) {
        if (kept.has(m.id)) break;
        kept.add(m.id);
        if (m.id === rootId) break;
      }
    }

    const rows: FilterRow[] = [];
    const walk = (person: Person, depth: number, parentId: string | null, pos: number, size: number) => {
      const row: FilterRow = {
        person,
        depth,
        parentId,
        childIds: [],
        posInSet: pos,
        setSize: size,
        context: !shown.has(person.id),
        match: matches.has(person.id),
      };
      rows.push(row);
      const kids = org.childrenOf(person.id).filter((k) => kept.has(k.id));
      row.childIds = kids.map((k) => k.id);
      kids.forEach((k, i) => walk(k, depth + 1, person.id, i + 1, kids.length));
    };
    if (kept.size > 0) walk(root, 0, null, 1, 1);

    return {
      rootId,
      rows,
      shownCount: shown.size,
      scopeCount: scoped.length,
      narrowed: query.issuesOnly || keyword !== '',
    };
  }

  /** Categories with a non-ready check, each with its worst status, in config order. */
  issueCategories(checks: readonly Check[]): CategoryIssue[] {
    const worst = new Map<CategoryId, Status>();
    for (const c of checks) {
      if (c.status === 'ready') continue;
      const current = worst.get(c.category);
      if (!current || STATUS_META[c.status].rank > STATUS_META[current].rank) {
        worst.set(c.category, c.status);
      }
    }
    const order = (id: CategoryId) => {
      const i = this.categories.findIndex((c) => c.id === id);
      return i < 0 ? Infinity : i;
    };
    return [...worst]
      .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
      .map(([category, status]) => ({ category, status }));
  }
}

/** The supervisor id if the viewer may scope to it, otherwise the viewer. */
export function resolveSupervisor(
  org: OrgIndex,
  viewer: FilterViewer,
  supervisorId: string | null,
): string {
  if (supervisorId === null || !org.get(supervisorId)) return viewer.personId;
  if (viewer.isAdmin || org.isInSubtree(viewer.personId, supervisorId)) return supervisorId;
  return viewer.personId;
}

/**
 * The viewer, then every manager below them, depth first. Admins get the viewer, then every
 * manager in the org from the top.
 */
export function supervisorOptions(org: OrgIndex, viewer: FilterViewer): SupervisorOption[] {
  const self = org.get(viewer.personId);
  if (!self) return [];
  const out: SupervisorOption[] = [{ person: self, depth: 0 }];
  const tops = viewer.isAdmin ? org.roots().map((r) => r.id) : [viewer.personId];
  for (const topId of tops) {
    const base = org.managerChain(topId).length;
    for (const p of org.subtree(topId)) {
      if (p.id !== self.id && org.childrenOf(p.id).length > 0) {
        out.push({ person: p, depth: org.managerChain(p.id).length - base });
      }
    }
  }
  return out;
}

/**
 * Whether a manager starts open in the tree when nothing narrows it: managers of managers are
 * open, so the tree opens down to the people who lead crews and the crews start collapsed.
 */
export function opensByDefault(org: OrgIndex, id: string): boolean {
  return org.childrenOf(id).some((k) => org.childrenOf(k.id).length > 0);
}

/** Case-insensitive match on name, title and employee ID. */
export function matchesKeyword(person: Person, keyword: string): boolean {
  const k = keyword.trim().toLowerCase();
  if (!k) return true;
  return [person.name, person.title, person.employeeId].some((f) => f.toLowerCase().includes(k));
}

/** Splits text around case-insensitive matches of the keyword, for highlighting. */
export function highlightParts(text: string, keyword: string): { text: string; match: boolean }[] {
  const k = keyword.trim().toLowerCase();
  if (!k) return [{ text, match: false }];
  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  let at = 0;
  for (let i = lower.indexOf(k); i >= 0; i = lower.indexOf(k, at)) {
    if (i > at) parts.push({ text: text.slice(at, i), match: false });
    parts.push({ text: text.slice(i, i + k.length), match: true });
    at = i + k.length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), match: false });
  return parts;
}

function hasIssue(
  personId: string,
  checksByPerson: ReadonlyMap<string, readonly Check[]>,
  statusByPerson: ReadonlyMap<string, Status>,
  query: ReadinessQuery,
): boolean {
  const statuses = query.statuses.length > 0 ? query.statuses : ISSUE_STATUSES;
  const checks = checksByPerson.get(personId) ?? [];
  // Someone with no checks at all is unknown; that only shows when no category is picked.
  if (checks.length === 0) {
    return query.categories.length === 0 && statuses.includes(statusByPerson.get(personId) ?? 'unknown');
  }
  return checks.some(
    (c) =>
      c.status !== 'ready' &&
      statuses.includes(c.status) &&
      (query.categories.length === 0 || query.categories.includes(c.category)),
  );
}
