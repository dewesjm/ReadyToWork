import { Check } from './model';
import { compareStatus } from './status-engine';

function bySoonestDate(a: Check, b: Check): number {
  return (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
}

/**
 * Days left for sorting the list: a not-ready check with no date (missing, lost, revoked) counts
 * as the most overdue, since it blocks work today. Other undated checks go after everything dated.
 */
export function listDueKey(c: Check): number {
  return c.daysRemaining ?? (c.status === 'not-ready' ? -Infinity : Infinity);
}

/** Person detail order: worst status first, then soonest due, then name. */
export function compareByUrgency(a: Check, b: Check): number {
  return (
    compareStatus(a.status, b.status) || bySoonestDate(a, b) || a.itemName.localeCompare(b.itemName)
  );
}
