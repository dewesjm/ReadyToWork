import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ANNOUNCEMENT_CONFIG,
  Announcement,
  announcementState,
  describeSchedule,
  setAnnouncementOn,
} from '../../../core';
import { ClockService } from '../../services/clock-service';
import { AnnouncementStrip } from '../../shared/announcement-banner/announcement-strip';
import { Icon } from '../../shared/icon/icon';
import { AdminService } from './admin-service';

/** Every notice as it looks in the banner, with when it shows, an On switch and Edit. */
@Component({
  selector: 'rtw-announcement-list',
  imports: [RouterLink, AnnouncementStrip, Icon],
  template: `
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <p class="max-w-prose text-sm opacity-80">
        Notices show in a banner at the top of every page while they are on and within their
        dates. Use them for outages and delays. Viewers can't close them.
      </p>
      <a routerLink="new" class="btn btn-sm btn-primary" data-testid="new-announcement">
        <rtw-icon name="plus" /> New announcement
      </a>
    </div>

    <ul class="space-y-3">
      @for (a of rows(); track a.id) {
        <li class="card card-sm border border-base-300 bg-base-100" [attr.data-announcement]="a.id">
          <rtw-announcement-strip class="overflow-hidden rounded-t-box" [type]="a.type" [message]="a.message" />
          <div class="card-body flex-row flex-wrap items-center gap-x-4 gap-y-2">
            <span class="badge badge-outline" data-testid="state">{{ a.stateLabel }}</span>
            <span class="text-sm opacity-80">{{ a.schedule }}</span>
            <label class="ml-auto flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                class="toggle toggle-sm"
                data-testid="on"
                [checked]="a.on"
                (change)="setOn(a, $any($event.target).checked)"
              />
              On
            </label>
            <a class="btn btn-sm" [routerLink]="a.id" [attr.aria-label]="'Edit ' + a.typeLabel + ' notice: ' + a.message">
              Edit
            </a>
          </div>
        </li>
      } @empty {
        <li class="opacity-70" data-testid="no-announcements">No announcements. The banner is hidden.</li>
      }
    </ul>
  `,
})
export class AnnouncementList {
  private readonly admin = inject(AdminService);
  private readonly clock = inject(ClockService);

  protected readonly rows = computed(() =>
    this.admin.announcements().map((a) => ({
      ...a,
      typeLabel: ANNOUNCEMENT_CONFIG.types[a.type].label,
      stateLabel: ANNOUNCEMENT_CONFIG.states[announcementState(a, this.clock.today())],
      schedule: describeSchedule(a),
    })),
  );

  protected setOn(a: Announcement, on: boolean): void {
    this.admin.editAnnouncements((list) => setAnnouncementOn(list, a.id, on));
  }
}
