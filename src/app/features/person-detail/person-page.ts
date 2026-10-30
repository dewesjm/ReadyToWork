import { Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { ReadinessService } from '../../services/readiness-service';
import { Icon } from '../../shared/icon/icon';
import { ReturnPathService } from '../readiness/return-path-service';
import { PersonDetail } from './person-detail';

/** Drill-down layout: one person's detail as its own page, `/person/:id`. */
@Component({
  selector: 'rtw-person-page',
  imports: [RouterLink, Icon, PersonDetail],
  template: `
    <a class="link mb-4 inline-flex items-center gap-1 text-sm" data-testid="back" [routerLink]="backLink()">
      <rtw-icon name="chevron-right" class="rotate-180" />
      Back to readiness
    </a>
    <div class="rounded-box border border-base-300 bg-base-100 p-4">
      <rtw-person-detail [personId]="id()" mode="page" />
    </div>
  `,
})
export class PersonPage {
  /** From the route (component input binding). */
  readonly id = input.required<string>();

  private readonly router = inject(Router);
  private readonly readiness = inject(ReadinessService);
  private readonly returnPath = inject(ReturnPathService);

  protected readonly backLink = computed(() => this.router.parseUrl(this.returnPath.readinessUrl()));

  constructor() {
    const title = inject(Title);
    effect(() => {
      const person = this.readiness.result().org.get(this.id());
      title.setTitle(`${person?.name ?? 'Person'} · Ready to Work`);
    });
  }
}
