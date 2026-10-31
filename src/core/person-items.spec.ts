import { DEFAULT_CONFIG } from './config';
import { dueLine } from './format';
import { CategoryId, Check, Status } from './model';
import { itemGroups } from './person-items';

function check(category: CategoryId, itemName: string, status: Status, daysRemaining?: number): Check {
  return {
    personId: 'p1',
    category,
    itemId: itemName,
    itemName,
    source: 'test',
    status,
    reason: '',
    daysRemaining,
    stale: false,
    requiredBy: [],
  };
}

const checks = [
  check('training', 'B expiring', 'expiring', 20),
  check('tool', 'Torque wrench', 'not-ready', -39),
  check('training', 'A overdue', 'not-ready', -2),
  check('network', 'Domain account', 'ready', 200),
  check('mystery', 'Odd one', 'expiring', 5),
];
const shape = (groups: ReturnType<typeof itemGroups>) =>
  groups.map((g) => `${g.label}: ${g.checks.map((c) => c.itemName).join(', ')}`);

describe('itemGroups', () => {
  it('groups by category in config order, worst first, unknown categories last', () => {
    expect(shape(itemGroups(checks, DEFAULT_CONFIG.categories, false))).toEqual([
      'Network access: Domain account',
      'Training: A overdue, B expiring',
      'Tools: Torque wrench',
      'mystery: Odd one',
    ]);
  });

  it('leaves out ready items and empty groups for issues only', () => {
    expect(shape(itemGroups(checks, DEFAULT_CONFIG.categories, true))).toEqual([
      'Training: A overdue, B expiring',
      'Tools: Torque wrench',
      'mystery: Odd one',
    ]);
  });

  it('gives each group its icon', () => {
    const tools = itemGroups(checks, DEFAULT_CONFIG.categories, true).find((g) => g.category === 'tool')!;
    expect(tools.icon).toBe('wrench');
  });
});

describe('dueLine', () => {
  it('names the date and days, or just the days when the reason already has the date', () => {
    const c = { ...check('training', 'X', 'expiring', 12), dueDate: '2026-12-01' };
    expect(dueLine(c)).toBe('Due Dec 1, 2026 · 12 days');
    expect(dueLine({ ...c, reason: 'Due Dec 1, 2026' })).toBe('12 days left');
    expect(dueLine({ ...c, daysRemaining: undefined })).toBeNull();
  });
});
