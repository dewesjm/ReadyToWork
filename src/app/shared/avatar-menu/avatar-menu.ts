import { NgTemplateOutlet } from '@angular/common';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, computed, inject, signal } from '@angular/core';
import { supervisorOptions } from '../../../core';
import { Layout } from '../../../data';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { ThemeService } from '../../services/theme-service';
import { ViewerService } from '../../services/viewer-service';
import { supervisorChoices } from '../supervisor-choices';
import { BRAND_THEMES, BUILT_IN_THEMES } from '../themes';

/**
 * Top-right button with the viewer's initials; opens a menu with who you are, Preferences (View as, default scope for the Readiness page, layout) and the theme list.
 */
@Component({
  selector: 'rtw-avatar-menu',
  imports: [NgTemplateOutlet, CdkOverlayOrigin, CdkConnectedOverlay],
  templateUrl: './avatar-menu.html',
})
export class AvatarMenu {
  protected readonly themes = inject(ThemeService);
  protected readonly viewer = inject(ViewerService);
  protected readonly brandThemes = BRAND_THEMES;
  protected readonly builtInThemes = BUILT_IN_THEMES;
  protected readonly open = signal(false);
  /** Below the button, right edges lined up. */
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  ];

  private readonly settings = inject(SettingsService);
  private readonly readiness = inject(ReadinessService);
  protected readonly personas = this.readiness.personas;
  protected readonly layout = computed(() => this.settings.preferences().layout);
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

  setPersona(id: string): void {
    this.viewer.setPersona(id);
  }

  setLayout(layout: Layout): void {
    this.settings.updatePreferences({ layout });
  }

  setDefaultProgram(id: string): void {
    this.settings.updatePreferences({ defaultProgramId: id || null });
  }
}
