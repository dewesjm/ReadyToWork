import { Injectable, computed, inject } from '@angular/core';
import { FilterRow, opensByDefault } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { ReadinessQueryService } from './readiness-query-service';
import { TreeStateService } from './tree-state-service';

/**
 * Which tree rows are open and visible. Provided by the Readiness page so the toolbar's
 * Expand all / Collapse all and the tree itself share it.
 *
 * A row's open state is the user's choice if they made one under this query; otherwise open
 * when Issues only or a keyword narrows the tree, or else open down to the crew leads.
 */
@Injectable()
export class TreeModel {
  private readonly query = inject(ReadinessQueryService);
  private readonly state = inject(TreeStateService);
  private readonly readiness = inject(ReadinessService);

  readonly rows = computed(() => this.query.result().rows);
  readonly rowsById = computed(() => new Map(this.rows().map((r) => [r.person.id, r])));

  private readonly expandedIds = computed(() => {
    const key = this.query.queryKey();
    const narrowed = this.query.result().narrowed;
    const org = this.readiness.result().org;
    const open = new Set<string>();
    for (const row of this.rows()) {
      if (row.childIds.length === 0) continue;
      const id = row.person.id;
      if (this.state.choice(key, id) ?? (narrowed || opensByDefault(org, id))) open.add(id);
    }
    return open;
  });

  /** Rows whose managers (within the tree) are all open, in order. */
  readonly visibleRows = computed(() => {
    const open = this.expandedIds();
    const out: FilterRow[] = [];
    let hideBelow = Infinity;
    for (const row of this.rows()) {
      if (row.depth > hideBelow) continue;
      hideBelow = Infinity;
      out.push(row);
      if (row.childIds.length > 0 && !open.has(row.person.id)) hideBelow = row.depth;
    }
    return out;
  });

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  setExpanded(ids: Iterable<string>, expanded: boolean): void {
    this.state.set(this.query.queryKey(), ids, expanded);
  }

  toggle(id: string): void {
    this.setExpanded([id], !this.isExpanded(id));
  }

  expandAll(): void {
    this.setExpanded(this.parentIds(), true);
  }

  collapseAll(): void {
    this.setExpanded(this.parentIds(), false);
  }

  private parentIds(): string[] {
    return this.rows()
      .filter((r) => r.childIds.length > 0)
      .map((r) => r.person.id);
  }
}
