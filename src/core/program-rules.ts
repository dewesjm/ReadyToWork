import { Check, Program, Requirement } from './model';
import { ItemNames, optionMatches, requirementKey, requirementLabel } from './requirements';
import { compareStatus } from './status-engine';

/**
 * Applies a person's programs to their checks. A requirement is met by any one of its options;
 * of the checks that match, the best one counts and gets the program in its `requiredBy` (one
 * row, not two). A requirement nothing matches becomes one red "missing" check, shared by every
 * program that requires it.
 */
export class ProgramRules {
  /** `names` gives item names seen in the source data, for labeling missing items. */
  apply(
    personId: string,
    checks: readonly Check[],
    programs: readonly Program[],
    names: ItemNames = new Map(),
  ): Check[] {
    const result = checks.map((c) => ({ ...c, requiredBy: [...c.requiredBy] }));
    const missing = new Map<string, { requirement: Requirement; programs: Program[] }>();

    for (const program of programs) {
      for (const req of program.requirements) {
        if (req.anyOf.length === 0) continue;
        const matches = result.filter((c) =>
          req.anyOf.some((o) => optionMatches(o, c.category, c.itemId)),
        );
        if (matches.length > 0) {
          // compareStatus puts the worse first, so a negative result means b is better.
          const best = matches.reduce((a, b) => (compareStatus(a.status, b.status) < 0 ? b : a));
          addOnce(best.requiredBy, program.id);
          continue;
        }
        const key = requirementKey(req);
        const entry = missing.get(key) ?? { requirement: req, programs: [] };
        if (!entry.programs.includes(program)) entry.programs.push(program);
        missing.set(key, entry);
      }
    }

    for (const [key, { requirement, programs: by }] of missing) {
      result.push({
        personId,
        category: requirement.anyOf[0].category,
        itemId: `req:${key}`,
        itemName: requirementLabel(requirement, names),
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
