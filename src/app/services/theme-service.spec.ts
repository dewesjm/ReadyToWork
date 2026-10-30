import { TestBed } from '@angular/core/testing';
import { SETTINGS_STORAGE_KEY } from '../../data';
import { DEFAULT_THEME } from '../shared/themes';
import { SettingsService } from './settings-service';
import { ThemeService } from './theme-service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  const html = () => document.documentElement.getAttribute('data-theme');

  it('starts on the brand theme', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(service.theme()).toBe(DEFAULT_THEME);
    expect(html()).toBe(DEFAULT_THEME);
  });

  it('applies a picked theme and saves it in settings', () => {
    const service = TestBed.inject(ThemeService);
    service.set('navy-dark');
    TestBed.tick();
    expect(html()).toBe('navy-dark');
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!).preferences.theme).toBe('navy-dark');
  });

  it('restores the saved theme after a reload', async () => {
    TestBed.inject(SettingsService).updatePreferences({ theme: 'dracula' });
    TestBed.resetTestingModule();
    await TestBed.inject(SettingsService).load();
    expect(TestBed.inject(ThemeService).theme()).toBe('dracula');
  });

  it('rejects an unknown theme, and falls back from an unknown saved one', () => {
    const service = TestBed.inject(ThemeService);
    service.set('not-a-theme');
    expect(service.theme()).toBe(DEFAULT_THEME);
    TestBed.inject(SettingsService).updatePreferences({ theme: 'gone' });
    expect(service.theme()).toBe(DEFAULT_THEME);
  });
});
