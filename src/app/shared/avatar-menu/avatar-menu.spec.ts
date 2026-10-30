import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../services/theme-service';
import { ALL_THEMES } from '../themes';
import { AvatarMenu } from './avatar-menu';

describe('AvatarMenu', () => {
  beforeEach(() => localStorage.clear());

  async function setup() {
    const fixture = TestBed.createComponent(AvatarMenu);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector('button')!;
    return { fixture, el, toggle };
  }

  it('shows initials and opens the theme list on click', async () => {
    const { fixture, el, toggle } = await setup();
    expect(toggle.textContent?.trim()).toBe('DA');
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelectorAll('[role="radio"]').length).toBe(ALL_THEMES.length);
    expect(el.textContent).toContain('Demo Admin');
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
