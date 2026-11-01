import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DEFAULT_CONFIG, Rollup, STATUS_META, STATUSES, Status } from '../../../core';
import { ICONS } from '../icon/icons';
import { CategoryChip } from './category-chip';
import { Legend } from './legend';
import { RollupBadge } from './rollup-badge';
import { StatusBadge } from './status-badge';

@Component({
  imports: [StatusBadge, CategoryChip, RollupBadge],
  template: `
    <rtw-status-badge [status]="status()" [compact]="compact()" />
    <rtw-category-chip category="sap-password" [status]="status()" />
    <rtw-rollup-badge [rollup]="rollup()" />
  `,
})
class Host {
  status = signal<Status>('not-ready');
  compact = signal(false);
  rollup = signal<Rollup>({
    total: 23,
    counts: { 'not-ready': 2, expiring: 3, ready: 18 },
    worst: 'not-ready',
  });
}

describe('status pieces', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const text = (sel: string) => el.querySelector(sel)!.textContent!.replace(/\s+/g, ' ').trim();
    return { fixture, el, text, host: fixture.componentInstance };
  }

  it('has an icon for every status and category icon in the config', () => {
    for (const s of STATUSES) expect(ICONS[STATUS_META[s].icon]).toBeDefined();
    for (const c of DEFAULT_CONFIG.categories) expect(ICONS[c.icon]).toBeDefined();
  });

  it('shows every status as color, icon and text, also when compact', async () => {
    const { fixture, el, text, host } = await setup();
    for (const compact of [false, true]) {
      for (const s of STATUSES) {
        host.status.set(s);
        host.compact.set(compact);
        await fixture.whenStable();
        const badge = el.querySelector('rtw-status-badge .badge')!;
        expect(badge.className).toContain(`badge-${STATUS_META[s].color}`);
        expect(badge.className.includes('badge-sm')).toBe(compact);
        expect(badge.querySelector(`[data-icon="${STATUS_META[s].icon}"] svg *`)).not.toBeNull();
        expect(text('rtw-status-badge')).toBe(STATUS_META[s].label);
      }
    }
  });

  it('shows a category chip with its icon, label and status', async () => {
    const { fixture, el, text, host } = await setup();
    host.status.set('expiring');
    await fixture.whenStable();
    const chip = el.querySelector('rtw-category-chip .badge')!;
    expect(chip.className).toContain('badge-warning');
    expect(chip.querySelector('[data-icon="key-round"]')).not.toBeNull();
    expect(chip.querySelector('[data-icon="triangle-alert"]')).not.toBeNull();
    expect(text('rtw-category-chip')).toBe('SAP password : Expiring');
    expect(chip.getAttribute('title')).toBe('SAP password: Expiring');
  });

  it('words a roll-up worst first and hides zero counts', async () => {
    const { text } = await setup();
    expect(text('rtw-rollup-badge')).toBe('23 people: 2 not ready, 3 expiring, 18 ready');
  });

  it('keeps the total when everything else is zero, and says "person" for one', async () => {
    const { fixture, text, host } = await setup();
    host.rollup.set({ total: 1, counts: { 'not-ready': 0, expiring: 1, ready: 0 }, worst: 'expiring' });
    await fixture.whenStable();
    expect(text('rtw-rollup-badge')).toBe('1 person: 1 expiring');
  });

  it('opens the legend with all three statuses and closes it on Escape', async () => {
    const fixture = TestBed.createComponent(Legend);
    await fixture.whenStable();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    // Icon only: the name comes from aria-label.
    expect(button.textContent!.trim()).toBe('');
    expect(button.getAttribute('aria-label')).toBe('What the statuses mean');
    button.click();
    await fixture.whenStable();
    // The panel opens in the CDK overlay container at the end of the page.
    expect(document.querySelectorAll('#status-legend dt rtw-status-badge').length).toBe(3);
    // CDK reads keyCode, as real key presses set it.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));
    await fixture.whenStable();
    expect(document.querySelector('#status-legend')).toBeNull();
  });
});
