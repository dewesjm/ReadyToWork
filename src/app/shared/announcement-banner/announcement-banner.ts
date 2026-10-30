import { Component, computed, inject } from '@angular/core';
import { ANNOUNCEMENT_CONFIG, Announcement, activeAnnouncements, dismissKey } from '../../../core';
import { ClockService } from '../../services/clock-service';
import { SettingsService } from '../../services/settings-service';
import { Icon } from '../icon/icon';

/** Strip colors per daisyUI color; full class names so Tailwind keeps them. */
const STRIP_CLASSES = {
  error: 'bg-error text-error-content',
  warning: 'bg-warning text-warning-content',
  info: 'bg-info text-info-content',
};

/**
 * The admins' live notices, full width under the top bar on every page: outages first. Info and
 * Delayed notices can be closed; the viewer's preferences remember it until the notice is edited.
 */
@Component({
  selector: 'rtw-announcement-banner',
  imports: [Icon],
  template: `
    <section aria-label="Announcements" aria-live="polite">
      @for (n of notices(); track n.id) {
        <div
          class="flex items-start gap-2 px-4 py-2 text-sm sm:px-6"
          [class]="n.classes"
          data-testid="announcement"
          [attr.data-type]="n.type"
        >
          <rtw-icon [name]="n.meta.icon" class="mt-0.5 size-4" />
          <p class="min-w-0 grow"><strong>{{ n.meta.label }}</strong> · {{ n.message }}</p>
          @if (n.meta.dismissible) {
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-square -my-0.5 text-current"
              data-testid="dismiss"
              [attr.aria-label]="'Close this ' + n.meta.label.toLowerCase() + ' notice'"
              (click)="dismiss(n)"
            >
              <rtw-icon name="x" />
            </button>
          }
        </div>
      }
    </section>
  `,
})
export class AnnouncementBanner {
  private readonly settings = inject(SettingsService);
  private readonly clock = inject(ClockService);

  protected readonly notices = computed(() => {
    const dismissed = new Set(this.settings.preferences().dismissedAnnouncements);
    return activeAnnouncements(this.settings.settings().announcements, this.clock.today())
      .map((a) => ({ ...a, meta: ANNOUNCEMENT_CONFIG.types[a.type] }))
      .filter((a) => !(a.meta.dismissible && dismissed.has(dismissKey(a))))
      .map((a) => ({ ...a, classes: STRIP_CLASSES[a.meta.color] }));
  });

  protected dismiss(a: Announcement): void {
    // Keep only keys for notices that still exist, so the list doesn't grow forever.
    const current = new Set(this.settings.settings().announcements.map(dismissKey));
    const kept = this.settings.preferences().dismissedAnnouncements.filter((k) => current.has(k));
    this.settings.updatePreferences({ dismissedAnnouncements: [...kept, dismissKey(a)] });
  }
}
