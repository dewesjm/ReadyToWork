import { TestBed } from '@angular/core/testing';
import { ReadinessService } from './services/readiness-service';
import { SettingsService } from './services/settings-service';

/** Test helper: start from empty browser storage and load settings and the fake org. */
export async function loadAppState(): Promise<void> {
  localStorage.clear();
  await reloadAppState();
}

/** Test helper: load settings and the fake org from what is already saved, as after a reload. */
export async function reloadAppState(): Promise<void> {
  await Promise.all([
    TestBed.inject(SettingsService).load(),
    TestBed.inject(ReadinessService).load(),
  ]);
}
