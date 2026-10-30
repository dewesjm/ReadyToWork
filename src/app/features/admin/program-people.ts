import { Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Person,
  assign,
  assignMany,
  matchesKeyword,
  programStatus,
  supervisorOptions,
  unassign,
} from '../../../core';
import { ReadinessService } from '../../services/readiness-service';
import { ViewerService } from '../../services/viewer-service';
import { Highlight } from '../../shared/highlight';
import { Icon } from '../../shared/icon/icon';
import { StatusBadge } from '../../shared/status/status-badge';
import { supervisorChoices } from '../../shared/supervisor-choices';
import { AdminService } from './admin-service';

/** Most search results shown at once; typing more narrows the rest. */
export const PEOPLE_SEARCH_LIMIT = 8;

/**
 * Who is on a program: add by search, add everyone under a supervisor (a one-time add), remove
 * one person. Each person shows their status for this program.
 */
@Component({
  selector: 'rtw-program-people',
  imports: [RouterLink, Highlight, Icon, StatusBadge],
  template: `
    <section aria-labelledby="people-heading" class="space-y-3">
      <h2 id="people-heading" class="text-lg font-semibold">People</h2>

      <div class="grid gap-3 md:grid-cols-2">
        <div class="space-y-1">
          <label class="text-sm font-medium" for="people-search">Add a person</label>
          <label class="input input-sm w-full">
            <rtw-icon name="search" class="opacity-60" />
            <input
              id="people-search"
              type="search"
              placeholder="Name, title or employee ID"
              data-testid="people-search"
              [value]="search()"
              (input)="search.set($any($event.target).value)"
            />
          </label>
          @if (search().trim()) {
            <ul class="rounded-box border border-base-300 bg-base-100" data-testid="people-matches">
              @for (p of matches().shown; track p.id) {
                <li class="flex items-center gap-2 px-3 py-1.5" [attr.data-match]="p.id">
                  <span class="grow text-sm">
                    <rtw-highlight [text]="p.name" [keyword]="search()" />
                    <span class="block text-xs opacity-70">
                      <rtw-highlight [text]="p.title" [keyword]="search()" /> ·
                      <rtw-highlight [text]="p.employeeId" [keyword]="search()" />
                    </span>
                  </span>
                  <button type="button" class="btn btn-outline btn-xs" [attr.aria-label]="'Add ' + p.name" (click)="add(p)">
                    <rtw-icon name="plus" class="size-3" /> Add
                  </button>
                </li>
              } @empty {
                <li class="px-3 py-1.5 text-sm opacity-70">No one else matches "{{ search().trim() }}".</li>
              }
              @if (matches().total > matches().shown.length) {
                <li class="px-3 py-1.5 text-xs opacity-70">
                  Showing {{ matches().shown.length }} of {{ matches().total }} matches. Keep typing to narrow it.
                </li>
              }
            </ul>
          }
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium" for="people-supervisor">Add everyone under</label>
          <div class="flex gap-2">
            <select
              id="people-supervisor"
              class="select select-sm min-w-0 grow"
              data-testid="people-supervisor"
              (change)="supervisorId.set($any($event.target).value)"
            >
              <option value="" [selected]="supervisorId() === ''">Choose a supervisor</option>
              @for (s of supervisors(); track s.id) {
                <option [value]="s.id" [selected]="s.id === supervisorId()">{{ s.label }}</option>
              }
            </select>
            <button
              type="button"
              class="btn btn-sm"
              data-testid="add-subtree"
              [disabled]="toAddUnder().length === 0"
              (click)="addSubtree()"
            >
              <rtw-icon name="plus" />
              {{ subtreeButtonLabel() }}
            </button>
          </div>
          <p class="text-xs opacity-70">Adds the people there now. Anyone can be removed afterwards.</p>
        </div>
      </div>

      <p class="text-sm font-medium" data-testid="people-count">{{ countLabel(people().length) }} on this program</p>
      @if (people().length > 0) {
        <ul class="divide-y divide-base-300 rounded-box border border-base-300 bg-base-100" data-testid="people-list">
          @for (row of people(); track row.person.id) {
            <li class="flex items-center gap-2 px-3 py-2 sm:gap-3" [attr.data-person]="row.person.id">
              <span class="min-w-0 grow">
                <a class="link link-hover font-medium" [routerLink]="['/person', row.person.id]">{{ row.person.name }}</a>
                <span class="block truncate text-xs opacity-70">{{ row.person.title }} · {{ row.person.employeeId }}</span>
              </span>
              <rtw-status-badge class="shrink-0" [status]="row.status" [compact]="true" />
              <button
                type="button"
                class="btn btn-ghost btn-xs shrink-0"
                [attr.aria-label]="'Remove ' + row.person.name + ' from the program'"
                [attr.title]="'Remove ' + row.person.name"
                (click)="remove(row.person)"
              >
                <rtw-icon name="x" class="size-3" /><span class="hidden sm:inline">Remove</span>
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class ProgramPeople {
  readonly programId = input.required<string>();

  private readonly admin = inject(AdminService);
  private readonly readiness = inject(ReadinessService);
  private readonly viewer = inject(ViewerService);
  private readonly org = computed(() => this.readiness.result().org);

  protected readonly search = signal('');

  /** People on the program, in org order, with their status for it. */
  protected readonly people = computed(() => {
    const result = this.readiness.result();
    const ids = this.admin.summaries().get(this.programId())?.personIds ?? [];
    return ids.map((id) => ({
      person: result.org.get(id)!,
      status: programStatus(this.programId(), result.checksByPerson.get(id) ?? []),
    }));
  });

  private readonly onProgram = computed(() => new Set(this.people().map((r) => r.person.id)));

  protected readonly matches = computed<{ shown: Person[]; total: number }>(() => {
    const keyword = this.search();
    if (!keyword.trim()) return { shown: [], total: 0 };
    const org = this.org();
    const found = org
      .roots()
      .flatMap((r) => org.subtree(r.id))
      .filter((p) => !this.onProgram().has(p.id) && matchesKeyword(p, keyword));
    return { shown: found.slice(0, PEOPLE_SEARCH_LIMIT), total: found.length };
  });

  protected readonly supervisors = computed(() => {
    const v = this.viewer.viewer();
    return v ? supervisorChoices(supervisorOptions(this.org(), v), v.personId) : [];
  });
  /**
   * Starts on "Choose a supervisor" so one click can't add the whole org. Kept across edits
   * (each one rebuilds the choices) while it is still one of them.
   */
  protected readonly supervisorId = linkedSignal<{ id: string }[], string>({
    source: this.supervisors,
    computation: (choices, previous) =>
      previous && choices.some((c) => c.id === previous.value) ? previous.value : '',
  });

  /** Everyone below the chosen supervisor (not the supervisor) who isn't on the program yet. */
  protected readonly toAddUnder = computed(() =>
    this.org()
      .subtree(this.supervisorId(), false)
      .filter((p) => !this.onProgram().has(p.id)),
  );
  protected readonly subtreeButtonLabel = computed(() => {
    if (!this.supervisorId()) return 'Add';
    const n = this.toAddUnder().length;
    return n === 0 ? 'All on it' : `Add ${this.countLabel(n)}`;
  });

  protected countLabel(n: number): string {
    return `${n.toLocaleString('en-US')} ${n === 1 ? 'person' : 'people'}`;
  }

  protected add(person: Person): void {
    this.admin.editPrograms((s) => assign(s, this.programId(), person.id));
  }

  protected addSubtree(): void {
    const ids = this.toAddUnder().map((p) => p.id);
    this.admin.editPrograms((s) => assignMany(s, this.programId(), ids));
  }

  protected remove(person: Person): void {
    this.admin.editPrograms((s) => unassign(s, this.programId(), person.id));
  }
}
