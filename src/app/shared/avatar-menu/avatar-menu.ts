import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, computed, inject, signal } from '@angular/core';
import { supervisorOptions } from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { ThemeService } from '../../services/theme-service';
import { ViewerService } from '../../services/viewer-service';
import { supervisorChoices } from '../supervisor-choices';
import { BRAND_THEMES, BUILT_IN_THEMES } from '../themes';

/**
 * Top-right button with the viewer's initials; opens a menu with who you are, Preferences
 * (default scope for the Readiness page) and the theme list.
 */
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

  private readonly settings = inject(SettingsService);
  private readonly readiness = inject(ReadinessService);
  protected readonly programs = computed(() => this.settings.settings().programs);
  protected readonly supervisors = computed(() => {
    const v = this.viewer.viewer();
    if (!v) return [];
    const options = supervisorOptions(this.readiness.result().org, v);
    return supervisorChoices(options, v.personId);
  });
  /** The saved default if it is still one of the choices, else the viewer. */
  protected readonly defaultSupervisorId = computed(() => {
    const saved = this.settings.preferences().defaultSupervisorId;
    return this.supervisors().some((s) => s.id === saved) ? saved : this.viewer.viewer()?.personId;
  });
  protected readonly defaultProgramId = computed(() => {
    const saved = this.settings.preferences().defaultProgramId;
    return this.programs().some((p) => p.id === saved) ? saved : null;
  });

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

  setDefaultSupervisor(id: string): void {
    this.settings.updatePreferences({
      defaultSupervisorId: id === this.viewer.viewer()?.personId ? null : id,
    });
  }

  setDefaultProgram(id: string): void {
    this.settings.updatePreferences({ defaultProgramId: id || null });
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
