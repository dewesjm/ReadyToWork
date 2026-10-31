import { IsoDate, daysBetween, isIsoDate } from './dates';
import { Check } from './model';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Dec 1, 2026". Anything that isn't a date comes back unchanged. */
export function formatDate(date: IsoDate): string {
  if (!isIsoDate(date)) return date;
  const [y, m, d] = date.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** A count with its noun: "1 person", "1,204 people", "3 issues". */
export function countText(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? singular : plural}`;
}

/** Days remaining in words: "Today", "1 day", "12 days", "3 days overdue". */
export function describeDays(days: number): string {
  if (days === 0) return 'Today';
  const text = countText(Math.abs(days), 'day');
  return days < 0 ? `${text} overdue` : text;
}

/** How long ago a source synced: "Today", "Yesterday", "9 days ago". */
export function describeSynced(lastSynced: IsoDate, today: IsoDate): string {
  const age = daysBetween(lastSynced, today);
  if (age <= 0) return 'Today';
  if (age === 1) return 'Yesterday';
  return `${age} days ago`;
}

/**
 * The due line under a check's reason: "Due Dec 1, 2026 · 12 days", or just "12 days left" when
 * the reason already names the date. Null when there is no due date.
 */
export function dueLine(c: Check): string | null {
  if (!c.dueDate || c.daysRemaining === undefined) return null;
  const due = formatDate(c.dueDate);
  const days = describeDays(c.daysRemaining);
  if (!c.reason.includes(due)) return `Due ${due} · ${days}`;
  return c.daysRemaining > 0 ? `${days} left` : days;
}
