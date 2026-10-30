import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Person,
  ProgramRules,
  ReadinessEvaluator,
  RollupCalculator,
  SourceRecord,
  StatusEngine,
} from '../../core';
import { CatalogItem, Persona, readinessConfigFrom } from '../../data';
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
  readonly catalog = signal<CatalogItem[]>([]);
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
    const [people, records, catalog, personas] = await Promise.all([
      this.source.getPeople(),
      this.source.getRecords(),
      this.source.getCatalog(),
      this.source.getPersonas(),
    ]);
    this.people.set(people);
    this.records.set(records);
    this.catalog.set(catalog);
    this.personas.set(personas);
    this.loaded.set(true);
  }
}
