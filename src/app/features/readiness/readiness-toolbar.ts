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

  /** "21 of 201 people shown"; the tree and the list show the same people. */
  protected readonly shownText = computed(() => {
    const people = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'person' : 'people'}`;
    const { shownCount, scopeCount } = this.query.result();
    return shownCount === scopeCount ? `${people(shownCount)} shown` : `${shownCount} of ${people(scopeCount)} shown`;
  });

  protected statusChipClass(status: Status): string {
    return this.query.statuses().includes(status) ? buttonClass(status) : 'btn-outline';
  }
}
