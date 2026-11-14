import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ViewerService } from '../../services/viewer-service';
import { Icon } from '../../shared/icon/icon';
import { AdminService } from './admin-service';

/**
 * Admin page: section tabs around the routed section, and the "Saved" note after each edit.
 * Admin and Developer get past the notice.
 */
@Component({
  selector: 'rtw-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
  template: `
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-semibold">Admin</h1>
      <span role="status" class="text-sm text-success" data-testid="saved-note">
        @if (admin.saved()) {
          <rtw-icon name="check" class="size-4" /> Saved
        }
      </span>
    </div>
    @if (viewer.isAdmin()) {
      <nav class="tabs tabs-border mt-3 mb-5 flex-nowrap overflow-x-auto" aria-label="Admin sections">
        @for (s of sections(); track s.path) {
          <a
            class="tab shrink-0 text-base-content/80"
            [routerLink]="s.path"
            routerLinkActive="tab-active"
            ariaCurrentWhenActive="page"
            >{{ s.label }}</a
          >
        }
      </nav>
      <router-outlet />
    } @else {
      <div role="alert" class="alert mt-4 max-w-xl" data-testid="admins-only">
        <span
          >The Admin screens are for admins. To see them, choose the Admin persona under
          <strong>View as</strong> in the avatar menu.</span
        >
      </div>
    }
  `,
})
export class Admin {
  protected readonly viewer = inject(ViewerService);
  protected readonly admin = inject(AdminService);
  protected readonly sections = computed(() => [
    { path: 'programs', label: 'Programs' },
    { path: 'thresholds', label: 'Thresholds' },
    { path: 'announcements', label: 'Announcements' },
    { path: 'file', label: 'Settings file' },
    ...(this.viewer.canRunServices() ? [{ path: 'services', label: 'Services' }] : []),
  ]);
}
