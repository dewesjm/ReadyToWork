import { compareByUrgency } from './check-order';
import { CategoryConfig } from './config';
import { Check, Person, Program, Rollup, Status, StatusCounts } from './model';
import { ReadinessResult } from './readiness-evaluator';
import { FilterViewer, canView } from './readiness-filter';
import { emptyCounts } from './rollup-calculator';
import { worstStatus } from './status-engine';

export interface ChainLink {
  person: Person;
  /** False for managers above the viewer, who can't be opened. */
  canOpen: boolean;
}

export interface ProgramStatus {
  program: Program;
  /** Worst status among the checks this program requires; ready when it requires nothing. */
  status: Status;
}

export interface CategoryTile {
  category: CategoryConfig;
  /** Worst status in the category, or null when nothing is tracked there. */
  status: Status | null;
  total: number;
  counts: StatusCounts;
}

export interface PersonDetailView {
  person: Person;
  status: Status;
  /** Top of the org first, direct manager last. */
  chain: ChainLink[];
  programs: ProgramStatus[];
  /** One per configured category, in config order. */
  tiles: CategoryTile[];
  /** Worst first, then soonest due. */
  checks: Check[];
  /** Only for people with someone below them. */
  responsibleFor: { rollup: Rollup; directReports: number } | null;
}

export interface PersonDetailInput {
  readiness: ReadinessResult;
  /** Program ids per person id. */
  assignments: Readonly<Record<string, readonly string[]>>;
  programs: readonly Program[];
  viewer: FilterViewer;
  personId: string;
}

/** Everything the person detail shows, for one person the viewer may see. */
export class PersonDetailBuilder {
  /** `categories` gives the tiles and their order. */
  constructor(private readonly categories: readonly CategoryConfig[]) {}

  /** Null when the person doesn't exist or the viewer can't see them. */
  build(input: PersonDetailInput): PersonDetailView | null {
    const { org, checksByPerson, statusByPerson, rollups } = input.readiness;
    const person = org.get(input.personId);
    if (!person || !canView(org, input.viewer, person.id)) return null;

    const checks = [...(checksByPerson.get(person.id) ?? [])].sort(compareByUrgency);
    const programsById = new Map(input.programs.map((p) => [p.id, p]));
    const programs = (input.assignments[person.id] ?? [])
      .map((id) => programsById.get(id))
      .filter((p): p is Program => p !== undefined)
      .map((program) => ({
        program,
        status:
          worstStatus(checks.filter((c) => c.requiredBy.includes(program.id)).map((c) => c.status)) ??
          'ready',
      }));

    const tiles = this.categories.map((category) => {
      const counts = emptyCounts();
      const inCategory = checks.filter((c) => c.category === category.id);
      for (const c of inCategory) counts[c.status]++;
      return {
        category,
        status: worstStatus(inCategory.map((c) => c.status)),
        total: inCategory.length,
        counts,
      };
    });

    const rollup = rollups.get(person.id);
    return {
      person,
      status: statusByPerson.get(person.id) ?? 'unknown',
      chain: org
        .managerChain(person.id)
        .map((m) => ({ person: m, canOpen: canView(org, input.viewer, m.id) })),
      programs,
      tiles,
      checks,
      responsibleFor: rollup ? { rollup, directReports: org.childrenOf(person.id).length } : null,
    };
  }
}
