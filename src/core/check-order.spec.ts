import { compareByUrgency, listDueKey } from './check-order';
import { Check, Status } from './model';

function check(itemName: string, status: Status, daysRemaining?: number): Check {
  return {
    personId: 'p1',
    category: 'training',
    itemId: itemName,
    itemName,
    source: 'lms',
    status,
    reason: '',
    daysRemaining,
    stale: false,
    requiredBy: [],
  };
}

const checks = [
  check('A ready', 'ready', 100),
  check('B expiring', 'expiring', 10),
  check('C overdue', 'not-ready', -3),
  check('D missing', 'not-ready'),
  check('F expiring soon', 'expiring', 2),
];
const names = (list: Check[]) => list.map((c) => c.itemName);

describe('check order', () => {
  it('sorts worst first, then soonest, for person detail', () => {
    expect(names([...checks].sort(compareByUrgency))).toEqual([
      'C overdue',
      'D missing',
      'F expiring soon',
      'B expiring',
      'A ready',
    ]);
  });

  it('gives the list a due key: undated not ready first, other undated last', () => {
    expect(listDueKey(check('D missing', 'not-ready'))).toBe(-Infinity);
    expect(listDueKey(check('C overdue', 'not-ready', -3))).toBe(-3);
    expect(listDueKey(check('G completed', 'ready'))).toBe(Infinity);
  });
});
