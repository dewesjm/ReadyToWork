import { Check, Program, Requirement } from './model';

/**
 * Applies a person's programs to their checks. A requirement the person already has a check for
 * adds the program to that check's `requiredBy` (one row, not two). A requirement they don't hold
 * becomes one red "missing" check, shared by every program that requires it.
 */
export class ProgramRules {
  apply(personId: string, checks: readonly Check[], programs: readonly Program[]): Check[] {
    const result = checks.map((c) => ({ ...c, requiredBy: [...c.requiredBy] }));
    const missing = new Map<string, { requirement: Requirement; programs: Program[] }>();

    for (const program of programs) {
      for (const req of program.requirements) {
        const held = result.filter((c) => c.itemId === req.itemId);
        if (held.length > 0) {
          for (const c of held) addOnce(c.requiredBy, program.id);
          continue;
        }
        const entry = missing.get(req.itemId) ?? { requirement: req, programs: [] };
        if (!entry.programs.includes(program)) entry.programs.push(program);
        missing.set(req.itemId, entry);
      }
    }

    for (const { requirement, programs: by } of missing.values()) {
      result.push({
        personId,
        category: requirement.category,
        itemId: requirement.itemId,
        itemName: requirement.itemName,
        source: 'program',
        status: 'not-ready',
        reason: `Missing, required by ${by.map((p) => p.name).join(', ')}`,
        stale: false,
        requiredBy: by.map((p) => p.id),
      });
    }
    return result;
  }
}

function addOnce(list: string[], id: string): void {
  if (!list.includes(id)) list.push(id);
}
