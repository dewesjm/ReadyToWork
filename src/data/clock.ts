import { IsoDate } from '../core';

/** Where "today" comes from. Everything that depends on the date asks a Clock. */
export interface Clock {
  today(): IsoDate;
}

/** The real calendar date in the browser's time zone. */
export function localToday(now: Date = new Date()): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** The browser's clock: always the real date. */
export class SystemClock implements Clock {
  today(): IsoDate {
    return localToday();
  }
}
