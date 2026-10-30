import { Status } from './model';
import { OrgIndex } from './org-index';
import { RollupCalculator } from './rollup-calculator';
import { TEST_ORG } from './test-org';

describe('RollupCalculator', () => {
  const org = new OrgIndex(TEST_ORG);
  const statuses = new Map<string, Status>([
    ['dir', 'not-ready'], // own status never counts in own roll-up
    ['m1', 'ready'],
    ['f1', 'ready'],
    ['c1', 'expiring'],
    ['c2', 'not-ready'],
    ['f2', 'unknown'],
    ['m2', 'ready'],
    ['f3', 'ready'],
  ]);
  const rollups = new RollupCalculator().compute(org, statuses);

  it('counts everyone below, not the manager', () => {
    expect(rollups.get('dir')).toEqual({
      total: 7,
      counts: { 'not-ready': 1, expiring: 1, unknown: 1, ready: 4 },
      worst: 'not-ready',
    });
  });

  it('rolls up each level of the subtree', () => {
    expect(rollups.get('m1')?.counts).toEqual({ 'not-ready': 1, expiring: 1, unknown: 1, ready: 1 });
    expect(rollups.get('f1')).toEqual({
      total: 2,
      counts: { 'not-ready': 1, expiring: 1, unknown: 0, ready: 0 },
      worst: 'not-ready',
    });
  });

  it('takes the worst status, with grey above green', () => {
    expect(rollups.get('m2')?.worst).toBe('ready');
    const greyOrg = new Map(statuses).set('f3', 'unknown');
    expect(new RollupCalculator().compute(org, greyOrg).get('m2')?.worst).toBe('unknown');
  });

  it('has no roll-up for people with no one below', () => {
    expect(rollups.has('c1')).toBe(false);
    expect(rollups.has('f3')).toBe(false);
  });

  it('counts a person with no status as unknown', () => {
    const partial = new Map<string, Status>([['f3', 'ready']]);
    expect(new RollupCalculator().compute(org, partial).get('m1')?.counts.unknown).toBe(4);
  });
});
