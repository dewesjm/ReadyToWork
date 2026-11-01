import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Component, computed, inject, input, signal } from '@angular/core';
import { DEFAULT_CONFIG } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { ReadinessQueryService } from './readiness-query-service';

/** "Categories" button with a checkbox list; picks which categories count as issues. */
@Component({
  selector: 'rtw-category-filter',
  imports: [Icon, CdkOverlayOrigin, CdkConnectedOverlay],
  template: `
    <button
      type="button"
      class="btn btn-sm gap-1"
      cdkOverlayOrigin
      #trigger="cdkOverlayOrigin"
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
    <!-- Angular CDK overlay: positions the panel; a click outside or Escape closes it. -->
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="open() && !disabled()"
      cdkConnectedOverlayHasBackdrop
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="open.set(false)"
      (detach)="open.set(false)"
    >
      <div
        id="category-filter-panel"
        class="mt-1 w-64 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
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
    </ng-template>
  `,
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
}
