import { TestBed } from '@angular/core/testing';
import { MockDataSource } from '../../data';
import { addDays } from '../../core';
import { CRANE_PROGRAM_ID } from '../../data/mock/fake-catalog';
import { TestClock, loadAppState, useTestClock } from '../testing';
import { ReadinessService } from './readiness-service';
import { SettingsService } from './settings-service';
import { DATA_SOURCE } from './tokens';
import { ViewerService } from './viewer-service';

describe('ReadinessService (wired through DI)', () => {
  let readiness: ReadinessService;
  let settings: SettingsService;
  let clock: TestClock;
  let mock: MockDataSource;

  beforeEach(async () => {
    clock = useTestClock();
    await loadAppState();
    readiness = TestBed.inject(ReadinessService);
    settings = TestBed.inject(SettingsService);
    mock = TestBed.inject(DATA_SOURCE) as MockDataSource;
  });

  it('evaluates the whole fake org', () => {
    expect(readiness.loaded()).toBe(true);
    expect(readiness.result().statusByPerson.size).toBe(mock.fakeOrg().people.length);
    expect(readiness.personas()).toHaveLength(5);
  });

  it('turns the crane candidate red as soon as they are assigned the program', () => {
    const id = mock.fakeOrg().scenarios.craneCandidateId;
    expect(readiness.result().statusByPerson.get(id)).toBe('ready');
    settings.update((s) => ({ ...s, assignments: { ...s.assignments, [id]: [CRANE_PROGRAM_ID] } }));
    expect(readiness.result().statusByPerson.get(id)).toBe('not-ready');
  });

  it('recalculates when the date moves', () => {
    const sapForeman = mock.fakeOrg().scenarios.sapCrewForemanId;
    const crewRollup = () => readiness.result().rollups.get(sapForeman)!;
    expect(crewRollup().worst).toBe('expiring');
    const today = clock.date();
    clock.date.set(addDays(today, 30));
    expect(crewRollup().worst).toBe('not-ready');
    clock.date.set(today);
    expect(crewRollup().worst).toBe('expiring');
  });

  it('follows warning-window changes', () => {
    const before = [...readiness.result().statusByPerson.values()].filter((s) => s === 'expiring').length;
    settings.update((s) => ({ ...s, warningDays: { 'sap-password': 0, qualification: 0, training: 0 } }));
    const after = [...readiness.result().statusByPerson.values()].filter((s) => s === 'expiring').length;
    expect(after).toBeLessThan(before);
  });

  it('shows the chosen persona as the viewer', () => {
    const viewer = TestBed.inject(ViewerService);
    expect(viewer.persona()?.id).toBe('superintendent');
    viewer.setPersona('director');
    const director = mock.fakeOrg().people[0];
    expect(viewer.viewer()?.name).toBe(director.name);
    expect(viewer.initials()).toBe(
      director.name.split(' ').map((w) => w[0]).join(''),
    );
  });

  it('keeps preference changes after a reload', async () => {
    settings.updatePreferences({ layout: 'drilldown' });
    TestBed.resetTestingModule();
    await TestBed.inject(SettingsService).load();
    expect(TestBed.inject(SettingsService).preferences().layout).toBe('drilldown');
  });
});
