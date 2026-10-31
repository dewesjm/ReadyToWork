import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Program, createProgram, programNameProblem, requirementLabel } from '../../../core';
import { Icon } from '../../shared/icon/icon';
import { RollupBadge } from '../../shared/status/rollup-badge';
import { AdminService } from './admin-service';

/** Every program with what it requires and how ready its people are; New program. */
@Component({
  selector: 'rtw-program-list',
  imports: [RouterLink, Icon, RollupBadge],
  template: `
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <p class="max-w-prose text-sm opacity-80">
        Each program lists what its people must hold. Open a program to change its requirements
        and who is on it.
      </p>
      <form class="flex flex-col gap-1" (submit)="create($event)">
        <div class="flex gap-2">
          <label class="sr-only" for="new-program-name">New program name</label>
          <input
            id="new-program-name"
            class="input input-sm w-56"
            placeholder="New program name"
            data-testid="new-program-name"
            [value]="newName()"
            [attr.aria-invalid]="problem() ? true : null"
            [attr.aria-describedby]="problem() ? 'new-program-problem' : null"
            (input)="newName.set($any($event.target).value); problem.set(null)"
          />
          <button type="submit" class="btn btn-sm btn-primary" data-testid="create-program">
            <rtw-icon name="plus" /> New program
          </button>
        </div>
        @if (problem(); as p) {
          <p id="new-program-problem" class="text-sm text-error">{{ p }}</p>
        }
      </form>
    </div>

    <ul class="grid gap-3 md:grid-cols-2">
      @for (p of programs(); track p.id) {
        <li class="card card-sm border border-base-300 bg-base-100" [attr.data-program]="p.id">
          <div class="card-body">
            <h2 class="card-title text-base">
              <a class="link link-hover" [routerLink]="p.id">{{ p.name }}</a>
            </h2>
            @if (summaries().get(p.id); as s) {
              @if (s.rollup.total > 0) {
                <rtw-rollup-badge [rollup]="s.rollup" />
              } @else {
                <p class="text-xs opacity-70">No one on this program yet</p>
              }
            }
            <p class="text-sm">
              @if (p.requirements.length > 0) {
                <span class="opacity-70">Requires:</span> {{ itemNames(p) }}
              } @else {
                <span class="opacity-70">Requires nothing yet</span>
              }
            </p>
          </div>
        </li>
      } @empty {
        <li class="opacity-70">No programs yet.</li>
      }
    </ul>
  `,
})
export class ProgramList {
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  protected readonly programs = this.admin.programs;
  protected readonly summaries = this.admin.summaries;
  protected readonly newName = signal('');
  protected readonly problem = signal<string | null>(null);

  protected itemNames(p: Program): string {
    const names = this.admin.itemNames();
    return p.requirements.map((r) => requirementLabel(r, names)).join('; ');
  }

  protected create(event: Event): void {
    event.preventDefault();
    const problem = programNameProblem(this.newName(), this.programs());
    this.problem.set(problem);
    if (problem) return;
    let id = '';
    this.admin.editPrograms((setup) => {
      const created = createProgram(setup, this.newName());
      id = created.id;
      return created.setup;
    });
    this.newName.set('');
    void this.router.navigate(['/admin/programs', id]);
  }
}
