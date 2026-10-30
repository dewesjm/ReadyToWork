import { DEFAULT_CONFIG } from './config';
import { Program, SourceRecord } from './model';
import { ProgramRules } from './program-rules';
import { StatusEngine } from './status-engine';

const TODAY = '2026-11-01';
const engine = new StatusEngine(DEFAULT_CONFIG);
const rules = new ProgramRules();

function record(itemId: string, overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    personId: 'p1',
    category: 'training',
    itemId,
    itemName: itemId,
    source: 'lms',
    lastSynced: TODAY,
    ...overrides,
  };
}

const exportControl = { category: 'training', itemId: 'export', itemName: 'Export Control Basics' };
const crane = { category: 'qualification', itemId: 'crane', itemName: 'Crane Operator' };
const xyz: Program = { id: 'xyz', name: 'Program XYZ', requirements: [exportControl] };
const abc: Program = { id: 'abc', name: 'Program ABC', requirements: [exportControl, crane] };

describe('ProgramRules', () => {
  it('leaves checks alone with no programs', () => {
    const checks = [engine.evaluate(record('export', { completed: true }), TODAY)];
    expect(rules.apply('p1', checks, [])).toEqual(checks);
  });

  it('marks a held, valid item as required, with no extra row', () => {
    const checks = [engine.evaluate(record('export', { completed: true }), TODAY)];
    const out = rules.apply('p1', checks, [xyz]);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('ready');
    expect(out[0].requiredBy).toEqual(['xyz']);
  });

  it('keeps a held item expiring (yellow) as one row', () => {
    const checks = [engine.evaluate(record('export', { completed: false, due: '2026-11-10' }), TODAY)];
    const out = rules.apply('p1', checks, [xyz]);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('expiring');
    expect(out[0].requiredBy).toEqual(['xyz']);
  });

  it('keeps a held expired item red as one row', () => {
    const checks = [engine.evaluate(record('export', { completed: true, expires: '2026-10-01' }), TODAY)];
    const out = rules.apply('p1', checks, [xyz]);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('not-ready');
  });

  it('adds a red missing check for an item the person lacks', () => {
    const out = rules.apply('p1', [], [xyz]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      personId: 'p1',
      category: 'training',
      itemId: 'export',
      itemName: 'Export Control Basics',
      source: 'program',
      status: 'not-ready',
      reason: 'Missing, required by Program XYZ',
      requiredBy: ['xyz'],
    });
  });

  it('shares one row when two programs require the same item', () => {
    const missing = rules.apply('p1', [], [xyz, abc]);
    expect(missing.filter((c) => c.itemId === 'export')).toHaveLength(1);
    expect(missing.find((c) => c.itemId === 'export')?.reason).toBe(
      'Missing, required by Program XYZ, Program ABC',
    );

    const held = [engine.evaluate(record('export', { completed: true }), TODAY)];
    const out = rules.apply('p1', held, [xyz, abc]);
    expect(out.find((c) => c.itemId === 'export')?.requiredBy).toEqual(['xyz', 'abc']);
    expect(out.find((c) => c.itemId === 'crane')?.status).toBe('not-ready');
    expect(out).toHaveLength(2);
  });

  it('does not change the checks passed in', () => {
    const checks = [engine.evaluate(record('export', { completed: true }), TODAY)];
    rules.apply('p1', checks, [xyz]);
    expect(checks[0].requiredBy).toEqual([]);
  });
});
