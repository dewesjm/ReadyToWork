import { Component, computed, input, output } from '@angular/core';
import { ANNOUNCEMENT_CONFIG, AnnouncementType } from '../../../core';
import { Icon } from '../icon/icon';

/** Strip colors per daisyUI color; full class names so Tailwind keeps them. */
const STRIP_CLASSES = {
  error: 'bg-error text-error-content',
  warning: 'bg-warning text-warning-content',
  info: 'bg-info text-info-content',
};

/** One notice as the banner shows it: color, icon, type word, message, and a close button. */
@Component({
  selector: 'rtw-announcement-strip',
  imports: [Icon],
  template: `
    <div class="flex items-start gap-2 px-4 py-2 text-sm sm:px-6" [class]="classes()" [attr.data-type]="type()">
      <rtw-icon [name]="meta().icon" class="mt-0.5 size-4" />
      <p class="min-w-0 grow break-words"><strong>{{ meta().label }}</strong> · {{ message() }}</p>
      @if (closable()) {
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-square -my-0.5 text-current"
          data-testid="dismiss"
          [attr.aria-label]="'Close this ' + meta().label.toLowerCase() + ' notice'"
          (click)="closed.emit()"
        >
          <rtw-icon name="x" />
        </button>
      }
    </div>
  `,
})
export class AnnouncementStrip {
  readonly type = input.required<AnnouncementType>();
  readonly message = input.required<string>();
  readonly closable = input(false);
  readonly closed = output();

  protected readonly meta = computed(() => ANNOUNCEMENT_CONFIG.types[this.type()]);
  protected readonly classes = computed(() => STRIP_CLASSES[this.meta().color]);
}
