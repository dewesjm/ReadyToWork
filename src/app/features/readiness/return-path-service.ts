import { Injectable, signal } from '@angular/core';

/**
 * The last Readiness page URL, query included, so "Back to readiness" restores the view even
 * after following links from person to person. The Readiness page keeps it up to date.
 */
@Injectable({ providedIn: 'root' })
export class ReturnPathService {
  readonly readinessUrl = signal('/readiness');
}
