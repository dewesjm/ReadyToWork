import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { RELOAD_PAGE, UPDATE_CONFIG, UpdateService } from '../../services/update-service';
import { UpdatePrompt } from './update-prompt';

describe('UpdatePrompt', () => {
  const versionReady: VersionEvent = {
    type: 'VERSION_READY',
    currentVersion: { hash: 'old' },
    latestVersion: { hash: 'new' },
  };

  function setup(enabled = true) {
    const versionUpdates = new Subject<VersionEvent>();
    const unrecoverable = new Subject<{ type: 'UNRECOVERABLE_STATE'; reason: string }>();
    const checkForUpdate = vi.fn(() => Promise.resolve(false));
    const reload = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: { isEnabled: enabled, versionUpdates, unrecoverable, checkForUpdate } },
        { provide: RELOAD_PAGE, useValue: reload },
      ],
    });
    const fixture = TestBed.createComponent(UpdatePrompt);
    const el = fixture.nativeElement as HTMLElement;
    const prompt = () => el.querySelector('[data-testid="update-prompt"]');
    const render = () => fixture.whenStable();
    return { versionUpdates, unrecoverable, checkForUpdate, reload, el, prompt, render };
  }

  it('stays hidden until a new version is ready', async () => {
    const { versionUpdates, prompt, render } = setup();
    await render();
    expect(prompt()).toBeNull();

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'new' } });
    await render();
    expect(prompt()).toBeNull(); // still downloading

    versionUpdates.next(versionReady);
    await render();
    expect(prompt()!.textContent).toContain('A new version of Ready to Work is available.');
  });

  it('reloads the page on Refresh', async () => {
    const { versionUpdates, el, reload, render } = setup();
    versionUpdates.next(versionReady);
    await render();
    el.querySelector<HTMLButtonElement>('[data-testid="update-refresh"]')!.click();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('hides on Later and comes back for the next new version', async () => {
    const { versionUpdates, el, prompt, render } = setup();
    versionUpdates.next(versionReady);
    await render();
    el.querySelector<HTMLButtonElement>('[data-testid="update-later"]')!.click();
    await render();
    expect(prompt()).toBeNull();

    versionUpdates.next({ ...versionReady, latestVersion: { hash: 'newer' } });
    await render();
    expect(prompt()).not.toBeNull();
  });

  it('asks for a refresh when the cached app is broken', async () => {
    const { unrecoverable, prompt, render } = setup();
    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'files missing' });
    await render();
    expect(prompt()).not.toBeNull();
  });

  it('checks for a new version on a timer and when the tab comes back into view', async () => {
    vi.useFakeTimers();
    try {
      const { checkForUpdate } = setup();
      vi.advanceTimersByTime(UPDATE_CONFIG.checkEveryMs);
      expect(checkForUpdate).toHaveBeenCalledTimes(1);
      document.dispatchEvent(new Event('visibilitychange'));
      expect(checkForUpdate).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does nothing where the service worker is off', async () => {
    const { versionUpdates, checkForUpdate, prompt, render } = setup(false);
    versionUpdates.next(versionReady);
    await render();
    expect(prompt()).toBeNull();
    expect(TestBed.inject(UpdateService).available()).toBe(false);
    expect(checkForUpdate).not.toHaveBeenCalled();
  });
});
