import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ScreenService } from '../../services/screen-service';
import { SettingsService } from '../../services/settings-service';
import { ReadinessQueryService } from './readiness-query-service';

/**
 * Opens a person from the Readiness page the way the chosen layout says: in the side panel
 * (Dashboard, wide screen) or as their own page (Drill-down, or any narrow screen).
 */
@Injectable()
export class PersonNavigator {
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);
  private readonly screen = inject(ScreenService);
  private readonly query = inject(ReadinessQueryService);

  readonly usePanel = computed(
    () => this.settings.preferences().layout === 'dashboard' && this.screen.wide(),
  );

  /** The person shown in the panel, or null when there is no panel. */
  readonly panelPersonId = computed(() => (this.usePanel() ? this.query.personId() : null));

  open(id: string): void {
    if (this.usePanel()) this.query.openPerson(id);
    else void this.router.navigate(['/person', id]);
  }

  close(): void {
    this.query.closePerson();
  }
}
