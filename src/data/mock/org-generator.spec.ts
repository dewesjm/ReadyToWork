import {
  DEFAULT_CONFIG,
  OrgIndex,
  ProgramRules,
  ReadinessEvaluator,
  RollupCalculator,
  STATUSES,
  StatusEngine,
  addDays,
  isIsoDate,
} from '../../core';
import { CRANE_PROGRAM_ID } from './fake-catalog';
import { MOCK_CONFIG } from './mock-config';
import { FakeOrg, generateOrg } from './org-generator';

const ANCHOR = '2026-10-30';
const evaluator = new ReadinessEvaluator(
  new StatusEngine(DEFAULT_CONFIG),
  new ProgramRules(),
  new RollupCalculator(),
);

function evaluate(org: FakeOrg, today = ANCHOR, assignments = org.assignments) {
  return evaluator.evaluate({ ...org, assignments, today });
}

describe('generateOrg', () => {
  const org = generateOrg(ANCHOR);
  const result = evaluate(org);
  const index = new OrgIndex(org.people);

  it('is the same every time for the same seed and date', () => {
    expect(generateOrg(ANCHOR)).toEqual(org);
  });

  it('differs for another seed', () => {
    const other = generateOrg(ANCHOR, { ...MOCK_CONFIG, seed: 7 });
    expect(other.people.map((p) => p.name)).not.toEqual(org.people.map((p) => p.name));
  });

  it('builds about 200 people, 5 levels deep, under one director', () => {
    expect(org.people.length).toBeGreaterThanOrEqual(150);
    expect(org.people.length).toBeLessThanOrEqual(260);
    expect(index.roots()).toHaveLength(1);
    const depth = Math.max(...org.people.map((p) => index.managerChain(p.id).length)) + 1;
    expect(depth).toBe(5);
  });

  it('gives everyone a unique id, employee id and name', () => {
    for (const key of ['id', 'employeeId', 'name'] as const) {
      expect(new Set(org.people.map((p) => p[key])).size).toBe(org.people.length);
    }
  });

  it('produces only valid dates', () => {
    for (const r of org.records) {
      for (const d of [r.lastSynced, r.expires, r.due, r.lastCheckIn]) {
        if (d !== undefined) expect(isIsoDate(d), `${r.itemId} ${d}`).toBe(true);
      }
    }
  });

  it('evaluates every person to their generated target status', () => {
    for (const p of org.people) {
      expect(result.statusByPerson.get(p.id), p.id).toBe(org.targets.get(p.id));
    }
  });

  it('hits the target status mix within 2%', () => {
    const n = org.people.length;
    for (const s of STATUSES) {
      const share = [...result.statusByPerson.values()].filter((v) => v === s).length / n;
      expect(Math.abs(share - MOCK_CONFIG.statusMix[s]), s).toBeLessThanOrEqual(0.02);
    }
  });

  it('spreads problems unevenly across crews', () => {
    const rates = index
      .roots()
      .flatMap((r) => index.subtree(r.id))
      .filter((p) => p.title === 'Foreman')
      .map((f) => {
        const crew = index.childrenOf(f.id);
        return crew.filter((c) => result.statusByPerson.get(c.id) !== 'ready').length / crew.length;
      });
    expect(Math.max(...rates) - Math.min(...rates)).toBeGreaterThanOrEqual(0.5);
  });

  describe('planted scenarios', () => {
    const s = org.scenarios;
    const crew = (foremanId: string) => index.childrenOf(foremanId);
    const checks = (id: string) => result.checksByPerson.get(id)!;

    it('has a crew with a cluster of expired tool calibrations', () => {
      const expiredTools = crew(s.toolCrewForemanId).filter((m) =>
        checks(m.id).some((c) => c.category === 'tool' && c.status === 'not-ready'),
      );
      expect(expiredTools.length).toBeGreaterThanOrEqual(MOCK_CONFIG.expiredToolPeople);
    });

    it('has a crew whose SAP passwords expire next week, red a month later', () => {
      for (const m of crew(s.sapCrewForemanId)) {
        const sap = checks(m.id).find((c) => c.category === 'sap-password')!;
        expect(sap.status).toBe('expiring');
        expect(sap.daysRemaining).toBeGreaterThanOrEqual(6);
        expect(sap.daysRemaining).toBeLessThanOrEqual(9);
      }
      const later = evaluate(org, addDays(ANCHOR, 30));
      for (const m of crew(s.sapCrewForemanId)) {
        expect(later.statusByPerson.get(m.id)).toBe('not-ready');
      }
    });

    it('has a green person who turns red when assigned Ridgeline R-01', () => {
      const id = s.craneCandidateId;
      expect(result.statusByPerson.get(id)).toBe('ready');
      const assigned = evaluate(org, ANCHOR, { ...org.assignments, [id]: [CRANE_PROGRAM_ID] });
      expect(assigned.statusByPerson.get(id)).toBe('not-ready');
      expect(assigned.checksByPerson.get(id)?.find((c) => c.source === 'program' && c.category === 'qualification')?.reason).toBe(
        'Missing, required by Ridgeline R-01 (supply ship)',
      );
    });
  });

  it('assigns default programs, and assigned people hold what they need', () => {
    const assigned = Object.keys(org.assignments);
    expect(assigned.length).toBeGreaterThan(20);
    const missing = assigned.flatMap((id) =>
      result.checksByPerson.get(id)!.filter((c) => c.source === 'program'),
    );
    expect(missing).toEqual([]);
  });

  it('offers five personas, including an admin', () => {
    expect(org.personas.map((p) => p.id)).toEqual(['foreman', 'general-foreman', 'superintendent', 'director', 'admin']);
    expect(org.personas.find((p) => p.id === 'foreman')?.personId).toBe(org.scenarios.toolCrewForemanId);
    // The general foreman is the tool crew foreman's own manager, with the General Foreman title.
    const gf = org.people.find((p) => p.id === org.personas.find((x) => x.id === 'general-foreman')?.personId)!;
    expect(gf.id).toBe(org.people.find((p) => p.id === org.scenarios.toolCrewForemanId)!.managerId);
    expect(gf.title).toBe('General Foreman');
    expect(org.personas.filter((p) => p.isAdmin)).toHaveLength(1);
  });

  it('looks the same on any anchor date', () => {
    const later = generateOrg('2027-03-15');
    const laterResult = evaluate(later, '2027-03-15');
    expect([...laterResult.statusByPerson.values()]).toEqual([...result.statusByPerson.values()]);
  });
});
