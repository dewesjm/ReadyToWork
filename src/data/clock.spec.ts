import { DemoClock, localToday } from './clock';
import { SeededRandom } from './random';

describe('DemoClock', () => {
  it('follows the real date until moved', () => {
    const clock = new DemoClock(() => '2026-10-30');
    expect(clock.today()).toBe('2026-10-30');
    expect(clock.isOverridden).toBe(false);
  });

  it('can be set, advanced and reset', () => {
    const clock = new DemoClock(() => '2026-10-30');
    clock.advance(7);
    expect(clock.today()).toBe('2026-11-06');
    clock.advance(30);
    expect(clock.today()).toBe('2026-12-06');
    clock.set('2027-01-15');
    expect(clock.today()).toBe('2027-01-15');
    clock.reset();
    expect(clock.today()).toBe('2026-10-30');
  });

  it('reads the local calendar date', () => {
    expect(localToday(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('SeededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const seqA = Array.from({ length: 5 }, () => a.next());
    expect(Array.from({ length: 5 }, () => b.next())).toEqual(seqA);
    expect(new SeededRandom(43).next()).not.toBe(seqA[0]);
  });

  it('keeps ints in range and samples without repeats', () => {
    const r = new SeededRandom(1);
    for (let i = 0; i < 200; i++) {
      const n = r.int(3, 5);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(5);
    }
    const s = r.sample([1, 2, 3, 4, 5], 3);
    expect(new Set(s).size).toBe(3);
  });
});
