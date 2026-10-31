import { TestBed } from '@angular/core/testing';
import { MockDataSource } from '../../data';
import { CRANE_PROGRAM_ID } from '../../data/mock/fake-catalog';
import { loadAppState } from '../testing';
import { ClockService } from './clock-service';
import { ReadinessService } from './readiness-service';
import { SettingsService } from './settings-service';
import { DATA_SOURCE } from './tokens';
import { ViewerService } from './viewer-service';

describe('ReadinessService (wired through DI)', () => {
  let readiness: ReadinessService;
  let settings: SettingsService;
  let clock: ClockService;
  let mock: MockDataSource;

  beforeEach(async () => {
    await loadAppState();
    readiness = TestBed.inject(ReadinessService);
    settings = TestBed.inject(SettingsService);
    clock = TestBed.inject(ClockService);
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

  it('recalculates when the demo date moves, and resets to the real date', () => {
    const sapForeman = mock.fakeOrg().scenarios.sapCrewForemanId;
    const crewRollup = () => readiness.result().rollups.get(sapForeman)!;
    expect(crewRollup().worst).toBe('expiring');
    clock.advance(30);
    expect(clock.isOverridden()).toBe(true);
    expect(crewRollup().worst).toBe('not-ready');
    clock.reset();
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
    expect(viewer.persona()?.id).toBe('foreman');
    viewer.setPersona('director');
    const director = mock.fakeOrg().people[0];
    expect(viewer.viewer()?.name).toBe(director.name);
    expect(viewer.initials()).toBe(
      director.name.split(' ').map((w) => w[0]).join(''),
    );
  });

  it('keeps settings changes after a reload, until reset', async () => {
    clock.set('2027-01-01');
    TestBed.resetTestingModule();
    await TestBed.inject(SettingsService).load();
    expect(TestBed.inject(ClockService).today()).toBe('2027-01-01');
    await TestBed.inject(SettingsService).reset();
    expect(TestBed.inject(ClockService).isOverridden()).toBe(false);
  });
});
