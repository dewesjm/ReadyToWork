import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AvatarMenu } from '../avatar-menu/avatar-menu';

/** Top bar (brand, main navigation, avatar menu) around the routed page. */
@Component({
  selector: 'rtw-app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, AvatarMenu],
  templateUrl: './app-shell.html',
  host: { class: 'flex min-h-dvh flex-col bg-base-200 text-base-content' },
})
export class AppShell {
  protected readonly links = [
    { path: '/tree', label: 'Org tree' },
    { path: '/issues', label: 'Issues' },
    { path: '/admin', label: 'Admin' },
  ];
}
