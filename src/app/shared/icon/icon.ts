import { Component, computed, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from './icons';

/** Lucide icon by name (see icons.ts). Decorative: pair it with visible or sr-only text. */
@Component({
  selector: 'rtw-icon',
  imports: [LucideAngularModule],
  template: `
    @if (icon(); as img) {
      <lucide-icon [img]="img" class="size-full" aria-hidden="true" />
    }
  `,
  host: { class: 'inline-block size-4 shrink-0', '[attr.data-icon]': 'name()' },
})
export class Icon {
  readonly name = input.required<string>();
  protected readonly icon = computed(() => ICONS[this.name()]);
}
