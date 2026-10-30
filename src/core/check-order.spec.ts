import { compareBySoonest, compareByUrgency } from './check-order';
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
  check('E unknown', 'unknown'),
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
      'E unknown',
      'A ready',
    ]);
  });

  it('sorts soonest first (overdue at top), undated last, for the list view', () => {
    expect(names([...checks].sort(compareBySoonest))).toEqual([
      'C overdue',
      'F expiring soon',
      'B expiring',
      'A ready',
      'D missing',
      'E unknown',
    ]);
  });
});
