import { Component, ElementRef, input, viewChild } from '@angular/core';

/**
 * "Are you sure?" on a native modal dialog. `ask()` resolves true for the confirm button, false
 * for Cancel or Escape. The question goes in as content.
 */
@Component({
  selector: 'rtw-confirm-dialog',
  template: `
    <dialog #dialog class="modal" [attr.aria-labelledby]="titleId" (close)="settle(dialog.returnValue === 'yes')">
      <div class="modal-box">
        <h2 class="text-lg font-semibold" [id]="titleId">{{ heading() }}</h2>
        <div class="py-3 text-sm"><ng-content /></div>
        <form method="dialog" class="modal-action">
          <button class="btn btn-ghost" value="no">Cancel</button>
          <button class="btn" [class.btn-error]="danger()" [class.btn-primary]="!danger()" value="yes">
            {{ confirmLabel() }}
          </button>
        </form>
      </div>
    </dialog>
  `,
})
export class ConfirmDialog {
  readonly heading = input.required<string>();
  readonly confirmLabel = input.required<string>();
  /** Red confirm button, for deletes and resets. */
  readonly danger = input(false);

  private static nextId = 0;
  protected readonly titleId = `confirm-title-${ConfirmDialog.nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private resolve: ((yes: boolean) => void) | null = null;

  ask(): Promise<boolean> {
    this.settle(false);
    const dialog = this.dialog().nativeElement;
    dialog.returnValue = '';
    dialog.showModal();
    return new Promise((resolve) => (this.resolve = resolve));
  }

  protected settle(yes: boolean): void {
    this.resolve?.(yes);
    this.resolve = null;
  }
}
