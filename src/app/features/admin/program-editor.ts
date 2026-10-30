import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CategoryConfig,
  DEFAULT_CONFIG,
  Requirement,
  addRequirement,
  deleteProgram,
  programNameProblem,
  removeRequirement,
  renameProgram,
} from '../../../core';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { Icon } from '../../shared/icon/icon';
import { RollupBadge } from '../../shared/status/rollup-badge';
import { AdminService } from './admin-service';

/** One program: rename, requirements (with the picker), live summary, delete. */
@Component({
  selector: 'rtw-program-editor',
  imports: [RouterLink, ConfirmDialog, Icon, RollupBadge],
  template: `
    <a routerLink="/admin/programs" class="btn btn-ghost btn-sm mb-3 -ml-2">
      <rtw-icon name="arrow-left" /> All programs
    </a>

    @if (program(); as p) {
      <section class="space-y-6">
        <div class="space-y-2">
          <label class="flex max-w-md flex-col gap-1 text-sm font-medium" for="program-name">
            Program name
          </label>
          <input
            id="program-name"
            class="input w-full max-w-md text-lg font-semibold"
            data-testid="program-name"
            [value]="draftName()"
            [attr.aria-invalid]="nameProblem() ? true : null"
            [attr.aria-describedby]="nameProblem() ? 'program-name-problem' : null"
            (input)="draftName.set($any($event.target).value); nameProblem.set(null)"
            (keydown.enter)="rename()"
            (keydown.escape)="draftName.set(p.name); nameProblem.set(null)"
            (blur)="rename()"
          />
          @if (nameProblem(); as problem) {
            <p id="program-name-problem" class="text-sm text-error">{{ problem }}</p>
          }
          <div data-testid="program-summary" aria-live="polite">
            @if (summary(); as s) {
              @if (s.rollup.total > 0) {
                <rtw-rollup-badge [rollup]="s.rollup" />
              } @else {
                <p class="text-xs opacity-70">No one on this program yet</p>
              }
            }
          </div>
        </div>

        <section aria-labelledby="requirements-heading" class="space-y-2">
          <h2 id="requirements-heading" class="text-lg font-semibold">Requirements</h2>
          <p class="text-sm opacity-70">Everyone on the program must hold all of these.</p>
          <ul class="divide-y divide-base-300 rounded-box border border-base-300 bg-base-100">
            @for (r of p.requirements; track r.itemId) {
              <li class="flex items-center gap-3 px-3 py-2" [attr.data-requirement]="r.itemId">
                <rtw-icon [name]="category(r.category)?.icon ?? 'info'" class="opacity-70" />
                <span class="grow">
                  {{ r.itemName }}
                  <span class="block text-xs opacity-70">{{ category(r.category)?.label ?? r.category }}</span>
                </span>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  [attr.aria-label]="'Remove ' + r.itemName"
                  (click)="remove(r)"
                >
                  <rtw-icon name="x" /> Remove
                </button>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm opacity-70">Requires nothing yet.</li>
            }
          </ul>

          @if (picking()) {
            <div class="rounded-box border border-base-300 bg-base-100 p-3" data-testid="picker">
              <div class="mb-2 flex items-center gap-2">
                <label class="input input-sm grow">
                  <rtw-icon name="search" class="opacity-60" />
                  <span class="sr-only">Search items</span>
                  <input
                    #pickerSearch
                    type="search"
                    placeholder="Search items"
                    data-testid="picker-search"
                    [value]="search()"
                    (input)="search.set($any($event.target).value)"
                    (keydown.escape)="closePicker()"
                  />
                </label>
                <button type="button" class="btn btn-ghost btn-sm" (click)="closePicker()">Done</button>
              </div>
              @for (g of choices(); track g.category.id) {
                <h3 class="mt-2 flex items-center gap-1 text-xs font-semibold uppercase opacity-70">
                  <rtw-icon [name]="g.category.icon" class="size-3" /> {{ g.category.label }}
                </h3>
                <ul class="mt-1 flex flex-wrap gap-2">
                  @for (item of g.items; track item.itemId) {
                    <li>
                      <button
                        type="button"
                        class="btn btn-outline btn-xs"
                        [attr.data-item]="item.itemId"
                        [attr.aria-label]="'Add ' + item.itemName"
                        (click)="add(item)"
                      >
                        <rtw-icon name="plus" class="size-3" /> {{ item.itemName }}
                      </button>
                    </li>
                  }
                </ul>
              } @empty {
                <p class="text-sm opacity-70">
                  {{ search() ? 'No items match "' + search() + '".' : 'The program already requires every known item.' }}
                </p>
              }
            </div>
          } @else {
            <button type="button" class="btn btn-sm" data-testid="add-requirement" (click)="openPicker()">
              <rtw-icon name="plus" /> Add requirement
            </button>
          }
        </section>

        <section aria-labelledby="danger-heading" class="border-t border-base-300 pt-4">
          <h2 id="danger-heading" class="sr-only">Delete program</h2>
          <button type="button" class="btn btn-outline btn-error btn-sm" data-testid="delete-program" (click)="askDelete()">
            <rtw-icon name="trash-2" /> Delete program
          </button>
        </section>
      </section>

      <rtw-confirm-dialog #confirmDelete heading="Delete program?" confirmLabel="Delete" [danger]="true">
        @if ((summary()?.rollup?.total ?? 0) > 0) {
          {{ p.name }} is assigned to {{ peopleCount() }}. Delete it and remove those assignments?
        } @else {
          Delete {{ p.name }}? No one is on it.
        }
      </rtw-confirm-dialog>
    } @else {
      <div role="alert" class="alert" data-testid="program-not-found">
        <span>Program not found. It may have been deleted.</span>
        <a routerLink="/admin/programs" class="link">All programs</a>
      </div>
    }
  `,
})
export class ProgramEditor {
  /** Route parameter. */
  readonly id = input.required<string>();

  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly confirmDelete = viewChild<ConfirmDialog>('confirmDelete');
  private readonly pickerSearch = viewChild<ElementRef<HTMLInputElement>>('pickerSearch');

