import { DEFAULT_CONFIG } from './config';
import { Program, SourceRecord } from './model';
import { ProgramRules } from './program-rules';
import { ReadinessEvaluator, ReadinessInput } from './readiness-evaluator';
import { RollupCalculator } from './rollup-calculator';
import { StatusEngine } from './status-engine';
import { TEST_ORG } from './test-org';

const TODAY = '2026-11-01';

function sap(personId: string, expires: string): SourceRecord {
  return {
    personId,
    category: 'sap-password',
    itemId: 'sap:prd',
    itemName: 'SAP PRD password',
    source: 'sap',
    lastSynced: TODAY,
    expires,
  };
}

const crane: Program = {
  id: 'crane',
  name: 'Crane program',
  requirements: [{ category: 'qualification', itemId: 'q:crane', itemName: 'Crane Operator' }],
};

function input(overrides: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    people: TEST_ORG,
    // Everyone has a valid password except c1 (expiring) and f2, who has no records.
    records: TEST_ORG.filter((p) => p.id !== 'f2').map((p) =>
      sap(p.id, p.id === 'c1' ? '2026-11-05' : '2027-06-01'),
    ),
    programs: [crane],
    assignments: {},
    today: TODAY,
    ...overrides,
  };
}

describe('ReadinessEvaluator', () => {
  const evaluator = new ReadinessEvaluator(
    new StatusEngine(DEFAULT_CONFIG),
    new ProgramRules(),
    new RollupCalculator(),
  );

  it('gives each person their worst check, and not ready with no checks', () => {
    const r = evaluator.evaluate(input());
    expect(r.statusByPerson.get('c1')).toBe('expiring');
    expect(r.statusByPerson.get('c2')).toBe('ready');
    expect(r.statusByPerson.get('f2')).toBe('not-ready');
  });

  it('rolls statuses up the tree', () => {
    const r = evaluator.evaluate(input());
    expect(r.rollups.get('m1')).toEqual({
      total: 4,
      counts: { 'not-ready': 1, expiring: 1, ready: 2 },
      worst: 'not-ready',
    });
    expect(r.rollups.get('dir')?.total).toBe(7);
  });

  it('turns a person red when assigned a program they lack, and updates roll-ups', () => {
    const r = evaluator.evaluate(input({ assignments: { c2: ['crane'] } }));
    expect(r.statusByPerson.get('c2')).toBe('not-ready');
    expect(r.checksByPerson.get('c2')?.find((c) => c.itemId === 'q:crane')?.reason).toBe(
      'Missing, required by Crane program',
    );
    expect(r.rollups.get('f1')?.worst).toBe('not-ready');
    // f2 (no checks) was already red; c2 joins them.
    expect(r.rollups.get('dir')?.counts['not-ready']).toBe(2);
  });

  it('ignores assignments to programs that no longer exist', () => {
    const r = evaluator.evaluate(input({ assignments: { c2: ['deleted'] } }));
    expect(r.statusByPerson.get('c2')).toBe('ready');
  });

  it('moves statuses as today moves forward', () => {
    const later = evaluator.evaluate(input({ today: '2026-11-06' }));
    expect(later.statusByPerson.get('c1')).toBe('not-ready');
  });
});
