import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { DEFAULT_CONFIG } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { ReadinessQueryService } from './readiness-query-service';

/** "Categories" button with a checkbox list; picks which categories count as issues. */
@Component({
  selector: 'rtw-category-filter',
  imports: [Icon],
  template: `
    <button
      type="button"
      class="btn btn-sm gap-1"
      [class.btn-active]="picked().length > 0"
      [disabled]="disabled()"
      [attr.aria-expanded]="open()"
      aria-controls="category-filter-panel"
      (click)="open.set(!open())"
    >
      <rtw-icon name="funnel" />
      {{ buttonLabel() }}
      <rtw-icon name="chevron-down" class="size-3" />
    </button>
    @if (open() && !disabled()) {
      <div
        id="category-filter-panel"
        class="absolute left-0 z-40 mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
        role="group"
        aria-label="Categories that count as issues"
      >
        @for (c of categories; track c.id) {
          <label class="flex cursor-pointer items-center gap-2 rounded-field px-2 py-1.5 text-sm hover:bg-base-200">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              [checked]="picked().includes(c.id)"
              [attr.data-category]="c.id"
              (change)="query.toggleCategory(c.id)"
            />
            <rtw-icon [name]="c.icon" />
            {{ c.label }}
          </label>
        }
      </div>
    }
  `,
  host: {
    class: 'relative',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'open.set(false)',
  },
})
export class CategoryFilter {
  readonly disabled = input(false);
  protected readonly query = inject(ReadinessQueryService);
  protected readonly categories = DEFAULT_CONFIG.categories;
  protected readonly open = signal(false);
  protected readonly picked = this.query.categories;
  protected readonly buttonLabel = computed(() => {
    const n = this.picked().length;
    if (n === 0) return 'All categories';
    if (n === 1) return this.categories.find((c) => c.id === this.picked()[0])?.label ?? '1 category';
    return `${n} categories`;
  });
  private readonly host = inject(ElementRef<HTMLElement>);

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }
}
