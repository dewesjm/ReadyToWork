import { IsoDate, addDays } from '../core';

/** Where "today" comes from. Everything that depends on the date asks a Clock. */
export interface Clock {
  today(): IsoDate;
}

/** The real calendar date in the browser's time zone. */
export function localToday(now: Date = new Date()): IsoDate {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** A clock the presenter can move: the real date unless overridden. */
export class DemoClock implements Clock {
  private override: IsoDate | null = null;

  constructor(private readonly realToday: () => IsoDate = localToday) {}

  today(): IsoDate {
    return this.override ?? this.realToday();
  }

  get isOverridden(): boolean {
    return this.override !== null;
  }

  set(date: IsoDate | null): void {
    this.override = date;
  }

  advance(days: number): void {
    this.override = addDays(this.today(), days);
  }

  reset(): void {
    this.override = null;
  }
}
