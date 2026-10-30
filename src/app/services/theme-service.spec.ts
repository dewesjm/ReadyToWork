import { TestBed } from '@angular/core/testing';
import { DEFAULT_THEME, THEME_STORAGE_KEY } from '../shared/themes';
import { ThemeService } from './theme-service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('starts on the brand theme when nothing is saved', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe(DEFAULT_THEME);
    expect(document.documentElement.getAttribute('data-theme')).toBe(DEFAULT_THEME);
  });

  it('restores a saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dracula');
    expect(TestBed.inject(ThemeService).theme()).toBe('dracula');
  });

  it('ignores an unknown saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'not-a-theme');
    expect(TestBed.inject(ThemeService).theme()).toBe(DEFAULT_THEME);
  });

  it('applies and saves a picked theme', () => {
    const service = TestBed.inject(ThemeService);
    service.set('navy-dark');
    expect(service.theme()).toBe('navy-dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('navy-dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('navy-dark');
  });

  it('rejects an unknown theme', () => {
    const service = TestBed.inject(ThemeService);
    service.set('not-a-theme');
    expect(service.theme()).toBe(DEFAULT_THEME);
  });
});
