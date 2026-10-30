import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Icon } from '../../shared/icon/icon';
import { IssuesList } from '../issues-list/issues-list';
import { OrgTree } from '../org-tree/org-tree';
import { PersonDetail } from '../person-detail/person-detail';
import { PersonNavigator } from './person-navigator';
import { ReadinessQueryService } from './readiness-query-service';
import { ReadinessToolbar } from './readiness-toolbar';
import { ReturnPathService } from './return-path-service';
import { TreeModel } from './tree-model';

/**
 * Home page: tree and list views of the same people, sharing one toolbar. State lives in the
 * URL. In the Dashboard layout on a wide screen, the open person shows in a panel on the right.
 */
@Component({
  selector: 'rtw-readiness',
  imports: [RouterLink, Icon, ReadinessToolbar, OrgTree, IssuesList, PersonDetail],
  providers: [ReadinessQueryService, TreeModel, PersonNavigator],
  templateUrl: './readiness.html',
})
export class Readiness {
  protected readonly query = inject(ReadinessQueryService);
  private readonly navigator = inject(PersonNavigator);
  protected readonly panelId = this.navigator.panelPersonId;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

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

    // A new person in the panel starts at the top.
    effect(() => {
      this.panelId();
      const panel = this.panel()?.nativeElement;
      if (panel) panel.scrollTop = 0;
    });
  }

  /** Closes the panel and puts focus back on that person's row. */
  protected closePanel(): void {
    const id = this.panelId();
    this.navigator.close();
    afterNextRender(
      () =>
        this.host.nativeElement.querySelector<HTMLElement>(`[role="treeitem"][data-id="${id}"]`)?.focus(),
      { injector: this.injector },
    );
  }
}
