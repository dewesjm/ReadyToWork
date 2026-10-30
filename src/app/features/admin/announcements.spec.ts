import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SettingsService } from '../../services/settings-service';
import { ViewerService } from '../../services/viewer-service';
import { AnnouncementBanner } from '../../shared/announcement-banner/announcement-banner';
import { loadAppState, stubDialogs } from '../../testing';

describe('Admin announcements', () => {
  beforeEach(async () => {
    stubDialogs();
    TestBed.configureTestingModule({ providers: [provideRouter(routes, withComponentInputBinding())] });
    await loadAppState();
    TestBed.inject(ViewerService).setPersona('admin');
  });

  async function open(url: string) {
    const harness = await RouterTestingHarness.create(url);
    const el = () => harness.routeNativeElement as HTMLElement;
    const $ = <T extends Element = HTMLElement>(sel: string) => el().querySelector<T & Element>(sel) as T;
    const stable = () => harness.fixture.whenStable();
    const type = async (sel: string, value: string) => {
      const input = $<HTMLInputElement | HTMLTextAreaElement>(sel);
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await stable();
    };
    const pick = async (sel: string, value: string) => {
      const input = $<HTMLInputElement>(sel);
      input.value = value;
      input.dispatchEvent(new Event('change'));
      await stable();
    };
    const click = async (sel: string) => {
      $<HTMLElement>(sel).click();
      await stable();
    };
    return { harness, el, $, stable, type, pick, click };
  }

  /** The shell's banner, rendered beside the routed admin page. */
  async function banner() {
    const fixture = TestBed.createComponent(AnnouncementBanner);
    await fixture.whenStable();
    return async () => {
      await fixture.whenStable();
      const strips = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[data-testid="announcement"]')];
      return strips.map((s) => s.dataset['type']);
    };
  }

  const announcements = () => TestBed.inject(SettingsService).settings().announcements;
  const url = () => TestBed.inject(Router).url;

  it('lists notices with their state and schedule, under their own Admin tab', async () => {
    const { el, $ } = await open('/admin/announcements');
    const tabs = [...el().querySelectorAll('nav[aria-label="Admin sections"] a')].map((a) => a.textContent?.trim());
    expect(tabs).toContain('Announcements');
    const card = $(`[data-announcement="${announcements()[0].id}"]`);
    expect(card.textContent).toContain('Delayed');
    expect(card.querySelector('[data-testid="state"]')!.textContent).toContain('Live');
    expect(card.textContent).toContain('Always');
  });

  it('turns a notice off from the list at once', async () => {
    const shown = await banner();
    const { $, stable } = await open('/admin/announcements');
    expect(await shown()).toEqual(['delayed']);

    const toggle = $<HTMLInputElement>('[data-testid="on"]');
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    await stable();
    expect(announcements()[0].on).toBe(false);
    expect($('[data-testid="state"]').textContent).toContain('Off');
    expect(await shown()).toEqual([]);
  });

  it('publishes a new outage, which shows in the banner at once, outages first', async () => {
    const shown = await banner();
    const { $, type, click } = await open('/admin/announcements');
    await click('[data-testid="new-announcement"]');
    expect(url()).toBe('/admin/announcements/new');

    await type('[data-testid="message"]', 'SAP is down Saturday 6 am to noon.');
    expect($('[data-testid="preview"]').textContent).toContain('Outage');
    expect($('[data-testid="preview"]').textContent).toContain('SAP is down Saturday 6 am to noon.');
    // Nothing is live until Publish.
    expect(announcements().length).toBe(1);
    expect(await shown()).toEqual(['delayed']);

    await click('[data-testid="publish"]');
    expect(url()).toBe('/admin/announcements');
    expect(announcements()[0]).toMatchObject({ type: 'outage', message: 'SAP is down Saturday 6 am to noon.', on: true });
    expect(await shown()).toEqual(['outage', 'delayed']);
  });

  it('refuses to publish without a message or with the end before the start', async () => {
    const { $, type, pick, click } = await open('/admin/announcements/new');
    await click('[data-testid="publish"]');
    expect($('[data-testid="message-problem"]').textContent).toContain('Enter a message.');
    expect(url()).toBe('/admin/announcements/new');

    await type('[data-testid="message"]', 'Badge readers being replaced');
    expect($('[data-testid="message-problem"]').textContent?.trim()).toBe('');
    await pick('[data-testid="starts-on"]', '2026-11-05');
    await pick('[data-testid="ends-on"]', '2026-11-03');
    await click('[data-testid="publish"]');
    expect($('[data-testid="dates-problem"]').textContent).toContain('The end date is before the start date.');
    expect(announcements().length).toBe(1);

    await pick('[data-testid="ends-on"]', '2026-11-06');
    await click('[data-testid="publish"]');
    expect(announcements()[0]).toMatchObject({ startsOn: '2026-11-05', endsOn: '2026-11-06' });
  });

  it('Cancel leaves a notice as it was', async () => {
    const before = announcements()[0];
    const { type, click } = await open(`/admin/announcements/${before.id}`);
    await type('[data-testid="message"]', 'Draft that is never published');
    await click('[data-testid="cancel"]');
    expect(url()).toBe('/admin/announcements');
    expect(announcements()[0]).toEqual(before);
  });

  it('publishes an edit with a new revision', async () => {
    const { id, message } = announcements()[0];
    const { $, type, click } = await open(`/admin/announcements/${id}`);
    expect($<HTMLTextAreaElement>('[data-testid="message"]').value).toBe(message);
    await click('[data-type="info"]');
    await type('[data-testid="message"]', 'Training records are up to date again.');
    await click('[data-testid="publish"]');
    expect(announcements()[0]).toMatchObject({
      id,
      type: 'info',
      message: 'Training records are up to date again.',
      revision: 2,
    });
  });

  it('asks before deleting', async () => {
    const id = announcements()[0].id;
    const { $, stable, click } = await open(`/admin/announcements/${id}`);
    const answer = async (value: 'yes' | 'no') => {
      await click('[data-testid="delete-announcement"]');
      const dialog = $<HTMLDialogElement>('dialog');
      expect(dialog.hasAttribute('open')).toBe(true);
      dialog.querySelector<HTMLButtonElement>(`button[value="${value}"]`)!.click();
      await stable();
    };
    await answer('no');
    expect(announcements().length).toBe(1);
    await answer('yes');
    await stable();
    expect(announcements()).toEqual([]);
    expect(url()).toBe('/admin/announcements');
  });

  it('says when an announcement is not found', async () => {
    const { $ } = await open('/admin/announcements/nope');
    expect($('[data-testid="announcement-not-found"]').textContent).toContain('Announcement not found');
  });
});
