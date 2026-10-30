import { addDays, daysBetween, isIsoDate } from './dates';

describe('dates', () => {
  it('counts whole days, negative when going back', () => {
    expect(daysBetween('2026-10-30', '2026-10-30')).toBe(0);
    expect(daysBetween('2026-10-30', '2026-11-01')).toBe(2);
    expect(daysBetween('2026-11-01', '2026-10-30')).toBe(-2);
  });

  it('is not shifted by daylight saving changes', () => {
    // US clocks change on 2026-11-01 and 2026-03-08.
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
  });

  it('crosses month, year and leap day boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('rejects malformed and impossible dates', () => {
    expect(isIsoDate('2026-10-30')).toBe(true);
    expect(isIsoDate('2026-1-30')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(() => daysBetween('nope', '2026-10-30')).toThrow();
  });
});
