import { Component, computed, inject } from '@angular/core';
import { ISSUE_STATUSES, STATUS_META, Status } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { Legend } from '../../shared/status/legend';
import { buttonClass } from '../../shared/status/status-classes';
import { supervisorChoices } from '../../shared/supervisor-choices';
import { ViewerService } from '../../services/viewer-service';
import { CategoryFilter } from './category-filter';
import { ReadinessQueryService } from './readiness-query-service';
import { TreeModel } from './tree-model';

/** The Readiness page's shared toolbar: scope, view, search, Issues only and filters. */
@Component({
  selector: 'rtw-readiness-toolbar',
  imports: [Icon, Legend, CategoryFilter],
  templateUrl: './readiness-toolbar.html',
})
export class ReadinessToolbar {
  protected readonly query = inject(ReadinessQueryService);
  protected readonly tree = inject(TreeModel);
  private readonly viewer = inject(ViewerService);
  protected readonly issueStatuses = ISSUE_STATUSES;
  protected readonly statusMeta = STATUS_META;

  protected readonly supervisorOptions = computed(() =>
    supervisorChoices(this.query.supervisorOptions(), this.viewer.viewer()?.personId),
  );

  /** Tree: "21 of 201 people shown". List: "38 checks for 21 people". */
  protected readonly shownText = computed(() => {
    const people = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'person' : 'people'}`;
    if (this.query.view() === 'list') {
      const { rows, personCount } = this.query.listResult();
      const checks = `${rows.length.toLocaleString('en-US')} ${rows.length === 1 ? 'check' : 'checks'}`;
      return `${checks} for ${people(personCount)}`;
    }
    const { shownCount, scopeCount } = this.query.result();
    return shownCount === scopeCount ? `${people(shownCount)} shown` : `${shownCount} of ${people(scopeCount)} shown`;
  });

  protected readonly placeholder = computed(() =>
    this.query.view() === 'list' ? 'Name, title, employee ID or item' : 'Name, title or employee ID',
  );

  protected statusChipClass(status: Status): string {
    return this.query.statuses().includes(status) ? buttonClass(status) : 'btn-outline';
  }
}
