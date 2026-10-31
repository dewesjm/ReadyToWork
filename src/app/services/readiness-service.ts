import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Person,
  ProgramRules,
  ReadinessEvaluator,
  RollupCalculator,
  SourceRecord,
  StatusEngine,
  itemNames,
} from '../../core';
import { Persona, readinessConfigFrom } from '../../data';
import { ClockService } from './clock-service';
import { SettingsService } from './settings-service';
import { DATA_SOURCE } from './tokens';

/**
 * The org and everyone's readiness, recalculated whenever the data, settings (programs,
 * assignments, warning windows) or demo date change.
 */
@Injectable({ providedIn: 'root' })
export class ReadinessService {
  private readonly source = inject(DATA_SOURCE);
  private readonly settings = inject(SettingsService);
  private readonly clock = inject(ClockService);

  private readonly people = signal<Person[]>([]);
  private readonly records = signal<SourceRecord[]>([]);
  readonly personas = signal<Persona[]>([]);
  readonly loaded = signal(false);

  private readonly evaluator = computed(
    () =>
      new ReadinessEvaluator(
        new StatusEngine(readinessConfigFrom(this.settings.settings())),
        new ProgramRules(),
        new RollupCalculator(),
      ),
  );

  /** Item names seen in the records, by itemKey: labels typed IDs and tells Admin which are held. */
  readonly itemNames = computed(() => itemNames(this.records()));

  readonly result = computed(() => {
    const settings = this.settings.settings();
    return this.evaluator().evaluate({
      people: this.people(),
      records: this.records(),
      programs: settings.programs,
      assignments: settings.assignments,
      today: this.clock.today(),
    });
  });

  async load(): Promise<void> {
    const [people, records, personas] = await Promise.all([
      this.source.getPeople(),
      this.source.getRecords(),
      this.source.getPersonas(),
    ]);
    this.people.set(people);
    this.records.set(records);
    this.personas.set(personas);
    this.loaded.set(true);
  }
}
