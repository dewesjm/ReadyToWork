import { Check } from './model';
import { compareStatus } from './status-engine';

function bySoonestDate(a: Check, b: Check): number {
  return (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
}

/**
 * Like bySoonestDate, but a not-ready check with no date (missing, lost, revoked) counts as the
 * most overdue: it blocks work today. Other undated checks go after everything dated.
 */
function byListDate(a: Check, b: Check): number {
  const key = (c: Check) => c.daysRemaining ?? (c.status === 'not-ready' ? -Infinity : Infinity);
  const x = key(a);
  const y = key(b);
  return x === y ? 0 : x < y ? -1 : 1;
}

/** Person detail order: worst status first, then soonest due, then name. */
export function compareByUrgency(a: Check, b: Check): number {
  return (
    compareStatus(a.status, b.status) || bySoonestDate(a, b) || a.itemName.localeCompare(b.itemName)
  );
}

/**
 * List view order: soonest due first, overdue at the top, with undated not-ready checks above
 * even those; then worst status, then name.
 */
export function compareBySoonest(a: Check, b: Check): number {
  return (
    byListDate(a, b) || compareStatus(a.status, b.status) || a.itemName.localeCompare(b.itemName)
  );
}
