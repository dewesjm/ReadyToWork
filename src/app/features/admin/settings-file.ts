import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Settings, SettingsError, describeSettings } from '../../../data';
import { ClockService } from '../../services/clock-service';
import { SettingsService } from '../../services/settings-service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { Icon } from '../../shared/icon/icon';
import { AdminService } from './admin-service';

/** Export, import and reset the admin settings (programs, assignments, warning windows). */
@Component({
  selector: 'rtw-settings-file',
  imports: [ConfirmDialog, Icon],
  template: `
    <p class="mb-4 max-w-prose text-sm opacity-80">
      Settings are kept in this browser only. To share your programs, assignments and warning
      windows, export them to a file and import it on another browser. Your own preferences
      (theme, layout, default scope) are not in the file.
    </p>
    <p class="mb-4 text-sm">Now: <span data-testid="current-summary">{{ current() }}</span></p>

    <div class="grid max-w-3xl gap-3 md:grid-cols-3">
      <section class="card card-sm border border-base-300 bg-base-100">
        <div class="card-body">
          <h2 class="card-title text-base">Export</h2>
          <p class="text-sm opacity-70">Download the settings as a JSON file.</p>
          <button type="button" class="btn btn-sm btn-primary" data-testid="export" (click)="exportFile()">
            <rtw-icon name="download" /> Export
          </button>
        </div>
      </section>

      <section class="card card-sm border border-base-300 bg-base-100">
        <div class="card-body">
          <h2 class="card-title text-base">Import</h2>
          <p class="text-sm opacity-70">Replace the settings with ones from a file.</p>
          <input
            #fileInput
            type="file"
            accept=".json,application/json"
            class="sr-only"
            tabindex="-1"
            aria-hidden="true"
            data-testid="import-input"
            (change)="picked($event)"
          />
          <button type="button" class="btn btn-sm" data-testid="import" (click)="fileInput.click()">
            <rtw-icon name="upload" /> Import a file
          </button>
        </div>
      </section>

      <section class="card card-sm border border-base-300 bg-base-100">
        <div class="card-body">
          <h2 class="card-title text-base">Reset</h2>
          <p class="text-sm opacity-70">Go back to the shipped programs, assignments and windows.</p>
          <button type="button" class="btn btn-sm btn-outline btn-error" data-testid="reset" (click)="askReset()">
            <rtw-icon name="rotate-ccw" /> Reset to defaults
          </button>
        </div>
      </section>
    </div>

    @if (error(); as e) {
      <div role="alert" class="alert alert-error mt-4 max-w-3xl" data-testid="import-error">
        <rtw-icon name="circle-x" />
        <span><strong>{{ e.file }}</strong> was not imported: {{ e.message }} Nothing was changed.</span>
      </div>
    }

    <rtw-confirm-dialog #confirmImport heading="Import settings?" confirmLabel="Import">
      <strong>{{ pending()?.file }}</strong> has {{ pendingSummary() }}. It replaces the current
      {{ current() }}.
    </rtw-confirm-dialog>

    <rtw-confirm-dialog #confirmReset heading="Reset to defaults?" confirmLabel="Reset" [danger]="true">
      This replaces the current {{ current() }} with the shipped defaults. Export first if you
      want to keep them.
    </rtw-confirm-dialog>
  `,
})
export class SettingsFile {
  private readonly admin = inject(AdminService);
  private readonly settings = inject(SettingsService);
  private readonly clock = inject(ClockService);
  private readonly confirmImport = viewChild.required<ConfirmDialog>('confirmImport');
  private readonly confirmReset = viewChild.required<ConfirmDialog>('confirmReset');
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly current = computed(() => describeSettings(this.settings.settings()));
  protected readonly pending = signal<{ file: string; settings: Settings } | null>(null);
  protected readonly pendingSummary = computed(() => {
    const p = this.pending();
    return p ? describeSettings(p.settings) : '';
  });
  protected readonly error = signal<{ file: string; message: string } | null>(null);

  protected exportFile(): void {
    const blob = new Blob([this.settings.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ready-to-work-settings-${this.clock.today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected async picked(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    // Cleared so picking the same file again still fires a change.
    this.fileInput().nativeElement.value = '';
    if (!file) return;
    this.error.set(null);
    try {
      this.pending.set({ file: file.name, settings: this.settings.readFile(await file.text()) });
    } catch (e) {
      if (!(e instanceof SettingsError)) throw e;
      this.error.set({ file: file.name, message: e.message });
      return;
    }
    if (await this.confirmImport().ask()) this.admin.replace(this.pending()!.settings);
    this.pending.set(null);
  }

  protected async askReset(): Promise<void> {
    if (await this.confirmReset().ask()) this.admin.resetAdmin();
  }
}
