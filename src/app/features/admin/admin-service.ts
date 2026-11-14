import { Injectable, computed, inject, signal } from '@angular/core';
import { Announcement, DEFAULT_CONFIG, ProgramSetup, ProgramSummary, programSummary } from '../../../core';
import { Settings, clearWarningDays, setWarningDays, warningDaysProblem, withProgramSetup } from '../../../data';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';

/** How long the "Saved" note stays up after an edit. */
export const SAVED_NOTE_MS = 2000;

/**
 * Admin edits. Every change saves at once and applies everywhere (there is no Save button);
 * `saved` turns on briefly so the screen can say so.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly settings = inject(SettingsService);
  private readonly readiness = inject(ReadinessService);
  private savedTimer: ReturnType<typeof setTimeout> | undefined;

  readonly programs = computed(() => this.settings.settings().programs);
  readonly setup = computed<ProgramSetup>(() => {
    const { programs, assignments } = this.settings.settings();
    return { programs, assignments };
  });
  readonly announcements = computed(() => this.settings.settings().announcements);
  readonly itemNames = this.readiness.itemNames;
  readonly saved = signal(false);
  readonly warningWindows = computed(() => {
    const overrides = this.settings.settings().warningDays;
    return DEFAULT_CONFIG.categories.map((category) => ({
      category,
      days: overrides[category.id] ?? category.warningDays,
      overridden: overrides[category.id] !== undefined,
    }));
  });

  /** Saves an override; null or the shipped value restores the category default. */
  setWarningWindow(categoryId: string, days: number | null): number {
    const category = DEFAULT_CONFIG.categories.find((entry) => entry.id === categoryId);
    if (!category) throw new Error(`Unknown category: ${categoryId}`);
    const problem = days === null ? null : warningDaysProblem(days);
    if (problem) throw new Error(problem);
    this.edit((settings) =>
      days === null || days === category.warningDays
        ? clearWarningDays(settings, categoryId)
        : setWarningDays(settings, categoryId, days),
    );
    return days ?? category.warningDays;
  }

  /** People on each program and their readiness for it, by program id. */
  readonly summaries = computed(() => {
    const { programs, assignments } = this.setup();
    const result = this.readiness.result();
    return new Map<string, ProgramSummary>(
      programs.map((p) => [p.id, programSummary(p.id, assignments, result)]),
    );
  });

  editPrograms(change: (setup: ProgramSetup) => ProgramSetup): void {
    this.edit((s) => withProgramSetup(s, change({ programs: s.programs, assignments: s.assignments })));
  }

  editAnnouncements(change: (list: Announcement[]) => Announcement[]): void {
    this.edit((s) => ({ ...s, announcements: change(s.announcements) }));
  }

  edit(change: (settings: Settings) => Settings): void {
    this.settings.update(change);
    this.markSaved();
  }

  /** Replaces the admin settings with ones read from a file (`SettingsService.readFile`). */
  replace(settings: Settings): void {
    this.edit(() => settings);
  }

  /** Programs, assignments, warning windows and announcements back to the defaults; preferences are kept. */
  resetAdmin(): void {
    this.settings.resetAdmin();
    this.markSaved();
  }

  private markSaved(): void {
    this.saved.set(true);
    clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => this.saved.set(false), SAVED_NOTE_MS);
  }
}
