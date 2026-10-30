import { Component, computed, inject } from '@angular/core';
import { UpdateService } from '../../services/update-service';
import { Icon } from '../icon/icon';

/** "A new version is available" with Refresh and Later, at the bottom of every page. */
@Component({
  selector: 'rtw-update-prompt',
  imports: [Icon],
  template: `
    <div role="status" aria-live="polite">
      @if (show()) {
        <div class="toast toast-end toast-bottom z-50 max-sm:toast-center" data-testid="update-prompt">
          <div class="alert alert-info flex max-w-sm flex-wrap shadow-lg">
            <rtw-icon name="rotate-ccw" class="size-5" />
            <span>A new version of Ready to Work is available.</span>
            <div class="ml-auto flex gap-2">
              <button type="button" class="btn btn-ghost btn-sm" data-testid="update-later" (click)="updates.dismiss()">
                Later
              </button>
              <button type="button" class="btn btn-sm" data-testid="update-refresh" (click)="updates.refresh()">
                Refresh
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class UpdatePrompt {
  protected readonly updates = inject(UpdateService);
  protected readonly show = computed(() => this.updates.available() && !this.updates.dismissed());
}
