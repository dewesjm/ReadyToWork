import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryId, DEFAULT_CONFIG, PersonDetailBuilder, STATUS_META } from '../../../core';
import { ClockService } from '../../services/clock-service';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { Icon } from '../../shared/icon/icon';
import { RollupBadge } from '../../shared/status/rollup-badge';
import { StatusBadge } from '../../shared/status/status-badge';
import { badgeClass } from '../../shared/status/status-classes';
import { CategoryTiles } from './category-tiles';
import { CheckTable } from './check-table';

export type PersonDetailMode = 'page' | 'panel';

/**
 * One person's readiness: header with manager chain and programs, category tiles, checks and,
 * for managers, what they are responsible for. The same component fills the drill-down page
 * and the dashboard panel; `mode` decides where its links go.
 */
@Component({
  selector: 'rtw-person-detail',
  imports: [RouterLink, Icon, StatusBadge, RollupBadge, CategoryTiles, CheckTable],
  templateUrl: './person-detail.html',
})
export class PersonDetail {
  readonly personId = input.required<string>();
  readonly mode = input<PersonDetailMode>('page');

  private readonly readiness = inject(ReadinessService);
  private readonly settings = inject(SettingsService);
  private readonly viewer = inject(ViewerService);
  protected readonly today = inject(ClockService).today;
  private readonly builder = new PersonDetailBuilder(DEFAULT_CONFIG.categories);

  /** Null when the person doesn't exist or the viewer can't see them. */
  readonly view = computed(() => {
    const viewer = this.viewer.viewer();
    if (!viewer) return null;
    const settings = this.settings.settings();
    return this.builder.build({
      readiness: this.readiness.result(),
      assignments: settings.assignments,
      programs: settings.programs,
      viewer,
      personId: this.personId(),
    });
  });

  protected readonly programNames = computed(
    () => new Map(this.settings.settings().programs.map((p) => [p.id, p.name])),
  );

  /** Tile filter; cleared when another person is shown. */
  protected readonly category = linkedSignal<string, CategoryId | null>({
    source: this.personId,
    computation: () => null,
  });

  protected readonly checks = computed(() => {
    const checks = this.view()?.checks ?? [];
    const category = this.category();
    return category ? checks.filter((c) => c.category === category) : checks;
  });

  protected readonly categoryLabel = computed(
    () => DEFAULT_CONFIG.categories.find((c) => c.id === this.category())?.label ?? '',
  );

  protected readonly statusMeta = STATUS_META;
  protected readonly badgeClass = badgeClass;

  /** Router link to another person: the panel stays on the Readiness page, the page moves. */
  protected personLink(id: string) {
    return this.mode() === 'panel'
      ? { commands: ['/readiness'], queryParams: { person: id }, merge: true }
      : { commands: ['/person', id], queryParams: {}, merge: false };
  }

  protected firstName(name: string): string {
    return name.split(' ')[0];
  }
}
