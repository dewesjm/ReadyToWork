import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { QuickLinksMenu } from './quick-links-menu';

describe('QuickLinksMenu', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'changelog', children: [] }])],
    });
  });

  async function setup() {
    const fixture = TestBed.createComponent(QuickLinksMenu);
    await fixture.whenStable();
    const toggle = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    // The panel opens in the CDK overlay container at the end of the page.
    return { fixture, panel: () => document.querySelector('#quick-links-panel'), toggle };
  }

  it('opens to the Change log link, which goes there and closes the menu', async () => {
    const { fixture, panel, toggle } = await setup();
    expect(panel()).toBeNull();
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const link = panel()!.querySelector<HTMLAnchorElement>('[data-testid="changelog-link"]')!;
    expect(link.getAttribute('href')).toBe('/changelog');
    expect(link.querySelector('[data-icon="history"]')).not.toBeNull();

    link.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/changelog');
    expect(panel()).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape', async () => {
    const { fixture, panel, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    await fixture.whenStable();
    expect(panel()).toBeNull();
  });
});
