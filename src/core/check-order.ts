import { Check } from './model';
import { compareStatus } from './status-engine';

function bySoonestDate(a: Check, b: Check): number {
  return (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
}

/** Person detail order: worst status first, then soonest due, then name. */
export function compareByUrgency(a: Check, b: Check): number {
  return (
    compareStatus(a.status, b.status) || bySoonestDate(a, b) || a.itemName.localeCompare(b.itemName)
  );
}

/** Issues list order: soonest due first (overdue at the top), then worst status, then name. */
export function compareBySoonest(a: Check, b: Check): number {
  return (
    bySoonestDate(a, b) || compareStatus(a.status, b.status) || a.itemName.localeCompare(b.itemName)
  );
}
