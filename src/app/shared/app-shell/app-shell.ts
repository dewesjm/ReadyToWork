import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ViewerService } from '../../services/viewer-service';
import { AvatarMenu } from '../avatar-menu/avatar-menu';

/** Top bar (brand, main navigation, avatar menu) around the routed page. */
@Component({
  selector: 'rtw-app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AvatarMenu],
  templateUrl: './app-shell.html',
  host: { class: 'flex min-h-dvh flex-col bg-base-200 text-base-content' },
})
export class AppShell {
  private readonly viewer = inject(ViewerService);
  /** Admin shows only for the admin persona. */
  protected readonly links = computed(() => [
    { path: '/readiness', label: 'Readiness' },
    ...(this.viewer.isAdmin() ? [{ path: '/admin', label: 'Admin' }] : []),
  ]);
}
