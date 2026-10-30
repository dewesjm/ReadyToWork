import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Readiness } from './readiness';

describe('Readiness', () => {
  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'readiness', component: Readiness }])],
    });
    const harness = await RouterTestingHarness.create(url);
    const el = harness.routeNativeElement as HTMLElement;
    const button = (label: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;
    return { harness, el, button, router: TestBed.inject(Router) };
  }

  it('defaults to the tree view with Issues only on', async () => {
    const { el, button } = await open('/readiness');
    expect(el.querySelector('rtw-org-tree')).not.toBeNull();
    expect(button('Tree').getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector<HTMLInputElement>('input.toggle')!.checked).toBe(true);
  });

  it('switches to the list view and keeps it in the URL', async () => {
    const { harness, el, button, router } = await open('/readiness');
    button('List').click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/readiness?view=list');
    expect(el.querySelector('rtw-issues-list')).not.toBeNull();
  });

  it('keeps Issues only off when switching views', async () => {
    const { harness, el, button, router } = await open('/readiness?issues=all');
    expect(el.querySelector<HTMLInputElement>('input.toggle')!.checked).toBe(false);
    button('List').click();
    await harness.fixture.whenStable();
    expect(router.url).toBe('/readiness?issues=all&view=list');
  });
});
