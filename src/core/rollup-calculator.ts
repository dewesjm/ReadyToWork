import { STATUSES } from './config';
import { Rollup, Status, StatusCounts } from './model';
import { OrgIndex } from './org-index';

export function emptyCounts(): StatusCounts {
  return { 'not-ready': 0, expiring: 0, ready: 0 };
}

/** Counts per status for everyone below each manager (the manager's own status is separate). */
export class RollupCalculator {
  /** Rollups for every person who has at least one person below them. */
  compute(org: OrgIndex, statusByPerson: ReadonlyMap<string, Status>): Map<string, Rollup> {
    const below = new Map<string, StatusCounts>();
    // Children before parents: reverse of a depth-first order from each root.
    const order = org.roots().flatMap((r) => org.subtree(r.id)).reverse();

    for (const person of order) {
      const kids = org.childrenOf(person.id);
      if (kids.length === 0) continue;
      const counts = emptyCounts();
      for (const kid of kids) {
        counts[statusByPerson.get(kid.id) ?? 'not-ready']++;
        const kidBelow = below.get(kid.id);
        if (kidBelow) for (const s of STATUSES) counts[s] += kidBelow[s];
      }
      below.set(person.id, counts);
    }

    const rollups = new Map<string, Rollup>();
    for (const [id, counts] of below) rollups.set(id, toRollup(counts));
    return rollups;
  }
}

export function toRollup(counts: StatusCounts): Rollup {
  const total = STATUSES.reduce((sum, s) => sum + counts[s], 0);
  return { total, counts, worst: STATUSES.find((s) => counts[s] > 0) ?? null };
}
