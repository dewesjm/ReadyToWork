import { IsoDate, daysBetween, isIsoDate } from './dates';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Dec 1, 2026". Anything that isn't a date comes back unchanged. */
export function formatDate(date: IsoDate): string {
  if (!isIsoDate(date)) return date;
  const [y, m, d] = date.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Days remaining in words: "Today", "1 day", "12 days", "3 days overdue". */
export function describeDays(days: number): string {
  if (days === 0) return 'Today';
  const n = Math.abs(days);
  const text = `${n} ${n === 1 ? 'day' : 'days'}`;
  return days < 0 ? `${text} overdue` : text;
}

/** How long ago a source synced: "Today", "Yesterday", "9 days ago". */
export function describeSynced(lastSynced: IsoDate, today: IsoDate): string {
  const age = daysBetween(lastSynced, today);
  if (age <= 0) return 'Today';
  if (age === 1) return 'Yesterday';
  return `${age} days ago`;
}
