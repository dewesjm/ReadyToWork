import { Component, computed, inject } from '@angular/core';
import { ANNOUNCEMENT_CONFIG, Announcement, activeAnnouncements, dismissKey } from '../../../core';
import { ClockService } from '../../services/clock-service';
import { SettingsService } from '../../services/settings-service';
import { AnnouncementStrip } from './announcement-strip';

/**
 * The admins' live notices, full width under the top bar on every page: outages first. Info and
 * Delayed notices can be closed; the viewer's preferences remember it until the notice is edited.
 */
@Component({
  selector: 'rtw-announcement-banner',
  imports: [AnnouncementStrip],
  template: `
    <section aria-label="Announcements" aria-live="polite">
      @for (n of notices(); track n.id) {
        <rtw-announcement-strip
          data-testid="announcement"
          [attr.data-type]="n.type"
          [type]="n.type"
          [message]="n.message"
          [closable]="ANNOUNCEMENT_CONFIG.types[n.type].dismissible"
          (closed)="dismiss(n)"
        />
      }
    </section>
  `,
})
export class AnnouncementBanner {
  private readonly settings = inject(SettingsService);
  private readonly clock = inject(ClockService);
  protected readonly ANNOUNCEMENT_CONFIG = ANNOUNCEMENT_CONFIG;

  protected readonly notices = computed(() => {
    const dismissed = new Set(this.settings.preferences().dismissedAnnouncements);
    return activeAnnouncements(this.settings.settings().announcements, this.clock.today()).filter(
      (a) => !(ANNOUNCEMENT_CONFIG.types[a.type].dismissible && dismissed.has(dismissKey(a))),
    );
  });

  protected dismiss(a: Announcement): void {
    // Keep only keys for notices that still exist, so the list doesn't grow forever.
    const current = new Set(this.settings.settings().announcements.map(dismissKey));
    const kept = this.settings.preferences().dismissedAnnouncements.filter((k) => current.has(k));
    this.settings.updatePreferences({ dismissedAnnouncements: [...kept, dismissKey(a)] });
  }
}
