import { Component, computed, inject } from '@angular/core';
import { ISSUE_STATUSES, STATUS_META, Status } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { Legend } from '../../shared/status/legend';
import { buttonClass } from '../../shared/status/status-classes';
import { ViewerService } from '../../services/viewer-service';
import { CategoryFilter } from './category-filter';
import { READINESS_PAGE_CONFIG } from './readiness-page-config';
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

  protected readonly supervisorOptions = computed(() => {
    const viewerId = this.viewer.viewer()?.personId;
    const indent = ' '.repeat(READINESS_PAGE_CONFIG.supervisorIndent);
    return this.query.supervisorOptions().map((o) => ({
      id: o.person.id,
      label:
        indent.repeat(o.depth) +
        (o.person.id === viewerId ? `You (${o.person.name})` : `${o.person.name}, ${o.person.title}`),
    }));
  });

  protected readonly shownText = computed(() => {
    const { shownCount, scopeCount } = this.query.result();
    const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`;
    return shownCount === scopeCount ? `${people(shownCount)} shown` : `${shownCount} of ${people(scopeCount)} shown`;
  });

  protected statusChipClass(status: Status): string {
    return this.query.statuses().includes(status) ? buttonClass(status) : 'btn-outline';
  }
}
