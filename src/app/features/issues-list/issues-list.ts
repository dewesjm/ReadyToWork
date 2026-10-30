import { Component, ElementRef, afterNextRender, computed, inject } from '@angular/core';
import { DEFAULT_CONFIG, ListRow, describeDays, formatDate } from '../../../core';
import { SettingsService } from '../../services/settings-service';
import { Highlight } from '../../shared/highlight';
import { StatusBadge } from '../../shared/status/status-badge';
import { ListStateService } from '../readiness/list-state-service';
import { PersonNavigator } from '../readiness/person-navigator';
import { ReadinessEmpty } from '../readiness/readiness-empty';
import { READINESS_PAGE_CONFIG } from '../readiness/readiness-page-config';
import { ReadinessQueryService } from '../readiness/readiness-query-service';

/**
 * The Readiness page's list view: one row per check, soonest first, under the same query as the
 * tree. A table on wide screens, cards on phones. Shows a page of rows at a time.
 */
@Component({
  selector: 'rtw-issues-list',
  imports: [Highlight, StatusBadge, ReadinessEmpty],
  templateUrl: './issues-list.html',
})
export class IssuesList {
  protected readonly query = inject(ReadinessQueryService);
  private readonly navigator = inject(PersonNavigator);
  private readonly state = inject(ListStateService);
  private readonly settings = inject(SettingsService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly keyword = computed(() => this.query.keyword().trim());
  /** The person open in the dashboard panel; their rows are highlighted. */
  protected readonly selectedId = this.navigator.panelPersonId;
  /** With the panel open the list is narrower: manager and category fold into other columns. */
  protected readonly compact = computed(() => this.selectedId() !== null);

  private readonly limit = computed(() => this.state.limit(this.query.queryKey()));
  protected readonly total = computed(() => this.query.listResult().rows.length);

  protected readonly rows = computed(() => {
    const programs = new Map(this.settings.settings().programs.map((p) => [p.id, p.name]));
    return this.query
      .listResult()
      .rows.slice(0, this.limit())
      .map((r) => ({
        ...r,
        key: rowKey(r),
        category:
          DEFAULT_CONFIG.categories.find((c) => c.id === r.check.category)?.label ?? r.check.category,
        due: r.check.dueDate ? formatDate(r.check.dueDate) : '—',
        days: r.check.daysRemaining === undefined ? '—' : describeDays(r.check.daysRemaining),
        requiredBy: r.check.requiredBy.map((id) => programs.get(id) ?? id).join(', '),
      }));
  });

  /** How many rows "Show more" adds: a page, or what's left. */
  protected readonly nextCount = computed(() =>
    Math.min(READINESS_PAGE_CONFIG.listPageSize, this.total() - this.rows().length),
  );

  protected readonly moreText = computed(() => {
    const shown = this.rows().length;
    return `Showing ${shown.toLocaleString('en-US')} of ${this.total().toLocaleString('en-US')} checks`;
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

  protected open(row: ListRow): void {
    this.state.focusedKey.set(rowKey(row));
    this.navigator.open(row.person.id);
  }

  protected showMore(): void {
    this.state.showMore(this.query.queryKey());
  }
}

function rowKey(r: ListRow): string {
  return `${r.person.id}|${r.check.itemId}`;
}
