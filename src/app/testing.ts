import { TestBed } from '@angular/core/testing';
import { ReadinessService } from './services/readiness-service';
import { SettingsService } from './services/settings-service';

/** Test helper: start from empty browser storage and load settings and the fake org. */
export async function loadAppState(): Promise<void> {
  localStorage.clear();
  await reloadAppState();
}

/** Test helper: load settings and the fake org from what is already saved, as after a reload. */
export async function reloadAppState(): Promise<void> {
  await Promise.all([
    TestBed.inject(SettingsService).load(),
    TestBed.inject(ReadinessService).load(),
  ]);
}

/**
 * Test helper: jsdom has no modal dialogs. Gives `<dialog>` enough of `showModal` and `close`
 * (including the close event and returnValue from `<form method="dialog">` buttons) for specs.
 */
export function stubDialogs(): void {
  const proto = HTMLDialogElement.prototype as HTMLDialogElement & { stubbed?: boolean };
  if (proto.stubbed) return;
  proto.stubbed = true;
  proto.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement, value?: string) {
    if (value !== undefined) this.returnValue = value;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  document.addEventListener('click', (event) => {
    const button = (event.target as Element | null)?.closest?.('form[method="dialog"] button');
    const dialog = button?.closest('dialog');
    if (button && dialog) {
      event.preventDefault();
      dialog.close((button as HTMLButtonElement).value);
    }
  });
}
