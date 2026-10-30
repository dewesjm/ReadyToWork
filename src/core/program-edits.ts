import { Check, Program, Requirement, Rollup, Status } from './model';
import { ReadinessResult } from './readiness-evaluator';
import { toRollup, emptyCounts } from './rollup-calculator';
import { worstStatus } from './status-engine';

/** The admin-edited part of the setup: programs and who is on them. */
export interface ProgramSetup {
  programs: Program[];
  /** Program ids per person id. */
  assignments: Record<string, string[]>;
}

// Every edit returns a new setup and leaves the one passed in unchanged.

/** Adds an empty program. Its id comes from the name, with a number added if that is taken. */
export function createProgram(setup: ProgramSetup, name: string): { setup: ProgramSetup; id: string } {
  const base = `prog-${slug(name) || 'program'}`;
  const taken = new Set(setup.programs.map((p) => p.id));
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return {
    setup: { ...setup, programs: [...setup.programs, { id, name: name.trim(), requirements: [] }] },
    id,
  };
}

export function renameProgram(setup: ProgramSetup, programId: string, name: string): ProgramSetup {
  return mapProgram(setup, programId, (p) => ({ ...p, name: name.trim() }));
}

/** Removes the program and everyone's assignment to it. */
export function deleteProgram(setup: ProgramSetup, programId: string): ProgramSetup {
  return {
    programs: setup.programs.filter((p) => p.id !== programId),
    assignments: pruneAssignments(setup.assignments, (id) => id !== programId),
  };
}

/** Does nothing when the program already requires the item. */
export function addRequirement(setup: ProgramSetup, programId: string, req: Requirement): ProgramSetup {
  return mapProgram(setup, programId, (p) =>
    p.requirements.some((r) => r.itemId === req.itemId)
      ? p
      : { ...p, requirements: [...p.requirements, { ...req }] },
  );
}

export function removeRequirement(setup: ProgramSetup, programId: string, itemId: string): ProgramSetup {
  return mapProgram(setup, programId, (p) => ({
    ...p,
    requirements: p.requirements.filter((r) => r.itemId !== itemId),
  }));
}

/** Puts each person on the program; people already on it are left as they are. */
export function assignMany(setup: ProgramSetup, programId: string, personIds: readonly string[]): ProgramSetup {
  const assignments = { ...setup.assignments };
  for (const personId of personIds) {
    const current = assignments[personId] ?? [];
    if (!current.includes(programId)) assignments[personId] = [...current, programId];
  }
  return { ...setup, assignments };
}

export function assign(setup: ProgramSetup, programId: string, personId: string): ProgramSetup {
  return assignMany(setup, programId, [personId]);
}

export function unassign(setup: ProgramSetup, programId: string, personId: string): ProgramSetup {
  const current = setup.assignments[personId];
  if (!current?.includes(programId)) return setup;
  const assignments = { ...setup.assignments };
  const rest = current.filter((id) => id !== programId);
  if (rest.length > 0) assignments[personId] = rest;
  else delete assignments[personId];
  return { ...setup, assignments };
}

/** Keeps only the program ids `keep` accepts, dropping people left with none. */
export function pruneAssignments(
  assignments: Readonly<Record<string, readonly string[]>>,
  keep: (programId: string) => boolean,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [personId, ids] of Object.entries(assignments)) {
    const kept = ids.filter(keep);
    if (kept.length > 0) out[personId] = kept;
  }
  return out;
}

/** Why a program name can't be used, or null when it can. Names are unique ignoring case. */
export function programNameProblem(
  name: string,
  programs: readonly Program[],
  exceptId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Enter a program name.';
  const clash = programs.find(
    (p) => p.id !== exceptId && p.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return clash ? `There is already a program called "${clash.name}".` : null;
}

/** A person's status for one program: the worst check it requires, ready when it requires nothing. */
export function programStatus(programId: string, checks: readonly Check[]): Status {
  return worstStatus(checks.filter((c) => c.requiredBy.includes(programId)).map((c) => c.status)) ?? 'ready';
}

export interface ProgramSummary {
  /** Ids of the people on the program, in org order. */
  personIds: string[];
  /** Counts of their status for this program. */
  rollup: Rollup;
}

/** Who is on a program and how ready they are for it. Ids not in the org are skipped. */
export function programSummary(
  programId: string,
  assignments: Readonly<Record<string, readonly string[]>>,
  readiness: ReadinessResult,
): ProgramSummary {
  const personIds: string[] = [];
  const counts = emptyCounts();
  for (const root of readiness.org.roots()) {
    for (const person of readiness.org.subtree(root.id)) {
      if (!assignments[person.id]?.includes(programId)) continue;
      personIds.push(person.id);
      counts[programStatus(programId, readiness.checksByPerson.get(person.id) ?? [])]++;
    }
  }
  return { personIds, rollup: toRollup(counts) };
}

function mapProgram(setup: ProgramSetup, programId: string, change: (p: Program) => Program): ProgramSetup {
  return { ...setup, programs: setup.programs.map((p) => (p.id === programId ? change(p) : p)) };
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
