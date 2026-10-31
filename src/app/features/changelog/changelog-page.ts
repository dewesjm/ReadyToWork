import { Component } from '@angular/core';
import { formatDate } from '../../../core';
import { CHANGELOG } from '../../changelog';

const SECTIONS = [
  { key: 'new', label: 'New' },
  { key: 'changes', label: 'Changes' },
  { key: 'fixes', label: 'Fixes' },
] as const;

/** The change log, newest first; each day lists New, Changes and Fixes, skipping empty ones. */
@Component({
  selector: 'rtw-changelog-page',
  template: `
    <h1 class="text-2xl font-semibold">Change log</h1>
    <div class="mt-4 flex max-w-2xl flex-col gap-6">
      @for (e of entries; track e.date) {
        <section [attr.aria-labelledby]="'log-' + e.date" data-testid="entry">
          <h2 [id]="'log-' + e.date" class="text-lg font-semibold">{{ e.title }}</h2>
          @for (s of e.sections; track s.label) {
            <h3 class="mt-2 text-xs font-semibold uppercase opacity-60">{{ s.label }}</h3>
            <ul class="mt-1 list-disc pl-5">
              @for (item of s.items; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
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
    sections: SECTIONS.map((s) => ({ label: s.label, items: e[s.key] ?? [] })).filter(
      (s) => s.items.length > 0,
    ),
  }));
}
