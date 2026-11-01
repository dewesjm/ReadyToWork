import { Component, computed, inject } from '@angular/core';
import { ReadinessService } from '../../services/readiness-service';
import { Highlight } from '../../shared/highlight';
import { Icon } from '../../shared/icon/icon';
import { RollupBadge } from '../../shared/status/rollup-badge';
import { StatusBadge } from '../../shared/status/status-badge';
import { PersonNavigator } from '../readiness/person-navigator';
import { ItemsToggle } from '../readiness/items-toggle';
import { OpenItemsService } from '../readiness/open-items-service';
import { PersonItems } from '../readiness/person-items';
import { ReadinessEmpty } from '../readiness/readiness-empty';
import { ReadinessQueryService } from '../readiness/readiness-query-service';
import { TreeModel } from '../readiness/tree-model';

/**
 * The reporting tree on the Readiness page: one flat list of rows, indented by level. Mouse and
 * touch only (user decision 2026-11-01). Which rows exist comes from the page's query; which
 * are open from the TreeModel.
 */
@Component({
  selector: 'rtw-org-tree',
  imports: [Highlight, Icon, StatusBadge, RollupBadge, ReadinessEmpty, PersonItems, ItemsToggle],
  templateUrl: './org-tree.html',
})
export class OrgTree {
  protected readonly query = inject(ReadinessQueryService);
  protected readonly tree = inject(TreeModel);
  protected readonly items = inject(OpenItemsService);
  private readonly readiness = inject(ReadinessService);
  private readonly navigator = inject(PersonNavigator);
  /** The person open in the dashboard panel; that row is the selected one. */
  protected readonly selectedId = this.navigator.panelPersonId;

  protected readonly keyword = computed(() => this.query.keyword().trim());

  protected readonly rows = computed(() => {
    const { statusByPerson, checksByPerson, rollups } = this.readiness.result();
    const keyword = this.keyword();
    return this.tree.visibleRows().map((row) => {
      const p = row.person;
      return {
        ...row,
        id: p.id,
        status: statusByPerson.get(p.id) ?? 'not-ready',
        chips: this.query.issueCategories(checksByPerson.get(p.id) ?? []),
        rollup: rollups.get(p.id) ?? null,
        expandable: row.childIds.length > 0,
        expanded: this.tree.isExpanded(p.id),
        itemsOpen: this.items.isOpen(p.id),
        /** The employee ID is shown only when the keyword matches it. */
        showEmployeeId: keyword !== '' && p.employeeId.toLowerCase().includes(keyword.toLowerCase()),
      };
    });
  });

  /** A row click opens or closes a manager's row; only the Details button opens a person. */
  protected onRowClick(row: { id: string; expandable: boolean }): void {
    if (row.expandable) this.tree.toggle(row.id);
  }

  protected openPerson(id: string): void {
    this.navigator.open(id);
  }
}
