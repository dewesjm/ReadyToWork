/**
 * Calendar dates as 'YYYY-MM-DD' strings. No times, so time zones and daylight saving can't
 * shift a status. All arithmetic is done in UTC.
 */
export type IsoDate = string;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function toUtcMs(date: IsoDate): number {
  const m = ISO_DATE.exec(date);
  if (!m) throw new Error(`Not an ISO date (YYYY-MM-DD): ${date}`);
  const ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  if (fromUtcMs(ms) !== date) throw new Error(`Not a real calendar date: ${date}`);
  return ms;
}

function fromUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtcMs(toUtcMs(date) + days * MS_PER_DAY);
}

export function isIsoDate(value: string): boolean {
  try {
    toUtcMs(value);
    return true;
  } catch {
    return false;
  }
}
