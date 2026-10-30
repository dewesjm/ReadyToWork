import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CategoryConfig, DEFAULT_CONFIG } from '../../../core';
import { MAX_WARNING_DAYS, clearWarningDays, setWarningDays, warningDaysProblem } from '../../../data';
import { SettingsService } from '../../services/settings-service';
import { Icon } from '../../shared/icon/icon';
import { AdminService } from './admin-service';

/** Pause after typing before a warning window applies. */
export const THRESHOLD_APPLY_MS = 400;

/** Warning window per category: how many days before its date an item turns yellow. */
@Component({
  selector: 'rtw-thresholds',
  imports: [Icon],
  template: `
    <p class="mb-4 max-w-prose text-sm opacity-80">
      How many days before its date an item turns yellow (Expiring). Changes apply everywhere as
      you type.
    </p>
    <ul class="max-w-2xl divide-y divide-base-300 rounded-box border border-base-300 bg-base-100">
      @for (row of rows(); track row.category.id) {
        <li class="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2" [attr.data-category]="row.category.id">
          <label class="flex min-w-48 grow items-center gap-2 font-medium" [for]="'warn-' + row.category.id">
            <rtw-icon [name]="row.category.icon" class="opacity-70" />
            {{ row.category.label }}
          </label>
          <span class="flex items-center gap-2">
            <input
              type="number"
              inputmode="numeric"
              min="0"
              [max]="max"
              step="1"
              class="input input-sm w-24"
              [id]="'warn-' + row.category.id"
              [value]="row.days"
              [attr.aria-invalid]="problems()[row.category.id] ? true : null"
              [attr.aria-describedby]="'warn-' + row.category.id + '-note'"
              (input)="typed(row.category, $any($event.target).value)"
              (blur)="flush(row.category.id)"
              (keydown.enter)="flush(row.category.id)"
            />
            <span class="text-sm">days</span>
          </span>
          <span class="flex w-44 items-center gap-2 text-xs" [id]="'warn-' + row.category.id + '-note'">
            @if (problems()[row.category.id]; as problem) {
              <span class="text-error">{{ problem }}</span>
            } @else if (row.overridden) {
              <span class="opacity-70">Default {{ row.category.warningDays }}</span>
              <button
                type="button"
                class="btn btn-ghost btn-xs"
                [attr.aria-label]="'Use the default for ' + row.category.label"
                (click)="useDefault(row.category)"
              >
                <rtw-icon name="rotate-ccw" class="size-3" /> Use default
              </button>
            } @else {
              <span class="opacity-70">Default</span>
            }
          </span>
        </li>
      }
    </ul>
  `,
})
export class Thresholds implements OnDestroy {
  private readonly admin = inject(AdminService);
  private readonly settings = inject(SettingsService);
  private readonly timers = new Map<string, { timer: ReturnType<typeof setTimeout>; apply: () => void }>();
  protected readonly max = MAX_WARNING_DAYS;
  protected readonly problems = signal<Record<string, string | null>>({});

  protected readonly rows = computed(() => {
    const overrides = this.settings.settings().warningDays;
    return DEFAULT_CONFIG.categories.map((category) => ({
      category,
      days: overrides[category.id] ?? category.warningDays,
      overridden: overrides[category.id] !== undefined,
    }));
  });

  protected typed(category: CategoryConfig, text: string): void {
    const days = text.trim() === '' ? NaN : Number(text);
    const problem = warningDaysProblem(days);
    this.problems.update((p) => ({ ...p, [category.id]: problem }));
    this.cancel(category.id);
    if (problem) return;
    const apply = () => {
      this.timers.delete(category.id);
      this.admin.edit((s) =>
        days === category.warningDays ? clearWarningDays(s, category.id) : setWarningDays(s, category.id, days),
      );
    };
    this.timers.set(category.id, { timer: setTimeout(apply, THRESHOLD_APPLY_MS), apply });
  }

  /** Applies a pending change now (leaving the field or pressing Enter). */
  protected flush(id: string): void {
    const pending = this.timers.get(id);
    if (!pending) return;
    clearTimeout(pending.timer);
    pending.apply();
  }

  protected useDefault(category: CategoryConfig): void {
    this.cancel(category.id);
    this.problems.update((p) => ({ ...p, [category.id]: null }));
    this.admin.edit((s) => clearWarningDays(s, category.id));
  }

  ngOnDestroy(): void {
    for (const id of [...this.timers.keys()]) this.flush(id);
  }

  private cancel(id: string): void {
    clearTimeout(this.timers.get(id)?.timer);
    this.timers.delete(id);
  }
}
