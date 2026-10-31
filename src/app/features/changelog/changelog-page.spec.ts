import { TestBed } from '@angular/core/testing';
import { isIsoDate } from '../../../core';
import { CHANGELOG } from '../../changelog';
import { ChangelogPage } from './changelog-page';

describe('CHANGELOG', () => {
  it('has valid dates, newest first, one entry per day', () => {
    const dates = CHANGELOG.map((e) => e.date);
    expect(dates.every(isIsoDate)).toBe(true);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('has no empty entries', () => {
    for (const e of CHANGELOG) {
      expect([...(e.new ?? []), ...(e.changes ?? []), ...(e.fixes ?? [])].length).toBeGreaterThan(0);
    }
  });
});

describe('ChangelogPage', () => {
  it('lists each day with its New, Changes and Fixes, skipping empty sections', async () => {
    const fixture = TestBed.createComponent(ChangelogPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const entries = el.querySelectorAll('[data-testid="entry"]');
    expect(entries.length).toBe(CHANGELOG.length);

    const first = CHANGELOG[0];
    const headings = [...entries[0].querySelectorAll('h3')].map((h) => h.textContent!.trim());
    const expected = [
      first.new?.length ? 'New' : null,
      first.changes?.length ? 'Changes' : null,
      first.fixes?.length ? 'Fixes' : null,
    ].filter(Boolean);
    expect(headings).toEqual(expected);
    expect(entries[0].querySelectorAll('li').length).toBe(
      (first.new?.length ?? 0) + (first.changes?.length ?? 0) + (first.fixes?.length ?? 0),
    );
  });
});
