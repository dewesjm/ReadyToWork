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
    this.checks().map((c) => {
      const config = DEFAULT_CONFIG.categories.find((k) => k.id === c.category);
      return {
        check: c,
        dueLine: dueLine(c),
        category: config?.label ?? c.category,
        // The course or qual ID of a held item (a missing item's label already has it).
        itemId:
          config?.showsItemId && c.source !== 'program' && !c.itemName.includes(c.itemId) ? c.itemId : null,
        due: c.dueDate ? formatDate(c.dueDate) : '—',
        days: c.daysRemaining === undefined ? '—' : describeDays(c.daysRemaining),
        source: sourceLabel(c.source),
        synced: c.lastSynced ? describeSynced(c.lastSynced, this.today()) : '—',
        syncedDate: c.lastSynced ? formatDate(c.lastSynced) : null,
        requiredBy: c.requiredBy.map((id) => this.programNames().get(id) ?? id).join(', '),
      };
    }),
  );
}

/** Card line under the reason: "Due Dec 1, 2026 · 12 days", or just "12 days left" when the
 *  reason already names the date. Null when there is no due date. */
function dueLine(c: Check): string | null {
  if (!c.dueDate || c.daysRemaining === undefined) return null;
  const due = formatDate(c.dueDate);
  const days = describeDays(c.daysRemaining);
  if (!c.reason.includes(due)) return `Due ${due} · ${days}`;
  return c.daysRemaining > 0 ? `${days} left` : days;
}
