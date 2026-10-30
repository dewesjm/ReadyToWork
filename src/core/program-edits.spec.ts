import { DEFAULT_CONFIG } from './config';
import { SourceRecord } from './model';
import {
  ProgramSetup,
  addRequirement,
  assign,
  assignMany,
  createProgram,
  deleteProgram,
  programNameProblem,
  programStatus,
  programSummary,
  pruneAssignments,
  removeRequirement,
  renameProgram,
  unassign,
} from './program-edits';
import { ProgramRules } from './program-rules';
import { ReadinessEvaluator } from './readiness-evaluator';
import { RollupCalculator } from './rollup-calculator';
import { StatusEngine } from './status-engine';
import { TEST_ORG } from './test-org';

const TODAY = '2026-11-01';
const CRANE_QUAL = { category: 'qualification', itemId: 'q:crane', itemName: 'Crane Operator' };
const RIGGER_QUAL = { category: 'qualification', itemId: 'q:rigger', itemName: 'Qualified Rigger' };

function setup(): ProgramSetup {
  return {
    programs: [
      { id: 'crane', name: 'Crane Operations', requirements: [CRANE_QUAL] },
      { id: 'export', name: 'Export Controlled Work', requirements: [] },
    ],
    assignments: { c1: ['crane'], c2: ['crane', 'export'], f3: ['export'] },
  };
}

describe('program edits', () => {
  it('creates a program with an id from its name, numbered when taken', () => {
    const first = createProgram(setup(), '  Night Shift ');
    expect(first.id).toBe('prog-night-shift');
    expect(first.setup.programs.at(-1)).toEqual({ id: 'prog-night-shift', name: 'Night Shift', requirements: [] });
    expect(createProgram(first.setup, 'Night shift!').id).toBe('prog-night-shift-2');
    expect(createProgram(setup(), '***').id).toBe('prog-program');
  });

  it('renames a program and keeps its id', () => {
    const s = renameProgram(setup(), 'crane', ' Cranes ');
    expect(s.programs[0]).toEqual({ ...setup().programs[0], name: 'Cranes' });
  });

  it('deletes a program with its assignments, dropping people left with none', () => {
    const s = deleteProgram(setup(), 'crane');
    expect(s.programs.map((p) => p.id)).toEqual(['export']);
    expect(s.assignments).toEqual({ c2: ['export'], f3: ['export'] });
  });

  it('adds a requirement once and removes it', () => {
    const added = addRequirement(setup(), 'export', RIGGER_QUAL);
    expect(added.programs[1].requirements).toEqual([RIGGER_QUAL]);
    expect(addRequirement(added, 'export', RIGGER_QUAL)).toEqual(added);
    expect(removeRequirement(added, 'export', 'q:rigger').programs[1].requirements).toEqual([]);
  });

  it('assigns and unassigns people', () => {
    const s = assignMany(setup(), 'export', ['c1', 'c2', 'dir']);
    expect(s.assignments).toEqual({ c1: ['crane', 'export'], c2: ['crane', 'export'], f3: ['export'], dir: ['export'] });
    expect(assign(s, 'export', 'dir')).toEqual(s);
    const removed = unassign(unassign(s, 'export', 'dir'), 'crane', 'c1');
    expect(removed.assignments).toEqual({ c1: ['export'], c2: ['crane', 'export'], f3: ['export'] });
    expect(unassign(removed, 'crane', 'nobody')).toBe(removed);
  });

  it('never changes the setup it is given', () => {
    const original = setup();
    const copy = structuredClone(original);
    addRequirement(original, 'crane', RIGGER_QUAL);
    assignMany(original, 'export', ['c1']);
    unassign(original, 'crane', 'c1');
    deleteProgram(original, 'crane');
    renameProgram(original, 'crane', 'X');
    expect(original).toEqual(copy);
  });

  it('prunes assignments by program id', () => {
    expect(pruneAssignments(setup().assignments, (id) => id === 'export')).toEqual({ c2: ['export'], f3: ['export'] });
  });

  it('refuses empty and duplicate names, ignoring case', () => {
    const programs = setup().programs;
    expect(programNameProblem('  ', programs)).toBe('Enter a program name.');
    expect(programNameProblem('crane operations ', programs)).toBe(
      'There is already a program called "Crane Operations".',
    );
    expect(programNameProblem('Crane Operations', programs, 'crane')).toBeNull();
    expect(programNameProblem('Welding', programs)).toBeNull();
  });
});

describe('program readiness', () => {
  // Everyone holds a valid crane qualification except c1 (none) and c2 (expiring).
  function records(): SourceRecord[] {
    return TEST_ORG.filter((p) => p.id !== 'c1').map((p) => ({
      personId: p.id,
      ...CRANE_QUAL,
      source: 'quals',
      lastSynced: TODAY,
      expires: p.id === 'c2' ? '2026-12-01' : '2028-01-01',
    }));
  }
  const evaluator = new ReadinessEvaluator(
    new StatusEngine(DEFAULT_CONFIG),
    new ProgramRules(),
    new RollupCalculator(),
  );
  const evaluate = (s: ProgramSetup) =>
    evaluator.evaluate({ people: TEST_ORG, records: records(), ...s, today: TODAY });

  it('gives each person on a program their worst required check, ready when nothing is required', () => {
    const result = evaluate(setup());
    expect(programStatus('crane', result.checksByPerson.get('c1')!)).toBe('not-ready');
    expect(programStatus('crane', result.checksByPerson.get('c2')!)).toBe('expiring');
    expect(programStatus('export', result.checksByPerson.get('c2')!)).toBe('ready');
  });

  it('summarizes who is on a program, in org order, skipping ids not in the org', () => {
    const s = assignMany(setup(), 'crane', ['ghost', 'dir']);
    const summary = programSummary('crane', s.assignments, evaluate(s));
    expect(summary.personIds).toEqual(['dir', 'c1', 'c2']);
    expect(summary.rollup).toEqual({
      total: 3,
      counts: { 'not-ready': 1, expiring: 1, ready: 1 },
      worst: 'not-ready',
    });
  });

  it('adding a requirement turns exactly the assigned people who lack it red', () => {
    // Nobody holds the rigger qualification; c2 and f3 are on Export.
    const before = evaluate(setup());
    const after = evaluate(addRequirement(setup(), 'export', RIGGER_QUAL));
    const changed = TEST_ORG.filter((p) => after.statusByPerson.get(p.id) !== before.statusByPerson.get(p.id));
    expect(changed.map((p) => p.id)).toEqual(['c2', 'f3']);
    expect(after.statusByPerson.get('c2')).toBe('not-ready');
    expect(after.statusByPerson.get('f3')).toBe('not-ready');
  });
});
