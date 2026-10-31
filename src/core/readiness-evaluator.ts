import { IsoDate } from './dates';
import { Check, Person, Program, Rollup, SourceRecord, Status } from './model';
import { OrgIndex } from './org-index';
import { ProgramRules } from './program-rules';
import { itemNames } from './requirements';
import { RollupCalculator } from './rollup-calculator';
import { StatusEngine, worstStatus } from './status-engine';

export interface ReadinessInput {
  people: readonly Person[];
  records: readonly SourceRecord[];
  programs: readonly Program[];
  /** Program ids per person id. */
  assignments: Readonly<Record<string, readonly string[]>>;
  today: IsoDate;
}

export interface ReadinessResult {
  org: OrgIndex;
  checksByPerson: Map<string, Check[]>;
  statusByPerson: Map<string, Status>;
  rollups: Map<string, Rollup>;
}

/** Runs the whole pipeline: records to checks, programs applied, person statuses, roll-ups. */
export class ReadinessEvaluator {
  constructor(
    private readonly engine: StatusEngine,
    private readonly programRules: ProgramRules,
    private readonly rollups: RollupCalculator,
  ) {}

  evaluate(input: ReadinessInput): ReadinessResult {
    const org = new OrgIndex(input.people);
    const programsById = new Map(input.programs.map((p) => [p.id, p]));

    const recordsByPerson = new Map<string, SourceRecord[]>();
    for (const r of input.records) {
      const list = recordsByPerson.get(r.personId) ?? [];
      list.push(r);
      recordsByPerson.set(r.personId, list);
    }

    const names = itemNames(input.records);
    const checksByPerson = new Map<string, Check[]>();
    const statusByPerson = new Map<string, Status>();
    for (const person of input.people) {
      const evaluated = (recordsByPerson.get(person.id) ?? []).map((r) =>
        this.engine.evaluate(r, input.today),
      );
      const programs = (input.assignments[person.id] ?? [])
        .map((id) => programsById.get(id))
        .filter((p): p is Program => p !== undefined);
      const checks = this.programRules.apply(person.id, evaluated, programs, names);
      checksByPerson.set(person.id, checks);
      // No checks at all is "not ready", never "ready".
      statusByPerson.set(person.id, worstStatus(checks.map((c) => c.status)) ?? 'not-ready');
    }

    return { org, checksByPerson, statusByPerson, rollups: this.rollups.compute(org, statusByPerson) };
  }
}
