import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { warningDaysProblem } from '../../../../data';
import { ViewerService } from '../../../services/viewer-service';
import { AdminService } from '../admin-service';
import { SERVICE_CATEGORIES, serviceOperations } from './service-operations';

@Component({
  selector: 'rtw-services',
  template: `
    <section class="max-w-3xl space-y-4">
      <h2 class="text-xl font-semibold">Services</h2>
      @if (canRunServices()) {
        <p class="text-sm">Run the app’s demo service calls and see what they return.</p>
        <label class="flex flex-col gap-1 text-sm font-medium">
          Service call
          <select class="select w-full max-w-full" (change)="selectOperation($any($event.target).value)">
            @for (entry of operations; track entry.name; let i = $index) {
              <option [value]="i">{{ entry.name }}</option>
            }
          </select>
        </label>
        <p class="text-sm">
          <span class="badge badge-outline">{{ operation().writes ? 'Write' : 'Read' }}</span>
          {{ operation().description }}
        </p>
        @if (operation().writes) {
          <div class="flex flex-wrap gap-3">
            <label class="flex flex-col gap-1 text-sm font-medium">
              Category
              <select class="select max-w-full" [value]="categoryId()" (change)="categoryId.set($any($event.target).value)">
                @for (category of categories; track category.id) {
                  <option [value]="category.id">{{ category.label }}</option>
                }
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm font-medium">
              Warning days
              <input class="input w-40" type="text" inputmode="numeric"
                [value]="days()" (input)="days.set($any($event.target).value)"
                [attr.aria-invalid]="problem() ? true : null" aria-describedby="service-days-help" />
              <span id="service-days-help" class="text-xs">Blank uses the default.</span>
            </label>
          </div>
        }
        <div>
          <h3 class="mb-1 font-medium">Full call</h3>
          <pre class="whitespace-pre-wrap wrap-anywhere rounded-box bg-base-200 p-3 text-sm"><code>{{ call().text }}</code></pre>
        </div>
        @if (problem(); as message) {
          <p class="text-error text-sm">{{ message }}</p>
        }
        <button class="btn btn-primary" type="button" [disabled]="!!problem()" (click)="run()">Run call</button>
        <div role="status">
          @if (result(); as response) {
            <h3 class="mb-1 font-medium">{{ response.label }}</h3>
            <pre class="whitespace-pre-wrap wrap-anywhere rounded-box bg-base-200 p-3 text-sm">{{ response.text }}</pre>
          }
        </div>
      } @else {
        <p>Choose Developer under <strong>View as</strong> in the avatar menu to run service calls.</p>
      }
    </section>
  `,
})
export class Services {
  protected readonly canRunServices = inject(ViewerService).canRunServices;
  protected readonly operations = serviceOperations(inject(AdminService));
  protected readonly categories = SERVICE_CATEGORIES;
  private readonly selected = signal(0);
  protected readonly operation = computed(() => this.operations[this.selected()]);
  protected readonly categoryId = signal(this.categories[0].id);
  protected readonly days = signal('');
  protected readonly problem = computed(() =>
    this.operation().writes && this.days().trim() ? warningDaysProblem(Number(this.days())) : null,
  );
  protected readonly call = computed(() => this.operation().prepare(this.categoryId(), this.days()));
  protected readonly result = linkedSignal({
    source: () => [this.canRunServices(), this.call()],
    computation: (): { label: string; text: string } | null => null,
  });

  protected selectOperation(index: string): void {
    this.selected.set(Number(index));
  }

  protected run(): void {
    if (!this.canRunServices() || this.problem()) return;
    try {
      this.result.set({ label: 'Response', text: JSON.stringify(this.call().run(), null, 2) });
    } catch (error) {
      this.result.set({ label: 'Call failed', text: error instanceof Error ? error.message : String(error) });
    }
  }
}
