import { Component, ElementRef, afterNextRender, computed, inject } from '@angular/core';
import { DEFAULT_CONFIG, Person, categoryConfig, countText, describeDays } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { Highlight } from '../../shared/highlight';
import { Icon } from '../../shared/icon/icon';
import { StatusBadge } from '../../shared/status/status-badge';
import { ListStateService } from '../readiness/list-state-service';
import { ItemsToggle } from '../readiness/items-toggle';
import { OpenItemsService } from '../readiness/open-items-service';
import { PersonItems } from '../readiness/person-items';
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
  imports: [Highlight, Icon, StatusBadge, ReadinessEmpty, PersonItems, ItemsToggle],
  templateUrl: './issues-list.html',
})
export class IssuesList {
  protected readonly query = inject(ReadinessQueryService);
  private readonly navigator = inject(PersonNavigator);
  private readonly state = inject(ListStateService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly readiness = inject(ReadinessService);
  protected readonly items = inject(OpenItemsService);

  protected readonly keyword = computed(() => this.query.keyword().trim());
  /** The person open in the dashboard panel; their row is highlighted. */
  protected readonly selectedId = this.navigator.panelPersonId;
  /** With the panel open the list is narrower: manager folds under the name, cells show icons. */
  protected readonly compact = computed(() => this.selectedId() !== null);

  protected readonly columns = computed(() =>
    this.query.listResult().columns.map((id) => {
      const c = categoryConfig(id);
      return { id, label: c?.label ?? id, icon: c?.icon ?? 'info' };
    }),
  );

  /** Person and manager, the category columns, and overall: for an item row spanning them all. */
  protected readonly columnCount = computed(() => this.columns().length + (this.compact() ? 2 : 3));

  private readonly limit = computed(() => this.state.limit(this.query.queryKey()));
  protected readonly total = computed(() => this.query.listResult().rows.length);

  protected readonly rows = computed(() => {
    const columns = this.columns();
    const { checksByPerson } = this.readiness.result();
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
        issueCount: (checksByPerson.get(r.person.id) ?? []).filter((c) => c.status !== 'ready').length,
        itemsOpen: this.items.isOpen(r.person.id),
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
      const key = this.state.focusedPersonId();
      if (!key) return;
      // Only once: switching views later must not jump back down to this row.
      this.state.focusedPersonId.set(null);
      // The table and the cards are both in the page; focus whichever one is displayed.
      const buttons = [...this.host.nativeElement.querySelectorAll<HTMLElement>(`[data-key="${key}"] button`)];
      (buttons.find((b) => b.getClientRects().length > 0) ?? buttons[0])?.focus();
    });
  }

  protected open(person: Person): void {
    // The panel keeps the list on screen, so there is nothing to come back to.
    if (!this.navigator.usePanel()) this.state.focusedPersonId.set(person.id);
    this.navigator.open(person.id);
  }

  protected issueText(n: number): string {
    return countText(n, 'issue');
  }

  protected showMore(): void {
    this.state.showMore(this.query.queryKey());
  }
}
