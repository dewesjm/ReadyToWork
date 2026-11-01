import { TestBed } from '@angular/core/testing';
import { Announcement, createAnnouncement, dismissKey } from '../../../core';
import { MockDataSource } from '../../../data';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { TestClock, loadAppState, reloadAppState, useTestClock } from '../../testing';
import { AnnouncementBanner } from './announcement-banner';

describe('AnnouncementBanner', () => {
  let clock: TestClock;
  beforeEach(async () => {
    clock = useTestClock();
    await loadAppState();
  });

  const settings = () => TestBed.inject(SettingsService);
  const sample = () => (TestBed.inject(DATA_SOURCE) as MockDataSource).fakeOrg().announcements[0];

  async function render() {
    const fixture = TestBed.createComponent(AnnouncementBanner);
    const el = fixture.nativeElement as HTMLElement;
    const notices = () => [...el.querySelectorAll<HTMLElement>('[data-testid="announcement"]')];
    const types = () => notices().map((n) => n.dataset['type']);
    const stable = () => fixture.whenStable();
    await stable();
    return { el, notices, types, stable };
  }

  function post(over: Partial<Announcement>): string {
    let id = '';
    settings().update((s) => {
      const created = createAnnouncement(s.announcements, {
        type: 'outage', message: 'SAP is down', startsOn: null, endsOn: null, on: true, ...over,
      });
      id = created.id;
      return { ...s, announcements: created.list };
    });
    return id;
  }

  it('shows the sample Delayed notice with its icon, type word and message', async () => {
    const { notices } = await render();
    expect(notices().length).toBe(1);
    expect(notices()[0].textContent).toContain('Delayed');
    expect(notices()[0].textContent).toContain(sample().message);
    expect(notices()[0].querySelector('rtw-icon')!.getAttribute('data-icon')).toBe('clock');
  });

  it('shows outages first, then delays, then info, as soon as they are posted', async () => {
    const { types, stable } = await render();
    post({ type: 'info', message: 'New badge readers next week' });
    post({ type: 'outage' });
    await stable();
    expect(types()).toEqual(['outage', 'delayed', 'info']);
  });

  it('shows a dated notice only from its start day through its end day', async () => {
    const { types, stable } = await render();
    const today = clock.date();
    post({ startsOn: '2099-01-02', endsOn: '2099-01-03' });
    await stable();
    expect(types()).toEqual(['delayed']);
    clock.date.set('2099-01-02');
    await stable();
    expect(types()).toEqual(['outage', 'delayed']);
    clock.date.set('2099-01-04');
    await stable();
    expect(types()).toEqual(['delayed']);
    expect(today < '2099-01-02').toBe(true);
  });

  it('has no close button on any notice', async () => {
    const { notices, stable } = await render();
    post({ type: 'outage' });
    post({ type: 'info', message: 'New badge readers next week' });
    await stable();
    expect(notices().length).toBe(3);
    expect(notices().every((n) => !n.querySelector('[data-testid="dismiss"]'))).toBe(true);
  });

  it('shows a notice the viewer closed back when closing was allowed', async () => {
    settings().updatePreferences({ dismissedAnnouncements: [dismissKey(sample())] });
    await reloadAppState();
    const { notices } = await render();
    expect(notices().length).toBe(1);
    expect(notices()[0].textContent).toContain(sample().message);
  });

  it('hides notices that are turned off', async () => {
    const { notices, stable } = await render();
    settings().update((s) => ({ ...s, announcements: s.announcements.map((a) => ({ ...a, on: false })) }));
    await stable();
    expect(notices().length).toBe(0);
  });
});
