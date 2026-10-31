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
  RequirementOption,
  addRequirement,
  deleteProgram,
  itemKey,
  optionLabel,
  programNameProblem,
  removeRequirement,
  renameProgram,
  requirementLabel,
  requirementProblem,
} from '../../../core';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { Icon } from '../../shared/icon/icon';
import { RollupBadge } from '../../shared/status/rollup-badge';
import { AdminService } from './admin-service';
import { ProgramPeople } from './program-people';

/** Types an admin can require: the accounts, training, qualifications and roles. */
const REQUIREMENT_CATEGORIES = DEFAULT_CONFIG.categories.filter((c) =>
  ['network', 'sap-password', 'training', 'qualification', 'access-role'].includes(c.id),
);

/** One program: rename, requirements (typed IDs, "any of"), people, live summary, delete. */
@Component({
  selector: 'rtw-program-editor',
  imports: [RouterLink, ConfirmDialog, Icon, ProgramPeople, RollupBadge],
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
          <p class="text-sm opacity-70">
            Everyone on the program must meet all of these. A requirement with several IDs is met by
            any one of them.
          </p>
          <ul class="divide-y divide-base-300 rounded-box border border-base-300 bg-base-100">
            @for (r of requirements(); track r.id) {
              <li class="flex items-start gap-3 px-3 py-2" [attr.data-requirement]="r.id">
                <rtw-icon [name]="r.icon" class="mt-0.5 opacity-70" />
                <span class="grow">
                  {{ r.label }}
                  @if (r.options.length > 1) {
                    <ul class="mt-1 text-xs">
                      @for (o of r.options; track $index) {
                        <li>
                          {{ o.label }} <span class="opacity-70">· {{ o.type }}</span>
                        </li>
                      }
                    </ul>
                  } @else {
                    <span class="block text-xs opacity-70">{{ r.options[0].type }}</span>
                  }
                  @for (id of r.unknownIds; track id) {
                    <span class="mt-1 block text-xs" data-testid="unknown-id">
                      <rtw-icon name="triangle-alert" class="size-3 text-warning" /> No records with
                      ID {{ id }} yet. Check the ID.
                    </span>
                  }
                </span>
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  [attr.aria-label]="'Remove ' + r.label"
                  (click)="remove(r.id)"
                >
                  <rtw-icon name="x" /> Remove
                </button>
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm opacity-70">Requires nothing yet.</li>
            }
          </ul>

          @if (draft(); as d) {
            <form
              class="space-y-3 rounded-box border border-base-300 bg-base-100 p-3"
              data-testid="requirement-form"
              (submit)="saveDraft($event)"
              (keydown.escape)="closeDraft()"
            >
              <label class="flex max-w-md flex-col gap-1 text-sm font-medium">
                Name (optional)
                <input
                  #draftNameInput
                  class="input input-sm w-full"
                  data-testid="requirement-name"
                  placeholder="For example: Electrical safety"
                  [value]="d.name"
                  (input)="setDraftName($any($event.target).value)"
                />
              </label>
              <fieldset class="space-y-2">
                <legend class="text-sm font-medium">
                  {{ d.options.length > 1 ? 'IDs (any one will do)' : 'ID' }}
                </legend>
                @for (o of d.options; track $index; let i = $index) {
                  <div class="flex flex-wrap items-center gap-2" data-testid="option">
                    <select
                      class="select select-sm w-44"
                      data-testid="option-type"
                      [attr.aria-label]="'Type of ID ' + (i + 1)"
                      (change)="setOption(i, { category: $any($event.target).value })"
                    >
                      @for (c of categories; track c.id) {
                        <option [value]="c.id" [selected]="c.id === o.category">
                          {{ c.label }}
                        </option>
                      }
                    </select>
                    <input
                      class="input input-sm w-48"
                      data-testid="option-id"
                      placeholder="For example: HW-210"
                      [attr.aria-label]="'ID ' + (i + 1)"
                      [value]="o.itemId"
                      (input)="setOption(i, { itemId: $any($event.target).value })"
                    />
                    @if (d.options.length > 1) {
                      <button
                        type="button"
                        class="btn btn-ghost btn-xs"
                        [attr.aria-label]="'Remove ID ' + (i + 1)"
                        (click)="removeOption(i)"
                      >
                        <rtw-icon name="x" />
                      </button>
                    }
                  </div>
                }
                <button
                  type="button"
                  class="btn btn-ghost btn-xs"
                  data-testid="add-option"
                  (click)="addOption()"
                >
                  <rtw-icon name="plus" class="size-3" /> Add another ID (any one will do)
                </button>
              </fieldset>
              @if (draftProblem(); as problem) {
                <p class="text-sm text-error" data-testid="requirement-problem">{{ problem }}</p>
              }
              <div class="flex gap-2">
                <button type="submit" class="btn btn-primary btn-sm" data-testid="save-requirement">
                  Add
                </button>
                <button type="button" class="btn btn-ghost btn-sm" (click)="closeDraft()">
                  Cancel
                </button>
              </div>
            </form>
          } @else {
            <button
              type="button"
              class="btn btn-sm"
              data-testid="add-requirement"
              (click)="openDraft()"
            >
              <rtw-icon name="plus" /> Add requirement
            </button>
          }
        </section>

        <rtw-program-people [programId]="p.id" />

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
  private readonly draftNameInput = viewChild<ElementRef<HTMLInputElement>>('draftNameInput');

  protected readonly program = computed(() => this.admin.programs().find((p) => p.id === this.id()));
  protected readonly summary = computed(() => this.admin.summaries().get(this.id()));
  protected readonly peopleCount = computed(() => {
    const n = this.summary()?.rollup.total ?? 0;
    return `${n} ${n === 1 ? 'person' : 'people'}`;
  });

  protected readonly draftName = linkedSignal(() => this.program()?.name ?? '');
  protected readonly nameProblem = signal<string | null>(null);
  protected readonly categories = REQUIREMENT_CATEGORIES;
  /** The requirement being added, or null when the form is closed. */
  protected readonly draft = signal<{ name: string; options: RequirementOption[] } | null>(null);
  protected readonly draftProblem = signal<string | null>(null);

  /** The program's requirements for display, with the IDs no record has. */
  protected readonly requirements = computed(() => {
    const names = this.admin.itemNames();
    return (this.program()?.requirements ?? []).map((r) => ({
      id: r.id,
      label: requirementLabel(r, names),
      icon: this.category(r.anyOf[0]?.category ?? '')?.icon ?? 'info',
      options: r.anyOf.map((o) => ({
        label: optionLabel(o, names),
        type: this.category(o.category)?.label ?? o.category,
      })),
      unknownIds: r.anyOf
        .filter((o) => !names.has(itemKey(o.category, o.itemId)))
        .map((o) => o.itemId),
    }));
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

  protected openDraft(): void {
    this.draft.set({ name: '', options: [{ category: 'training', itemId: '' }] });
    this.draftProblem.set(null);
    afterNextRender(() => this.draftNameInput()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected closeDraft(): void {
    this.draft.set(null);
    this.draftProblem.set(null);
  }

  protected setDraftName(name: string): void {
    this.draft.update((d) => d && { ...d, name });
  }

  protected setOption(index: number, change: Partial<RequirementOption>): void {
    this.draft.update(
      (d) =>
        d && { ...d, options: d.options.map((o, i) => (i === index ? { ...o, ...change } : o)) },
    );
    this.draftProblem.set(null);
  }

  /** A new ID row starts with the type of the one above it. */
  protected addOption(): void {
    this.draft.update(
      (d) =>
        d && {
          ...d,
          options: [
            ...d.options,
            { category: d.options.at(-1)?.category ?? 'training', itemId: '' },
          ],
        },
    );
  }

  protected removeOption(index: number): void {
    this.draft.update((d) => d && { ...d, options: d.options.filter((_, i) => i !== index) });
  }

  protected saveDraft(event: Event): void {
    event.preventDefault();
    const d = this.draft();
    const p = this.program();
    if (!d || !p) return;
    const draft = { name: d.name, anyOf: d.options };
    const problem = requirementProblem(draft, p);
    this.draftProblem.set(problem);
    if (problem) return;
    this.admin.editPrograms((s) => addRequirement(s, p.id, draft));
    this.closeDraft();
  }

  protected remove(requirementId: string): void {
    this.admin.editPrograms((s) => removeRequirement(s, this.id(), requirementId));
  }

  protected async askDelete(): Promise<void> {
    if (!(await this.confirmDelete()?.ask())) return;
    this.admin.editPrograms((s) => deleteProgram(s, this.id()));
    void this.router.navigate(['/admin/programs']);
  }
}