  protected readonly program = computed(() => this.admin.programs().find((p) => p.id === this.id()));
  protected readonly summary = computed(() => this.admin.summaries().get(this.id()));
  protected readonly peopleCount = computed(() => {
    const n = this.summary()?.rollup.total ?? 0;
    return `${n} ${n === 1 ? 'person' : 'people'}`;
  });

  protected readonly draftName = linkedSignal(() => this.program()?.name ?? '');
  protected readonly nameProblem = signal<string | null>(null);
  protected readonly picking = signal(false);
  protected readonly search = signal('');

  /** Catalog items the program doesn't require yet, grouped by category in config order. */
  protected readonly choices = computed(() => {
    const held = new Set(this.program()?.requirements.map((r) => r.itemId));
    const keyword = this.search().trim().toLowerCase();
    return DEFAULT_CONFIG.categories
      .map((category) => ({
        category,
        items: this.admin
          .catalog()
          .filter(
            (c) =>
              c.category === category.id &&
              !held.has(c.itemId) &&
              (!keyword || c.itemName.toLowerCase().includes(keyword)),
          ),
      }))
      .filter((g) => g.items.length > 0);
  });

  protected category(id: string): CategoryConfig | undefined {
    return DEFAULT_CONFIG.categories.find((c) => c.id === id);
  }

  protected rename(): void {
    const p = this.program();
    if (!p || this.draftName().trim() === p.name) return;
    const problem = programNameProblem(this.draftName(), this.admin.programs(), p.id);
    this.nameProblem.set(problem);
    if (!problem) this.admin.editPrograms((s) => renameProgram(s, p.id, this.draftName()));
  }

  protected add(item: Requirement): void {
    const { category, itemId, itemName } = item;
    this.admin.editPrograms((s) => addRequirement(s, this.id(), { category, itemId, itemName }));
  }

  protected remove(r: Requirement): void {
    this.admin.editPrograms((s) => removeRequirement(s, this.id(), r.itemId));
  }

  protected openPicker(): void {
    this.picking.set(true);
    afterNextRender(() => this.pickerSearch()?.nativeElement.focus(), { injector: this.injector });
  }

  protected closePicker(): void {
    this.picking.set(false);
    this.search.set('');
  }

  protected async askDelete(): Promise<void> {
    if (!(await this.confirmDelete()?.ask())) return;
    this.admin.editPrograms((s) => deleteProgram(s, this.id()));
    void this.router.navigate(['/admin/programs']);
  }
}
