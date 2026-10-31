import { Component, computed, inject, input, signal } from '@angular/core';
import { DEFAULT_CONFIG, dueLine, itemGroups, shownItemId } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { Icon } from '../../shared/icon/icon';
import { StatusBadge } from '../../shared/status/status-badge';

/**
 * A person's items shown in place under their row: issues first, grouped by category, with
 * "Show all" for the ready ones. The same wording as Details.
 */
@Component({
  selector: 'rtw-person-items',
  imports: [Icon, StatusBadge],
  template: `
    <div class="space-y-2" data-testid="person-items" [attr.data-person]="personId()">
      @for (g of groups(); track g.category) {
        <div [attr.data-category]="g.category">
          <h4 class="flex items-center gap-1 text-xs font-semibold uppercase opacity-70">
            <rtw-icon [name]="g.icon" class="size-3" /> {{ g.label }}
          </h4>
          <ul class="mt-1 space-y-1">
            @for (c of g.items; track c.check.itemId) {
              <li class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm" [attr.data-item]="c.check.itemId">
                <rtw-status-badge class="w-24 shrink-0" [status]="c.check.status" [compact]="true" />
                <span class="font-medium">
                  {{ c.check.itemName }}
                  @if (c.itemId) {
                    <span class="text-xs font-normal opacity-70">· {{ c.itemId }}</span>
                  }
                </span>
                <span class="opacity-80">{{ c.check.reason }}</span>
                @if (c.due) {
                  <span class="opacity-70">{{ c.due }}</span>
                }
                @if (c.requiredBy) {
                  <span class="text-xs opacity-70">Required by {{ c.requiredBy }}</span>
                }
              </li>
            }
          </ul>
        </div>
      } @empty {
        <p class="text-sm opacity-70">No issues: everything is ready.</p>
      }
      @if (total() > issueCount()) {
        <button type="button" class="btn btn-ghost btn-xs" data-testid="show-all-items" (click)="showAll.set(!showAll())">
          {{ showAll() ? 'Show issues only' : 'Show all ' + total() + ' items' }}
        </button>
      }
    </div>
  `,
})
export class PersonItems {
  readonly personId = input.required<string>();

  private readonly readiness = inject(ReadinessService);
  private readonly settings = inject(SettingsService);
  protected readonly showAll = signal(false);

  private readonly checks = computed(() => this.readiness.result().checksByPerson.get(this.personId()) ?? []);
  protected readonly total = computed(() => this.checks().length);
  protected readonly issueCount = computed(() => this.checks().filter((c) => c.status !== 'ready').length);

  protected readonly groups = computed(() => {
    const programs = new Map(this.settings.settings().programs.map((p) => [p.id, p.name]));
    return itemGroups(this.checks(), DEFAULT_CONFIG.categories, !this.showAll()).map((g) => ({
      ...g,
      items: g.checks.map((c) => ({
        check: c,
        itemId: shownItemId(c, DEFAULT_CONFIG.categories),
        due: dueLine(c),
        requiredBy: c.requiredBy.map((id) => programs.get(id) ?? id).join(', '),
      })),
    }));
  });
}
