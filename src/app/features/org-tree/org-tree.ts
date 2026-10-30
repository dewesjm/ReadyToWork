import { Component, ElementRef, Injector, afterNextRender, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DEFAULT_CONFIG, ReadinessFilter } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { Highlight } from '../../shared/highlight';
import { Icon } from '../../shared/icon/icon';
import { CategoryChip } from '../../shared/status/category-chip';
import { RollupBadge } from '../../shared/status/rollup-badge';
import { StatusBadge } from '../../shared/status/status-badge';
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
  imports: [Highlight, Icon, StatusBadge, CategoryChip, RollupBadge],
  templateUrl: './org-tree.html',
})
export class OrgTree {
  protected readonly query = inject(ReadinessQueryService);
  protected readonly tree = inject(TreeModel);
  private readonly state = inject(TreeStateService);
  private readonly readiness = inject(ReadinessService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
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
        status: statusByPerson.get(p.id) ?? 'unknown',
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
    void this.router.navigate(['/person', id]);
  }

  private focusRow(id: string): void {
    this.state.focusedId.set(id);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>(`[data-id="${id}"]`)?.focus(),
      { injector: this.injector },
    );
  }
}
