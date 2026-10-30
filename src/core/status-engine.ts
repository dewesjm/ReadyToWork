import { ReadinessConfig, STATUS_META } from './config';
import { IsoDate, addDays, daysBetween } from './dates';
import { formatDate } from './format';
import { CategoryId, Check, RecordProblem, SourceRecord, Status } from './model';

/** Worst of the given statuses, or null when there are none. */
export function worstStatus(statuses: Iterable<Status>): Status | null {
  let worst: Status | null = null;
  for (const s of statuses) {
    if (worst === null || STATUS_META[s].rank > STATUS_META[worst].rank) worst = s;
  }
  return worst;
}

/** Sort comparator: worse status first. */
export function compareStatus(a: Status, b: Status): number {
  return STATUS_META[b].rank - STATUS_META[a].rank;
}

const PROBLEM_REASONS: Record<RecordProblem, string> = {
  missing: 'Missing',
  lost: 'Reported lost',
  revoked: 'Revoked',
};

type Verdict = Pick<Check, 'status' | 'reason' | 'dueDate' | 'daysRemaining'>;

/** Turns one source record into one check, given today's date. */
export class StatusEngine {
  private readonly warningDaysByCategory: Map<CategoryId, number>;

  constructor(private readonly config: ReadinessConfig) {
    this.warningDaysByCategory = new Map(config.categories.map((c) => [c.id, c.warningDays]));
  }

  warningDays(category: CategoryId): number {
    return this.warningDaysByCategory.get(category) ?? this.config.defaultWarningDays;
  }

  isStale(record: SourceRecord, today: IsoDate): boolean {
    const limit = this.config.staleAfterDays[record.source] ?? this.config.defaultStaleAfterDays;
    return daysBetween(record.lastSynced, today) > limit;
  }

  evaluate(record: SourceRecord, today: IsoDate): Check {
    const stale = this.isStale(record, today);
    let verdict = this.judge(record, today);
    // Out-of-date data can't vouch for green or yellow, but expired is still expired.
    if (stale && verdict.status !== 'not-ready') {
      verdict = {
        ...verdict,
        status: 'unknown',
        reason: `Data out of date (last synced ${formatDate(record.lastSynced)})`,
      };
    }
    return {
      personId: record.personId,
      category: record.category,
      itemId: record.itemId,
      itemName: record.itemName,
      source: record.source,
      lastSynced: record.lastSynced,
      stale,
      requiredBy: [],
      ...verdict,
    };
  }

  private judge(record: SourceRecord, today: IsoDate): Verdict {
    if (record.problem) return { status: 'not-ready', reason: PROBLEM_REASONS[record.problem] };

    const warn = this.warningDays(record.category);
    const verdicts: Verdict[] = [];
    if (record.expires) verdicts.push(byDate(record.expires, today, warn, 'expires'));
    if (record.completed) {
      if (!record.expires) verdicts.push({ status: 'ready', reason: 'Completed' });
    } else if (record.due) {
      verdicts.push(byDate(record.due, today, warn, 'due'));
    }
    if (record.lastCheckIn) verdicts.push(this.byCheckIn(record.lastCheckIn, today));

    if (verdicts.length === 0) return { status: 'unknown', reason: 'No data' };
    // Worst wins; on a tie, the one due soonest.
    return verdicts.reduce((a, b) => {
      const byStatus = compareStatus(a.status, b.status);
      if (byStatus !== 0) return byStatus < 0 ? a : b;
      return (b.daysRemaining ?? Infinity) < (a.daysRemaining ?? Infinity) ? b : a;
    });
  }

  private byCheckIn(lastCheckIn: IsoDate, today: IsoDate): Verdict {
    const { expiringAfterDays, notReadyAfterDays } = this.config.deviceCheckIn;
    const age = Math.max(0, daysBetween(lastCheckIn, today));
    const dueDate = addDays(lastCheckIn, notReadyAfterDays - 1);
    const daysRemaining = daysBetween(today, dueDate);
    if (age >= expiringAfterDays) {
      return {
        status: age >= notReadyAfterDays ? 'not-ready' : 'expiring',
        reason: `No check-in for ${plural(age, 'day')}`,
        dueDate,
        daysRemaining,
      };
    }
    return {
      status: 'ready',
      reason: age === 0 ? 'Checked in today' : `Checked in ${plural(age, 'day')} ago`,
      dueDate,
      daysRemaining,
    };
  }
}

/** Valid or due through `date` (inclusive); yellow within `warn` days of it. */
function byDate(date: IsoDate, today: IsoDate, warn: number, kind: 'expires' | 'due'): Verdict {
  const days = daysBetween(today, date);
  const at = { dueDate: date, daysRemaining: days };
  if (days < 0) {
    const ago = plural(-days, 'day');
    return { status: 'not-ready', reason: kind === 'expires' ? `Expired ${ago} ago` : `Overdue by ${ago}`, ...at };
  }
  if (days <= warn) {
    const verb = kind === 'expires' ? 'Expires' : 'Due';
    return { status: 'expiring', reason: days === 0 ? `${verb} today` : `${verb} in ${plural(days, 'day')}`, ...at };
  }
  return { status: 'ready', reason: kind === 'expires' ? `Valid through ${formatDate(date)}` : `Due ${formatDate(date)}`, ...at };
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}
