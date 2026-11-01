import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { Component, signal } from '@angular/core';
import { STATUSES } from '../../../core';
import { Icon } from '../icon/icon';
import { StatusBadge } from './status-badge';
import { STATUS_MEANING } from './status-classes';

/** "Legend" button that opens a small panel explaining the three statuses. */
@Component({
  selector: 'rtw-legend',
  imports: [Icon, StatusBadge, CdkOverlayOrigin, CdkConnectedOverlay],
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-sm gap-1"
      cdkOverlayOrigin
      #trigger="cdkOverlayOrigin"
      [attr.aria-expanded]="open()"
      aria-controls="status-legend"
      (click)="open.set(!open())"
    >
      <rtw-icon name="info" />
      Legend
    </button>
    <!-- Angular CDK overlay: positions the panel; a click outside or Escape closes it. -->
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      cdkConnectedOverlayHasBackdrop
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="open.set(false)"
      (detach)="open.set(false)"
    >
      <div
        id="status-legend"
        class="mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-box border border-base-300 bg-base-100 p-3 shadow-lg"
      >
        <dl class="space-y-2 text-sm">
          @for (s of statuses; track s) {
            <div>
              <dt><rtw-status-badge [status]="s" /></dt>
              <dd class="mt-0.5 opacity-80">{{ meaning[s] }}</dd>
            </div>
          }
        </dl>
      </div>
    </ng-template>
  `,
})
export class Legend {
  protected readonly statuses = STATUSES;
  protected readonly meaning = STATUS_MEANING;
  protected readonly open = signal(false);
  /** Below the button, right edges lined up. */
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  ];
}
