import { Component, inject } from '@angular/core';
import { ReadinessQueryService } from './readiness-query-service';

/** What the tree and the list say when nothing is shown. */
@Component({
  selector: 'rtw-readiness-empty',
  template: `
    <div class="flex flex-col items-center gap-3 py-10 text-center" data-testid="empty">
      @if (query.hasFilters()) {
        <p>No one matches these filters.</p>
        <button type="button" class="btn btn-sm" (click)="query.clearFilters()">Clear filters</button>
      } @else if (query.issuesOnly() && !query.searchingEveryone()) {
        <p>No issues: everyone here is ready.</p>
      } @else {
        <p>No one in this scope.</p>
      }
    </div>
  `,
})
export class ReadinessEmpty {
  protected readonly query = inject(ReadinessQueryService);
}
