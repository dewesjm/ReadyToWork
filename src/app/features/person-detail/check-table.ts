import { Component, computed, input } from '@angular/core';
import {
  Check,
  DEFAULT_CONFIG,
  IsoDate,
  describeDays,
  describeSynced,
  formatDate,
  sourceLabel,
} from '../../../core';
import { StatusBadge } from '../../shared/status/status-badge';

/**
 * A person's checks, in the order given. A table on wide pages; stacked cards on phones and in
 * the narrow dashboard panel, so nothing scrolls sideways.
 */
@Component({
  selector: 'rtw-check-table',
  imports: [StatusBadge],
  templateUrl: './check-table.html',
})
export class CheckTable {
  readonly checks = input.required<Check[]>();
  readonly today = input.required<IsoDate>();
  /** Program names by id, for "Required by". */
  readonly programNames = input<ReadonlyMap<string, string>>(new Map());
  /** Allow the table layout on wide screens; otherwise always cards. */
  readonly wide = input(true);

  protected readonly rows = computed(() =>
    this.checks().map((c) => ({
      check: c,
      category: DEFAULT_CONFIG.categories.find((k) => k.id === c.category)?.label ?? c.category,
      due: c.dueDate ? formatDate(c.dueDate) : '—',
      days: c.daysRemaining === undefined ? '—' : describeDays(c.daysRemaining),
      source: sourceLabel(c.source),
      synced: c.lastSynced ? describeSynced(c.lastSynced, this.today()) : '—',
      syncedDate: c.lastSynced ? formatDate(c.lastSynced) : null,
      requiredBy: c.requiredBy.map((id) => this.programNames().get(id) ?? id).join(', '),
    })),
  );
}
