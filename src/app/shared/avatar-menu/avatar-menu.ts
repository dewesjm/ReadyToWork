import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, inject, signal } from '@angular/core';
import { ThemeService } from '../../services/theme-service';
import { ViewerService } from '../../services/viewer-service';
import { BRAND_THEMES, BUILT_IN_THEMES } from '../themes';

/** Top-right button with the viewer's initials; opens a menu with who you are and the theme list. */
@Component({
  selector: 'rtw-avatar-menu',
  imports: [NgTemplateOutlet],
  templateUrl: './avatar-menu.html',
  host: {
    class: 'relative',
    '(document:click)': 'onDocumentClick($event)',
    '(keydown.escape)': 'close()',
  },
})
export class AvatarMenu {
  protected readonly themes = inject(ThemeService);
  protected readonly viewer = inject(ViewerService);
  protected readonly brandThemes = BRAND_THEMES;
  protected readonly builtInThemes = BUILT_IN_THEMES;
  protected readonly open = signal(false);

  private readonly host = inject(ElementRef<HTMLElement>);

  toggle(): void {
    this.open.update((o) => !o);
  }

  close(): void {
    this.open.set(false);
  }

  pick(id: string): void {
    this.themes.set(id);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
