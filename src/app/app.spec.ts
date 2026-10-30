import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { ViewerService } from './services/viewer-service';
import { loadAppState } from './testing';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
    await loadAppState();
  });

  it('renders the brand, main navigation and the viewer initials', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('header')?.textContent).toContain('Ready to Work');
    const links = [...el.querySelectorAll('nav[aria-label="Main"] a')].map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual(['Readiness', 'Admin']);
    expect(el.querySelector('rtw-avatar-menu button')?.textContent?.trim()).toBe(
      TestBed.inject(ViewerService).initials(),
    );
    expect(TestBed.inject(ViewerService).initials()).not.toBe('?');
  });
});
