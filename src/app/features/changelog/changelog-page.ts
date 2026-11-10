import { Component } from '@angular/core';
import { formatDate } from '../../../core';
import { CHANGELOG } from '../../changelog';

const SECTIONS = [
  { key: 'new', label: 'New', badge: 'badge-success' },
  { key: 'changes', label: 'Changes', badge: 'badge-info' },
  { key: 'fixes', label: 'Fixes', badge: 'badge-warning' },
] as const;

/** The change log, newest first; each day lists New, Changes and Fixes, skipping empty ones. */
@Component({
  selector: 'rtw-changelog-page',
  template: `
    <h1 class="text-2xl font-semibold">Change log</h1>
    <div class="mt-4 flex max-w-3xl flex-col gap-4">
      @for (e of entries; track e.date) {
        <section
          class="rounded-box border border-base-300 bg-base-100 p-4"
          [attr.aria-labelledby]="'log-' + e.date"
          data-testid="entry"
        >
          <h2 [id]="'log-' + e.date" class="text-lg font-semibold">{{ e.title }}</h2>
          @for (s of e.sections; track s.label) {
            <div class="mt-3">
              <h3 class="badge {{ s.badge }}">{{ s.label }}</h3>
              <ul class="mt-1 flex list-disc flex-col gap-1 pl-6">
                @for (item of s.items; track $index) {
                  <li>{{ item }}</li>
                }
              </ul>
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class ChangelogPage {
  protected readonly entries = CHANGELOG.map((e) => ({
    date: e.date,
    title: formatDate(e.date),
    sections: SECTIONS.map((s) => ({ label: s.label, badge: s.badge, items: e[s.key] ?? [] })).filter(
      (s) => s.items.length > 0,
    ),
  }));
}
