import { TestBed } from '@angular/core/testing';
import { addRequirement } from '../../../core';
import { CatalogItem } from '../../../data';
import { CRANE_PROGRAM_ID } from '../../../data/mock/fake-catalog';
import { ReadinessService } from '../../services/readiness-service';
import { SettingsService } from '../../services/settings-service';
import { DATA_SOURCE } from '../../services/tokens';
import { loadAppState, reloadAppState } from '../../testing';
import { AdminService } from './admin-service';

/**
 * M6 "Done when": adding a requirement to a program turns the right people red immediately,
 * and the settings survive a reload and an export/import round trip. Uses the real fake org.
 */
describe('M6 acceptance', () => {
  beforeEach(async () => {
    await loadAppState();
  });

  const statuses = () => new Map(TestBed.inject(ReadinessService).result().statusByPerson);
  const onCrane = (personId: string) =>
    TestBed.inject(SettingsService).settings().assignments[personId]?.includes(CRANE_PROGRAM_ID) ?? false;

  async function holders(itemId: string): Promise<Set<string>> {
    const records = await TestBed.inject(DATA_SOURCE).getRecords();
    return new Set(records.filter((r) => r.itemId === itemId).map((r) => r.personId));
  }

  it('adding a requirement turns exactly the people on the program who lack it red, at once', async () => {
    const firstAid = TestBed.inject(ReadinessService).catalog().find((c) => c.itemId === 'trn:first-aid')!;
    const hold = await holders(firstAid.itemId);
    const before = statuses();
    const shouldTurnRed = [...before.keys()].filter((id) => onCrane(id) && !hold.has(id));
    expect(shouldTurnRed.length).toBeGreaterThan(0);

    add(firstAid);
    const after = statuses();

    for (const id of shouldTurnRed) expect(after.get(id)).toBe('not-ready');
    const changed = [...after.keys()].filter((id) => after.get(id) !== before.get(id));
    // Only people on the program who lack the item change (some were already red).
    expect(changed.every((id) => shouldTurnRed.includes(id))).toBe(true);
    expect(changed.length).toBe(shouldTurnRed.filter((id) => before.get(id) !== 'not-ready').length);
    const checks = TestBed.inject(ReadinessService).result().checksByPerson.get(shouldTurnRed[0])!;
    expect(checks.find((c) => c.itemId === firstAid.itemId)).toEqual(
      expect.objectContaining({ status: 'not-ready', source: 'program', requiredBy: [CRANE_PROGRAM_ID] }),
    );
  });

  it('keeps the change after a reload', async () => {
    add(TestBed.inject(ReadinessService).catalog().find((c) => c.itemId === 'trn:first-aid')!);
    const settings = TestBed.inject(SettingsService).settings();
    const red = statuses();

    TestBed.resetTestingModule();
    await reloadAppState();
    expect(TestBed.inject(SettingsService).settings()).toEqual(settings);
    expect(statuses()).toEqual(red);
  });

  it('survives an export, reset and import round trip', async () => {
    add(TestBed.inject(ReadinessService).catalog().find((c) => c.itemId === 'trn:first-aid')!);
    const admin = TestBed.inject(AdminService);
    admin.edit((s) => ({ ...s, warningDays: { 'sap-password': 21 } }));
    const settings = TestBed.inject(SettingsService);
    const edited = settings.settings();
    const red = statuses();

    const file = settings.exportJson();
    admin.resetAdmin();
    expect(settings.settings()).not.toEqual(edited);
    admin.replace(settings.readFile(file));

    expect(settings.settings()).toEqual(edited);
    expect(statuses()).toEqual(red);
  });
});

function add(item: CatalogItem): void {
  TestBed.inject(AdminService).editPrograms((s) => addRequirement(s, CRANE_PROGRAM_ID, item));
}
