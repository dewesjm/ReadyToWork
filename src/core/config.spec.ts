import { DEFAULT_CONFIG, STATUSES, STATUS_META } from './config';

describe('default config', () => {
  it('has unique category ids with positive warning windows', () => {
    const ids = DEFAULT_CONFIG.categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of DEFAULT_CONFIG.categories) expect(c.warningDays).toBeGreaterThan(0);
  });

  it('uses the agreed warning windows', () => {
    const days = Object.fromEntries(DEFAULT_CONFIG.categories.map((c) => [c.id, c.warningDays]));
    expect(days).toMatchObject({
      'sap-password': 14,
      network: 30,
      training: 30,
      qualification: 60,
      tool: 30,
      yubikey: 30,
      device: 14,
    });
  });

  it('turns devices yellow before red', () => {
    const { expiringAfterDays, notReadyAfterDays } = DEFAULT_CONFIG.deviceCheckIn;
    expect(expiringAfterDays).toBeLessThan(notReadyAfterDays);
  });

  it('ranks red > yellow > green, and STATUSES is worst first', () => {
    const ranks = STATUSES.map((s) => STATUS_META[s].rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => b - a));
    expect(STATUSES).toEqual(['not-ready', 'expiring', 'ready']);
  });
});
