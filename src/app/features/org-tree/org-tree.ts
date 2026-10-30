import { Component, ElementRef, afterNextRender, computed, inject } from '@angular/core';
import { DEFAULT_CONFIG, ReadinessFilter } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { Highlight } from '../../shared/highlight';
import { Icon } from '../../shared/icon/icon';
import { CategoryChip } from '../../shared/status/category-chip';
import { RollupBadge } from '../../shared/status/rollup-badge';
import { StatusBadge } from '../../shared/status/status-badge';
import { PersonNavigator } from '../readiness/person-navigator';
import { ReadinessEmpty } from '../readiness/readiness-empty';
import { ReadinessQueryService } from '../readiness/readiness-query-service';
import { TreeModel } from '../readiness/tree-model';
import { TreeStateService } from '../readiness/tree-state-service';

/**
 * The reporting tree on the Readiness page: one flat list of rows, indented by level, following
 * the WAI-ARIA tree pattern. Which rows exist comes from the page's query; which are open
 * from the TreeModel.
 */
@Component({
  selector: 'rtw-org-tree',
  imports: [Highlight, Icon, StatusBadge, CategoryChip, RollupBadge, ReadinessEmpty],
  templateUrl: './org-tree.html',
})
export class OrgTree {
  protected readonly query = inject(ReadinessQueryService);
  protected readonly tree = inject(TreeModel);
  private readonly state = inject(TreeStateService);
  private readonly readiness = inject(ReadinessService);
  private readonly navigator = inject(PersonNavigator);
  /** The person open in the dashboard panel; that row is the selected one. */
  protected readonly selectedId = this.navigator.panelPersonId;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly filter = new ReadinessFilter(DEFAULT_CONFIG.categories);

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
        chips: this.filter.issueCategories(checksByPerson.get(p.id) ?? []),
        rollup: rollups.get(p.id) ?? null,
        expandable: row.childIds.length > 0,
        expanded: this.tree.isExpanded(p.id),
        /** The employee ID is shown only when the keyword matches it. */
        showEmployeeId: keyword !== '' && p.employeeId.toLowerCase().includes(keyword.toLowerCase()),
      };
    });
  });

  /** The one row in the tab order: the last focused row if still visible, else the first. */
  protected readonly focusId = computed(() => {
    const rows = this.rows();
    const id = this.state.focusedId();
    return rows.some((r) => r.id === id) ? id : (rows[0]?.id ?? null);
  });

  constructor() {
    // Coming back from a person: put focus back on the row that opened them.
    afterNextRender(() => {
      const id = this.state.focusedId();
      if (id !== null && id === this.focusId()) this.focusRow(id);
    });
  }

  protected onFocus(id: string): void {
    this.state.focusedId.set(id);
  }

  protected toggle(id: string, event: Event): void {
    event.stopPropagation();
    this.tree.toggle(id);
  }

  protected openPerson(id: string): void {
    this.state.focusedId.set(id);
    this.navigator.open(id);
  }

  /** WAI-ARIA tree keys. Every move lands on a row that is already rendered. */
  protected onKeydown(event: KeyboardEvent): void {
    const rows = this.rows();
    const id = (event.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]')?.dataset['id'];
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) return;
    const row = rows[i];

    switch (event.key) {
      case 'ArrowDown':
        if (i + 1 < rows.length) this.focusRow(rows[i + 1].id);
        break;
      case 'ArrowUp':
        if (i > 0) this.focusRow(rows[i - 1].id);
        break;
      case 'ArrowRight':
        if (row.expandable && !row.expanded) this.tree.setExpanded([row.id], true);
        else if (row.expandable) this.focusRow(rows[i + 1].id);
        break;
      case 'ArrowLeft':
        if (row.expandable && row.expanded) this.tree.setExpanded([row.id], false);
        else if (row.parentId !== null) this.focusRow(row.parentId);
        break;
      case 'Home':
        this.focusRow(rows[0].id);
        break;
      case 'End':
        this.focusRow(rows[rows.length - 1].id);
        break;
      case 'Enter':
        this.openPerson(row.id);
        break;
      case '*': {
        const siblings = rows.filter((r) => r.parentId === row.parentId && r.expandable);
        this.tree.setExpanded(siblings.map((r) => r.id), true);
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  }

  private focusRow(id: string): void {
    this.state.focusedId.set(id);
    this.host.nativeElement.querySelector<HTMLElement>(`[role="treeitem"][data-id="${id}"]`)?.focus();
  }
}
