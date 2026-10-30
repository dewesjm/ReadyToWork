import { Component, inject } from '@angular/core';
import { IssuesList } from '../issues-list/issues-list';
import { OrgTree } from '../org-tree/org-tree';
import { ReadinessQueryService } from './readiness-query-service';
import { ReadinessToolbar } from './readiness-toolbar';
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
}
