import { Component, computed, input } from '@angular/core';
import { ICONS } from './icons';

/** Inline SVG icon by name (see icons.ts). Decorative: pair it with visible or sr-only text. */
@Component({
  selector: 'rtw-icon',
  template: `
    <svg
      class="size-full"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @for (s of shapes(); track $index) {
        @switch (s[0]) {
          @case ('path') {
            <svg:path [attr.d]="s[1]" />
          }
          @case ('circle') {
            <svg:circle [attr.cx]="s[1]" [attr.cy]="s[2]" [attr.r]="s[3]" />
          }
          @case ('rect') {
            <svg:rect [attr.x]="s[1]" [attr.y]="s[2]" [attr.width]="s[3]" [attr.height]="s[4]" [attr.rx]="s[5]" />
          }
          @case ('polygon') {
            <svg:polygon [attr.points]="s[1]" />
          }
        }
      }
    </svg>
  `,
  host: { class: 'inline-block size-4 shrink-0', '[attr.data-icon]': 'name()' },
})
export class Icon {
  readonly name = input.required<string>();
  protected readonly shapes = computed(() => ICONS[this.name()] ?? []);
}
