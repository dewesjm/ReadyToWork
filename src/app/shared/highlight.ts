import { Component, computed, input } from '@angular/core';
import { highlightParts } from '../../core';

/** Text with every match of the keyword marked. */
@Component({
  selector: 'rtw-highlight',
  template: `@for (part of parts(); track $index) {@if (part.match) {<mark class="rounded-sm bg-accent/40 text-inherit">{{ part.text }}</mark>} @else {{{ part.text }}}}`,
})
export class Highlight {
  readonly text = input.required<string>();
  readonly keyword = input('');
  protected readonly parts = computed(() => highlightParts(this.text(), this.keyword()));
}
