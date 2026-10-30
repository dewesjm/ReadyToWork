import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'rtw-not-found',
  imports: [RouterLink],
  template: `
    <h1 class="text-2xl font-semibold">Page not found</h1>
    <a routerLink="/readiness" class="link link-primary mt-2 inline-block">Back to readiness</a>
  `,
})
export class NotFound {}
