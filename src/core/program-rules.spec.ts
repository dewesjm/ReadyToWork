import { DEFAULT_CONFIG } from './config';
import { Program, Requirement, SourceRecord } from './model';
import { ProgramRules } from './program-rules';
import { itemNames } from './requirements';
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

const exportControl: Requirement = { id: 'r1', anyOf: [{ category: 'training', itemId: 'EXP-300' }] };
const crane: Requirement = { id: 'r2', anyOf: [{ category: 'qualification', itemId: 'QL-CRN-01' }] };
const electrical: Requirement = {
  id: 'r3',
  name: 'Electrical safety',
  anyOf: [
    { category: 'training', itemId: 'ELEC-101' },
    { category: 'training', itemId: 'ELEC-201' },
    { category: 'qualification', itemId: 'QL-MEL-01' },
  ],
};
const xyz: Program = { id: 'xyz', name: 'Program XYZ', requirements: [exportControl] };
const abc: Program = { id: 'abc', name: 'Program ABC', requirements: [exportControl, crane] };
const tern: Program = { id: 'tern', name: 'Tern class', requirements: [electrical] };

describe('ProgramRules', () => {
  it('leaves checks alone with no programs', () => {
    const checks = [engine.evaluate(record('EXP-300', { completed: true }), TODAY)];
    expect(rules.apply('p1', checks, [])).toEqual(checks);
  });

  it('marks a held, valid item as required, with no extra row', () => {
    const checks = [engine.evaluate(record('EXP-300', { completed: true }), TODAY)];
    const out = rules.apply('p1', checks, [xyz]);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('ready');
    expect(out[0].requiredBy).toEqual(['xyz']);
  });

  it('matches IDs ignoring case and spaces around them', () => {
    const checks = [engine.evaluate(record('exp-300', { completed: true }), TODAY)];
    const typed: Program = { ...xyz, requirements: [{ id: 'r1', anyOf: [{ category: 'training', itemId: ' Exp-300 ' }] }] };
    expect(rules.apply('p1', checks, [typed])[0].requiredBy).toEqual(['xyz']);
  });

  it('only matches an ID of the same type', () => {
    const checks = [engine.evaluate(record('EXP-300', { category: 'qualification', completed: true }), TODAY)];
    expect(rules.apply('p1', checks, [xyz]).filter((c) => c.source === 'program')).toHaveLength(1);
  });

  it('keeps a held item expiring (yellow) as one row', () => {
    const checks = [engine.evaluate(record('EXP-300', { completed: false, due: '2026-11-10' }), TODAY)];
    const out = rules.apply('p1', checks, [xyz]);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('expiring');
    expect(out[0].requiredBy).toEqual(['xyz']);
  });

  it('keeps a held expired item red as one row', () => {
    const checks = [engine.evaluate(record('EXP-300', { completed: true, expires: '2026-10-01' }), TODAY)];
    const out = rules.apply('p1', checks, [xyz]);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('not-ready');
  });

  it('adds a red missing check for an item the person lacks, named from the source data', () => {
    const names = itemNames([record('EXP-300', { itemName: 'Export Control Basics' })]);
    const out = rules.apply('p1', [], [xyz], names);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      personId: 'p1',
      category: 'training',
      itemName: 'Export Control Basics (EXP-300)',
      source: 'program',
      status: 'not-ready',
      reason: 'Missing, required by Program XYZ',
      requiredBy: ['xyz'],
    });
    expect(rules.apply('p1', [], [xyz])[0].itemName).toBe('EXP-300');
  });

  it('shares one row when two programs require the same item', () => {
    const missing = rules.apply('p1', [], [xyz, abc]);
    const exportRows = missing.filter((c) => c.category === 'training');
    expect(exportRows).toHaveLength(1);
    expect(exportRows[0].reason).toBe('Missing, required by Program XYZ, Program ABC');

    const held = [engine.evaluate(record('EXP-300', { completed: true }), TODAY)];
    const out = rules.apply('p1', held, [xyz, abc]);
    expect(out.find((c) => c.itemId === 'EXP-300')?.requiredBy).toEqual(['xyz', 'abc']);
    expect(out.find((c) => c.category === 'qualification')?.status).toBe('not-ready');
    expect(out).toHaveLength(2);
  });

  describe('any of', () => {
    it('is met by any one option, of any type', () => {
      const qual = [engine.evaluate(record('QL-MEL-01', { category: 'qualification', expires: '2027-06-01' }), TODAY)];
      const out = rules.apply('p1', qual, [tern]);
      expect(out).toHaveLength(1);
      expect(out[0].requiredBy).toEqual(['tern']);
    });

    it('counts the best of several matches', () => {
      const checks = [
        engine.evaluate(record('ELEC-101', { completed: true, expires: '2026-10-01' }), TODAY),
        engine.evaluate(record('ELEC-201', { completed: true }), TODAY),
      ];
      const out = rules.apply('p1', checks, [tern]);
      expect(out.map((c) => [c.itemId, c.status, c.requiredBy])).toEqual([
        ['ELEC-101', 'not-ready', []],
        ['ELEC-201', 'ready', ['tern']],
      ]);
    });

    it('adds one red check, labeled with the name and the options, when none is held', () => {
      const out = rules.apply('p1', [], [tern]);
      expect(out).toHaveLength(1);
      expect(out[0]).toMatchObject({
        category: 'training',
        itemName: 'Electrical safety: any of ELEC-101, ELEC-201, QL-MEL-01',
        status: 'not-ready',
        reason: 'Missing, required by Tern class',
      });
    });
  });

  it('does not change the checks passed in', () => {
    const checks = [engine.evaluate(record('EXP-300', { completed: true }), TODAY)];
    rules.apply('p1', checks, [xyz]);
    expect(checks[0].requiredBy).toEqual([]);
  });
});
