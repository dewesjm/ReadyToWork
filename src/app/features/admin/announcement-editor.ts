import { Component, computed, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ANNOUNCEMENT_CONFIG,
  AnnouncementDraft,
  AnnouncementType,
  announcementProblems,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from '../../../core';
import { AnnouncementStrip } from '../../shared/announcement-banner/announcement-strip';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { Icon } from '../../shared/icon/icon';
import { AdminService } from './admin-service';

const BLANK: AnnouncementDraft = { type: 'outage', message: '', startsOn: null, endsOn: null, on: true };

/**
 * New or existing notice (`id` "new" for a new one). Unlike the rest of Admin, nothing goes live
 * until Publish, so a half-typed message never shows in the banner.
 */
@Component({
  selector: 'rtw-announcement-editor',
  imports: [RouterLink, AnnouncementStrip, ConfirmDialog, Icon],
  template: `
    <a routerLink="/admin/announcements" class="btn btn-ghost btn-sm mb-3 -ml-2">
      <rtw-icon name="arrow-left" /> All announcements
    </a>
    @if (isNew() || existing()) {
      <form class="max-w-2xl space-y-5" novalidate (submit)="publish($event)">
        <h2 class="text-lg font-semibold">{{ isNew() ? 'New announcement' : 'Edit announcement' }}</h2>

        <fieldset class="space-y-1">
          <legend class="mb-1 text-sm font-medium">Type</legend>
          <div class="flex flex-wrap gap-4">
            @for (t of types; track t.id) {
              <label class="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="announcement-type"
                  class="radio radio-sm"
                  [attr.data-type]="t.id"
                  [checked]="draft().type === t.id"
                  (change)="setType(t.id)"
                />
                <rtw-icon [name]="t.icon" />
                {{ t.label }}
              </label>
            }
          </div>
        </fieldset>

        <div class="space-y-1">
          <label class="text-sm font-medium" for="announcement-message">Message</label>
          <textarea
            id="announcement-message"
            class="textarea w-full"
            rows="3"
            data-testid="message"
            [value]="draft().message"
            [attr.aria-invalid]="shown().message ? true : null"
            aria-describedby="announcement-message-help"
            (input)="change({ message: $any($event.target).value })"
          ></textarea>
          <p id="announcement-message-help" class="flex justify-between gap-3 text-sm">
            <span class="text-error" data-testid="message-problem">{{ shown().message }}</span>
            <span class="opacity-70" [class.text-error]="tooLong()">{{ length() }} / {{ max }}</span>
          </p>
        </div>

        <fieldset class="space-y-1">
          <legend class="mb-1 text-sm font-medium">Dates (optional)</legend>
          <div class="flex flex-wrap gap-4">
            <label class="flex flex-col gap-1 text-sm">
              First day
              <input
                type="date"
                class="input input-sm"
                data-testid="starts-on"
                [value]="draft().startsOn ?? ''"
                [attr.aria-invalid]="shown().dates ? true : null"
                (change)="change({ startsOn: $any($event.target).value || null })"
              />
            </label>
            <label class="flex flex-col gap-1 text-sm">
              Last day
              <input
                type="date"
                class="input input-sm"
                data-testid="ends-on"
                [value]="draft().endsOn ?? ''"
                [attr.aria-invalid]="shown().dates ? true : null"
                (change)="change({ endsOn: $any($event.target).value || null })"
              />
            </label>
          </div>
          <p class="text-sm opacity-70">
            Leave both empty to show it until it is turned off. Put times in the message.
          </p>
          @if (shown().dates; as problem) {
            <p class="text-sm text-error" data-testid="dates-problem">{{ problem }}</p>
          }
        </fieldset>

        <label class="flex w-fit cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            class="toggle toggle-sm"
            data-testid="on"
            [checked]="draft().on"
            (change)="change({ on: $any($event.target).checked })"
          />
          On
        </label>

        <section aria-labelledby="preview-heading" class="space-y-1">
          <h3 id="preview-heading" class="text-sm font-medium">Preview</h3>
          <rtw-announcement-strip
            class="block overflow-hidden rounded-box"
            data-testid="preview"
            [type]="draft().type"
            [message]="draft().message.trim() || 'Your message'"
            [closable]="types[draftTypeIndex()].dismissible"
          />
        </section>

        <div class="flex flex-wrap gap-2">
          <button type="submit" class="btn btn-primary" data-testid="publish">Publish</button>
          <a routerLink="/admin/announcements" class="btn btn-ghost" data-testid="cancel">Cancel</a>
          @if (!isNew()) {
            <button
              type="button"
              class="btn btn-outline btn-error ml-auto"
              data-testid="delete-announcement"
              (click)="askDelete()"
            >
              <rtw-icon name="trash-2" /> Delete
            </button>
          }
        </div>
      </form>

      <rtw-confirm-dialog #confirmDelete heading="Delete announcement?" confirmLabel="Delete" [danger]="true">
        It disappears from the banner for everyone. This can't be undone.
      </rtw-confirm-dialog>
    } @else {
      <div role="alert" class="alert" data-testid="announcement-not-found">
        <span>Announcement not found. It may have been deleted.</span>
        <a routerLink="/admin/announcements" class="link">All announcements</a>
      </div>
    }
  `,
})
export class AnnouncementEditor {
  /** Route parameter: an announcement id, or "new". */
  readonly id = input.required<string>();
  private readonly admin = inject(AdminService);
  private readonly router = inject(Router);
  private readonly confirmDelete = viewChild<ConfirmDialog>('confirmDelete');

  protected readonly max = ANNOUNCEMENT_CONFIG.maxMessageLength;
  protected readonly types = ANNOUNCEMENT_CONFIG.typeOrder.map((id) => ({ id, ...ANNOUNCEMENT_CONFIG.types[id] }));

  protected readonly isNew = computed(() => this.id() === 'new');
  protected readonly existing = computed(() => this.admin.announcements().find((a) => a.id === this.id()));
  /** The form's copy; the published notice changes only on Publish. */
  protected readonly draft = linkedSignal<AnnouncementDraft>(() => {
    const a = this.existing();
    return a ? { type: a.type, message: a.message, startsOn: a.startsOn, endsOn: a.endsOn, on: a.on } : { ...BLANK };
  });
  /** Problems show after the first Publish, then update as the admin fixes them. */
  private readonly tried = signal(false);
  protected readonly shown = computed(() => (this.tried() ? announcementProblems(this.draft()) : {}));
  protected readonly length = computed(() => this.draft().message.trim().length);
  protected readonly tooLong = computed(() => this.length() > this.max);
  protected readonly draftTypeIndex = computed(() => this.types.findIndex((t) => t.id === this.draft().type));

  protected setType(type: AnnouncementType): void {
    this.change({ type });
  }

  protected change(part: Partial<AnnouncementDraft>): void {
    this.draft.update((d) => ({ ...d, ...part }));
  }

  protected publish(event: Event): void {
    event.preventDefault();
    this.tried.set(true);
    const problems = announcementProblems(this.draft());
    if (problems.message || problems.dates) return;
    const draft = this.draft();
    this.admin.editAnnouncements((list) =>
      this.isNew() ? createAnnouncement(list, draft).list : updateAnnouncement(list, this.id(), draft),
    );
    void this.router.navigate(['/admin/announcements']);
  }

  protected async askDelete(): Promise<void> {
    if (!(await this.confirmDelete()?.ask())) return;
    this.admin.editAnnouncements((list) => deleteAnnouncement(list, this.id()));
    void this.router.navigate(['/admin/announcements']);
  }
}
