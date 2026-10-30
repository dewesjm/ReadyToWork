import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';

describe('Admin', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    await loadAppState();
  });

  it('opens on Programs, with a tab per section that changes the URL', async () => {
    TestBed.inject(ViewerService).setPersona('admin');
    const harness = await RouterTestingHarness.create('/admin');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/admin/programs');

    const el = harness.routeNativeElement as HTMLElement;
    const tabs = [...el.querySelectorAll<HTMLAnchorElement>('nav[aria-label="Admin sections"] a')];
    expect(tabs.map((t) => t.textContent?.trim())).toEqual(['Programs', 'Thresholds', 'Announcements', 'Settings file']);
    expect(tabs[0].getAttribute('aria-current')).toBe('page');

    tabs[1].click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/admin/thresholds');
    expect(tabs[1].classList).toContain('tab-active');
    expect(tabs[0].getAttribute('aria-current')).toBeNull();
  });

  it('tells other personas the screens are for admins, and shows no sections', async () => {
    const viewer = TestBed.inject(ViewerService);
    viewer.setPersona('admin');
    const harness = await RouterTestingHarness.create('/admin/thresholds');
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('rtw-thresholds')).not.toBeNull();

    for (const persona of ['foreman', 'superintendent', 'director']) {
      viewer.setPersona(persona);
      await harness.fixture.whenStable();
      expect(el.querySelector('[data-testid="admins-only"]')?.textContent).toContain('View as');
      expect(el.querySelector('nav[aria-label="Admin sections"]')).toBeNull();
      expect(el.querySelector('rtw-thresholds')).toBeNull();
    }
  });
});
