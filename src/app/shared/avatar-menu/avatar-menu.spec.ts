import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../services/theme-service';
import { ViewerService } from '../../services/viewer-service';
import { loadAppState } from '../../testing';
import { ALL_THEMES } from '../themes';
import { AvatarMenu } from './avatar-menu';

describe('AvatarMenu', () => {
  beforeEach(loadAppState);

  async function setup() {
    const fixture = TestBed.createComponent(AvatarMenu);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector('button')!;
    return { fixture, el, toggle };
  }

  it('shows initials and opens the theme list on click', async () => {
    const { fixture, el, toggle } = await setup();
    const viewer = TestBed.inject(ViewerService).viewer()!;
    expect(toggle.textContent?.trim()).toBe(TestBed.inject(ViewerService).initials());
    expect(toggle.textContent?.trim()).toMatch(/^[A-Z]{2}$/);
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('[role="radio"]').length).toBe(ALL_THEMES.length);
    expect(el.textContent).toContain(viewer.name);
  });

  it('picks a theme and marks it checked', async () => {
    const { fixture, el, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('[data-theme-option="nord"]')!.click();
    await fixture.whenStable();
    expect(TestBed.inject(ThemeService).theme()).toBe('nord');
    expect(el.querySelector('[data-theme-option="nord"]')?.getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('closes on a click outside', async () => {
    const { fixture, el, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();

    document.body.click();
    await fixture.whenStable();
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
  });
});
