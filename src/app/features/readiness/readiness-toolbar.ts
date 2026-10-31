import { Component, computed, inject } from '@angular/core';
import { DEFAULT_CONFIG, ISSUE_STATUSES, STATUS_META, Status, readinessExportRows, toCsv } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { Legend } from '../../shared/status/legend';
import { buttonClass } from '../../shared/status/status-classes';
import { supervisorChoices } from '../../shared/supervisor-choices';
import { ClockService } from '../../services/clock-service';
import { ViewerService } from '../../services/viewer-service';
import { CategoryFilter } from './category-filter';
import { ReadinessQueryService } from './readiness-query-service';
import { TreeModel } from './tree-model';

/** The Readiness page's shared toolbar: scope, view, export, search, Issues only and filters. */
@Component({
  selector: 'rtw-readiness-toolbar',
  imports: [Icon, Legend, CategoryFilter],
  templateUrl: './readiness-toolbar.html',
})
export class ReadinessToolbar {
  protected readonly query = inject(ReadinessQueryService);
  protected readonly tree = inject(TreeModel);
  private readonly viewer = inject(ViewerService);
  private readonly clock = inject(ClockService);
  protected readonly issueStatuses = ISSUE_STATUSES;
  protected readonly statusMeta = STATUS_META;
  /** The category and status filters only apply while Issues only does (not during a search). */
  protected readonly filtersApply = computed(() => this.query.issuesOnly() && !this.query.searchingEveryone());

  protected readonly supervisorOptions = computed(() =>
    supervisorChoices(this.query.supervisorOptions(), this.viewer.viewer()?.personId),
  );

  /** "21 of 201 people shown"; the tree and the list show the same people. */
  protected readonly shownText = computed(() => {
    const people = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'person' : 'people'}`;
    const { shownCount, scopeCount } = this.query.result();
    return shownCount === scopeCount ? `${people(shownCount)} shown` : `${shownCount} of ${people(scopeCount)} shown`;
  });

  protected statusChipClass(status: Status): string {
    return this.query.statuses().includes(status) ? buttonClass(status) : 'btn-outline';
  }

  /** Downloads the people the page shows (both views show the same ones) as a CSV for Excel. */
  protected exportCsv(): void {
    const csv = toCsv(readinessExportRows(this.query.listResult(), DEFAULT_CONFIG.categories));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `readiness-${this.clock.today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
