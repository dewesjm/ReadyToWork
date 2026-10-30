import { Component, DestroyRef, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { IssuesList } from '../issues-list/issues-list';
import { OrgTree } from '../org-tree/org-tree';
import { ReadinessQueryService } from './readiness-query-service';
import { ReadinessToolbar } from './readiness-toolbar';
import { ReturnPathService } from './return-path-service';
import { TreeModel } from './tree-model';

/** Home page: tree and list views of the same people, sharing one toolbar. State lives in the URL. */
@Component({
  selector: 'rtw-readiness',
  imports: [ReadinessToolbar, OrgTree, IssuesList],
  providers: [ReadinessQueryService, TreeModel],
  templateUrl: './readiness.html',
})
export class Readiness {
  protected readonly query = inject(ReadinessQueryService);

  constructor() {
    // Remember this view (filters included) for "Back to readiness" on the person page.
    const router = inject(Router);
    const returnPath = inject(ReturnPathService);
    if (router.url.startsWith('/readiness')) returnPath.readinessUrl.set(router.url);
    const sub = router.events.subscribe((e) => {
      if (e instanceof NavigationEnd && e.urlAfterRedirects.startsWith('/readiness')) {
        returnPath.readinessUrl.set(e.urlAfterRedirects);
      }
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }
}
