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

    for (const persona of ['foreman', 'general-foreman', 'superintendent', 'director']) {
      viewer.setPersona(persona);
      await harness.fixture.whenStable();
      expect(el.querySelector('[data-testid="admins-only"]')?.textContent).toContain('View as');
      expect(el.querySelector('nav[aria-label="Admin sections"]')).toBeNull();
      expect(el.querySelector('rtw-thresholds')).toBeNull();
    }
  });

  it('only lets Developer see and run the services, including after switching personas', async () => {
    const viewer = TestBed.inject(ViewerService);
    viewer.setPersona('admin');
    const harness = await RouterTestingHarness.create('/admin/services');
    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('Choose Developer');
    expect(el.querySelector('a[href="/admin/services"]')).toBeNull();
    expect(el.querySelector('rtw-services button')).toBeNull();

    viewer.setPersona('developer');
    await harness.fixture.whenStable();
    expect(el.querySelector('a[href="/admin/services"]')).not.toBeNull();
    expect(el.querySelector('rtw-services code')?.textContent).toBe('AdminService.warningWindows()');
    el.querySelector<HTMLButtonElement>('rtw-services button')!.click();
    await harness.fixture.whenStable();
    expect(el.querySelector('rtw-services [role="status"]')?.textContent).toContain('overridden');

    viewer.setPersona('admin');
    await harness.fixture.whenStable();
    expect(el.querySelector('rtw-services [role="status"]')).toBeNull();
  });

  it('runs the displayed write and shows the saved value in Thresholds', async () => {
    TestBed.inject(ViewerService).setPersona('developer');
    const harness = await RouterTestingHarness.create('/admin/services');
    const el = harness.routeNativeElement as HTMLElement;
    const operation = el.querySelector<HTMLSelectElement>('rtw-services select')!;
    operation.selectedIndex = [...operation.options].findIndex((o) => o.text === 'AdminService.setWarningWindow');
    operation.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();

    const category = el.querySelectorAll<HTMLSelectElement>('rtw-services select')[1].value;
    const days = el.querySelector<HTMLInputElement>('rtw-services input')!;
    const run = el.querySelector<HTMLButtonElement>('rtw-services button')!;
    days.value = '-1';
    days.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    expect(run.disabled).toBe(true);

    days.value = '17';
    days.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    expect(el.querySelector('rtw-services code')?.textContent).toBe(
      `AdminService.setWarningWindow(${JSON.stringify(category)}, 17)`,
    );
    run.click();
    await harness.fixture.whenStable();
    expect(el.querySelector('rtw-services [role="status"] pre')?.textContent).toBe('17');

    await harness.navigateByUrl('/admin/thresholds');
    expect(el.querySelector<HTMLInputElement>(`#warn-${category}`)?.value).toBe('17');
  });
});
