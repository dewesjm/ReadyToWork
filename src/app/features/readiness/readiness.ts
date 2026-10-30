import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { IssuesList } from '../issues-list/issues-list';
import { OrgTree } from '../org-tree/org-tree';

export type ReadinessView = 'tree' | 'list';

/** Home page: tree and list views of the same people, sharing one toolbar. State lives in the URL. */
@Component({
  selector: 'rtw-readiness',
  imports: [OrgTree, IssuesList],
  templateUrl: './readiness.html',
})
export class Readiness {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly view = computed<ReadinessView>(() =>
    this.params().get('view') === 'list' ? 'list' : 'tree',
  );
  /** On unless the URL says `issues=all`. */
  readonly issuesOnly = computed(() => this.params().get('issues') !== 'all');

  setView(view: ReadinessView): void {
    this.update({ view: view === 'tree' ? null : view });
  }

  setIssuesOnly(on: boolean): void {
    this.update({ issues: on ? null : 'all' });
  }

  private update(queryParams: Record<string, string | null>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
