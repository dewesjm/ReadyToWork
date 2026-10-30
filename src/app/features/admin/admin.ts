import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ViewerService } from '../../services/viewer-service';

/** Admin page: section tabs around the routed section. Only the admin persona gets past the notice. */
@Component({
  selector: 'rtw-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <h1 class="text-2xl font-semibold">Admin</h1>
    @if (viewer.isAdmin()) {
      <nav class="tabs tabs-border mt-3 mb-5" aria-label="Admin sections">
        @for (s of sections; track s.path) {
          <a
            class="tab"
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
  protected readonly sections = [
    { path: 'programs', label: 'Programs' },
    { path: 'thresholds', label: 'Thresholds' },
    { path: 'file', label: 'Settings file' },
  ];
}
