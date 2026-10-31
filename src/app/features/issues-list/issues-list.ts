import { Component, ElementRef, afterNextRender, computed, inject } from '@angular/core';
import { DEFAULT_CONFIG, Person, describeDays } from '../../../core';
import { Highlight } from '../../shared/highlight';
import { Icon } from '../../shared/icon/icon';
import { CategoryChip } from '../../shared/status/category-chip';
import { StatusBadge } from '../../shared/status/status-badge';
import { ListStateService } from '../readiness/list-state-service';
import { PersonNavigator } from '../readiness/person-navigator';
import { ReadinessEmpty } from '../readiness/readiness-empty';
import { READINESS_PAGE_CONFIG } from '../readiness/readiness-page-config';
import { ReadinessQueryService } from '../readiness/readiness-query-service';

/**
 * The Readiness page's list view: one row per person (the same people as the tree), worst first,
 * with a column per category showing its worst status. A table on wide screens, cards on phones.
 * Shows a page of rows at a time.
 */
@Component({
  selector: 'rtw-issues-list',
  imports: [Highlight, Icon, CategoryChip, StatusBadge, ReadinessEmpty],
  templateUrl: './issues-list.html',
})
export class IssuesList {
  protected readonly query = inject(ReadinessQueryService);
  private readonly navigator = inject(PersonNavigator);
  private readonly state = inject(ListStateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly keyword = computed(() => this.query.keyword().trim());
  /** The person open in the dashboard panel; their row is highlighted. */
  protected readonly selectedId = this.navigator.panelPersonId;
  /** With the panel open the list is narrower: manager folds under the name, cells show icons. */
  protected readonly compact = computed(() => this.selectedId() !== null);

  protected readonly columns = computed(() =>
    this.query.listResult().columns.map((id) => {
      const c = DEFAULT_CONFIG.categories.find((c) => c.id === id);
      return { id, label: c?.label ?? id, icon: c?.icon ?? 'info' };
    }),
  );

  private readonly limit = computed(() => this.state.limit(this.query.queryKey()));
  protected readonly total = computed(() => this.query.listResult().rows.length);

  protected readonly rows = computed(() => {
    const columns = this.columns();
    return this.query
      .listResult()
      .rows.slice(0, this.limit())
      .map((r) => ({
        ...r,
        cells: r.cells.map((c) => ({
          cell: c,
          days: c && c.status !== 'ready' && c.daysRemaining !== undefined ? describeDays(c.daysRemaining) : '',
        })),
        issues: r.cells.flatMap((c, i) =>
          c && c.status !== 'ready' ? [{ category: columns[i].id, status: c.status }] : [],
        ),
      }));
  });

  /** How many rows "Show more" adds: a page, or what's left. */
  protected readonly nextCount = computed(() =>
    Math.min(READINESS_PAGE_CONFIG.listPageSize, this.total() - this.rows().length),
  );

  protected readonly moreText = computed(() => {
    const shown = this.rows().length;
    return `Showing ${shown.toLocaleString('en-US')} of ${this.total().toLocaleString('en-US')} people`;
  });

  constructor() {
    // Coming back from a person page: focus the row that opened them.
    afterNextRender(() => {
      const key = this.state.focusedKey();
      if (!key) return;
      // The table and the cards are both in the page; focus whichever one is displayed.
      const buttons = [...this.host.nativeElement.querySelectorAll<HTMLElement>(`[data-key="${key}"] button`)];
      (buttons.find((b) => b.getClientRects().length > 0) ?? buttons[0])?.focus();
    });
  }

  protected open(person: Person): void {
    this.state.focusedKey.set(person.id);
    this.navigator.open(person.id);
  }

  protected showMore(): void {
    this.state.showMore(this.query.queryKey());
  }
}
