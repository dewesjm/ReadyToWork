import { DEFAULT_CONFIG, ReadinessConfig } from './config';
import { SourceRecord } from './model';
import { StatusEngine, compareStatus, worstStatus } from './status-engine';

const TODAY = '2026-11-01';

/** SAP password: 14-day warning window. */
function sap(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    personId: 'p1',
    category: 'sap-password',
    itemId: 'sap:prd',
    itemName: 'SAP PRD password',
    source: 'sap',
    lastSynced: TODAY,
    ...overrides,
  };
}

describe('StatusEngine', () => {
  const engine = new StatusEngine(DEFAULT_CONFIG);
  const evaluate = (r: Partial<SourceRecord>) => engine.evaluate(sap(r), TODAY);

  describe('expiry dates (valid through the date)', () => {
    it('is ready outside the warning window', () => {
      const c = evaluate({ expires: '2026-11-16' }); // 15 days
      expect(c.status).toBe('ready');
      expect(c.daysRemaining).toBe(15);
      expect(c.reason).toBe('Valid through Nov 16, 2026');
    });

    it('is expiring exactly on the window boundary', () => {
      const c = evaluate({ expires: '2026-11-15' }); // 14 days
      expect(c.status).toBe('expiring');
      expect(c.reason).toBe('Expires in 14 days');
    });

    it('is expiring on the expiry date itself', () => {
      const c = evaluate({ expires: TODAY });
      expect(c.status).toBe('expiring');
      expect(c.daysRemaining).toBe(0);
      expect(c.reason).toBe('Expires today');
    });

    it('is not ready the day after', () => {
      const c = evaluate({ expires: '2026-10-31' });
      expect(c.status).toBe('not-ready');
      expect(c.daysRemaining).toBe(-1);
      expect(c.reason).toBe('Expired 1 day ago');
    });

    it('uses each category its own window', () => {
      // 40 days out: inside qualifications' 60, outside SAP's 14.
      expect(evaluate({ expires: '2026-12-11' }).status).toBe('ready');
      expect(evaluate({ category: 'qualification', expires: '2026-12-11' }).status).toBe('expiring');
    });

    it('falls back to the default window for an unknown category', () => {
      const c = evaluate({ category: 'something-new', expires: '2026-11-25' }); // 24 days, default 30
      expect(c.status).toBe('expiring');
    });

    it('follows a changed window', () => {
      const config: ReadinessConfig = {
        ...DEFAULT_CONFIG,
        categories: DEFAULT_CONFIG.categories.map((c) =>
          c.id === 'sap-password' ? { ...c, warningDays: 3 } : c,
        ),
      };
      const c = new StatusEngine(config).evaluate(sap({ expires: '2026-11-05' }), TODAY);
      expect(c.status).toBe('ready');
    });
  });

  describe('training (completed / due)', () => {
    const training = (r: Partial<SourceRecord>) => evaluate({ category: 'training', ...r });

    it('is ready when completed', () => {
      const c = training({ completed: true, due: '2026-10-01' });
      expect(c.status).toBe('ready');
      expect(c.reason).toBe('Completed');
    });

    it('is expiring when due within the window', () => {
      expect(training({ completed: false, due: '2026-11-20' }).reason).toBe('Due in 19 days');
      expect(training({ completed: false, due: TODAY }).reason).toBe('Due today');
    });

    it('is not ready when overdue', () => {
      const c = training({ completed: false, due: '2026-10-29' });
      expect(c.status).toBe('not-ready');
      expect(c.reason).toBe('Overdue by 3 days');
    });

    it('judges completed training that expires by its expiry', () => {
      expect(training({ completed: true, expires: '2026-10-15' }).status).toBe('not-ready');
    });
  });

  describe('device check-in (yellow at 14 days, red at 30)', () => {
    const device = (r: Partial<SourceRecord>) => evaluate({ category: 'device', ...r });

    it('is ready when recently checked in', () => {
      expect(device({ lastCheckIn: TODAY }).reason).toBe('Checked in today');
      expect(device({ lastCheckIn: '2026-10-19' }).status).toBe('ready'); // 13 days
    });

    it('is expiring from 14 days', () => {
      const c = device({ lastCheckIn: '2026-10-18' });
      expect(c.status).toBe('expiring');
      expect(c.reason).toBe('No check-in for 14 days');
      expect(c.daysRemaining).toBe(15);
    });

    it('is not ready from 30 days', () => {
      expect(device({ lastCheckIn: '2026-10-03' }).status).toBe('expiring'); // 29 days
      const c = device({ lastCheckIn: '2026-10-02' }); // 30 days
      expect(c.status).toBe('not-ready');
      // Last good day was day 29, matching "valid through" for expiry dates.
      expect(c.daysRemaining).toBe(-1);
    });

    it('takes the worse of access expiry and check-in', () => {
      const c = device({ lastCheckIn: TODAY, expires: '2026-11-05' });
      expect(c.status).toBe('expiring');
      expect(c.reason).toBe('Expires in 4 days');
    });
  });

  describe('problems and missing data', () => {
    it('is not ready for missing, lost or revoked', () => {
      expect(evaluate({ problem: 'missing' }).reason).toBe('Missing');
      expect(evaluate({ problem: 'lost', expires: '2027-06-01' }).status).toBe('not-ready');
      expect(evaluate({ problem: 'revoked' }).reason).toBe('Revoked');
    });

    it('is not ready with no data', () => {
      const c = evaluate({});
      expect(c.status).toBe('not-ready');
      expect(c.reason).toBe('No data');
    });
  });

  describe('out-of-date sources (default limit 3 days)', () => {
    it('is fresh up to the limit', () => {
      const c = evaluate({ expires: '2027-01-01', lastSynced: '2026-10-29' });
      expect(c.stale).toBe(false);
      expect(c.status).toBe('ready');
    });

    it('flags data past the limit but still judges ready by its dates', () => {
      const c = evaluate({ expires: '2027-01-01', lastSynced: '2026-10-28' });
      expect(c.stale).toBe(true);
      expect(c.status).toBe('ready');
      expect(c.reason).toBe('Valid through Jan 1, 2027');
    });

    it('keeps expiring yellow', () => {
      expect(evaluate({ expires: '2026-11-03', lastSynced: '2026-10-01' }).status).toBe('expiring');
    });

    it('keeps expired red', () => {
      const c = evaluate({ expires: '2026-10-15', lastSynced: '2026-10-01' });
      expect(c.stale).toBe(true);
      expect(c.status).toBe('not-ready');
      expect(c.reason).toBe('Expired 17 days ago');
    });

    it('uses a per-source limit when set', () => {
      const engine10 = new StatusEngine({ ...DEFAULT_CONFIG, staleAfterDays: { sap: 10 } });
      expect(engine10.evaluate(sap({ lastSynced: '2026-10-25' }), TODAY).stale).toBe(false);
    });
  });
});

describe('worstStatus', () => {
  it('ranks red > yellow > green', () => {
    expect(worstStatus(['ready', 'expiring'])).toBe('expiring');
    expect(worstStatus(['ready', 'expiring', 'ready'])).toBe('expiring');
    expect(worstStatus(['expiring', 'not-ready', 'ready'])).toBe('not-ready');
    expect(worstStatus([])).toBeNull();
  });

  it('sorts worst first with compareStatus', () => {
    expect(['ready', 'not-ready', 'expiring'].sort(compareStatus as never)).toEqual([
      'not-ready',
      'expiring',
      'ready',
    ]);
  });
});
