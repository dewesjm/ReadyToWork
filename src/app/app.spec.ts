import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('renders the brand, main navigation and the viewer initials', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('header')?.textContent).toContain('Ready to Work');
    const links = [...el.querySelectorAll('nav[aria-label="Main"] a')].map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toEqual(['Org tree', 'Issues', 'Admin']);
    expect(el.querySelector('rtw-avatar-menu button')?.textContent?.trim()).toBe('DA');
  });
});
