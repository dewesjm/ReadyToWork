import { IsoDate, isIsoDate } from './dates';
import { formatDate } from './format';

/** Admin notices shown in a banner on every page: outages, delays, general information. */
export type AnnouncementType = 'outage' | 'delayed' | 'info';

export interface Announcement {
  id: string;
  type: AnnouncementType;
  message: string;
  /** First day it shows; null shows it from now. */
  startsOn: IsoDate | null;
  /** Last day it shows; null shows it until it is turned off. */
  endsOn: IsoDate | null;
  on: boolean;
  /** Goes up with each published edit, so a viewer who dismissed it sees it again. */
  revision: number;
}

/** What an admin fills in. */
export type AnnouncementDraft = Omit<Announcement, 'id' | 'revision'>;

export type AnnouncementState = 'live' | 'scheduled' | 'ended' | 'off';

export interface AnnouncementTypeMeta {
  label: string;
  icon: string;
  /** daisyUI color name. */
  color: 'error' | 'warning' | 'info';
  /** Higher shows first. */
  rank: number;
  /** Whether a viewer can close it. */
  dismissible: boolean;
}

export const ANNOUNCEMENT_CONFIG = {
  maxMessageLength: 300,
  types: {
    outage: { label: 'Outage', icon: 'octagon-x', color: 'error', rank: 2, dismissible: false },
    delayed: { label: 'Delayed', icon: 'clock', color: 'warning', rank: 1, dismissible: false },
    info: { label: 'Info', icon: 'info', color: 'info', rank: 0, dismissible: false },
  } satisfies Record<AnnouncementType, AnnouncementTypeMeta>,
  /** Order in the admin's type picker. */
  typeOrder: ['outage', 'delayed', 'info'] as AnnouncementType[],
  states: { live: 'Live', scheduled: 'Scheduled', ended: 'Ended', off: 'Off' } satisfies Record<
    AnnouncementState,
    string
  >,
};

export function isAnnouncementType(value: unknown): value is AnnouncementType {
  return typeof value === 'string' && value in ANNOUNCEMENT_CONFIG.types;
}

/** ISO dates compare correctly as text. */
export function announcementState(a: Announcement, today: IsoDate): AnnouncementState {
  if (!a.on) return 'off';
  if (a.startsOn !== null && today < a.startsOn) return 'scheduled';
  if (a.endsOn !== null && today > a.endsOn) return 'ended';
  return 'live';
}

/**
 * The notices to show today: live ones, outages first, then delays, then info. Within a type the
 * list order is kept (the admin's list is newest first).
 */
export function activeAnnouncements(list: readonly Announcement[], today: IsoDate): Announcement[] {
  const rank = (a: Announcement) => ANNOUNCEMENT_CONFIG.types[a.type].rank;
  return list.filter((a) => announcementState(a, today) === 'live').sort((x, y) => rank(y) - rank(x));
}

/** Identifies one published version of a notice, for "dismissed" in the viewer's preferences. */
export function dismissKey(a: Announcement): string {
  return `${a.id}#${a.revision}`;
}

export interface AnnouncementProblems {
  message?: string;
  dates?: string;
}

/** What's wrong with a draft; an empty object when it can be published. */
export function announcementProblems(d: AnnouncementDraft): AnnouncementProblems {
  const problems: AnnouncementProblems = {};
  const message = d.message.trim();
  const max = ANNOUNCEMENT_CONFIG.maxMessageLength;
  if (!message) problems.message = 'Enter a message.';
  else if (message.length > max) problems.message = `Keep the message to ${max} characters or fewer.`;

  const bad = [d.startsOn, d.endsOn].some((date) => date !== null && !isIsoDate(date));
  if (bad) problems.dates = 'Enter dates like 2026-10-30.';
  else if (d.startsOn !== null && d.endsOn !== null && d.endsOn < d.startsOn) {
    problems.dates = 'The end date is before the start date.';
  }
  return problems;
}

/** Adds a notice at the top of the list (newest first). Returns the list and the new id. */
export function createAnnouncement(
  list: readonly Announcement[],
  draft: AnnouncementDraft,
): { list: Announcement[]; id: string } {
  const taken = new Set(list.map((a) => a.id));
  let n = list.length + 1;
  while (taken.has(`a${n}`)) n++;
  const id = `a${n}`;
  return { list: [{ ...tidy(draft), id, revision: 1 }, ...list], id };
}

/** Publishes an edit; the revision goes up so dismissed copies show again. */
export function updateAnnouncement(
  list: readonly Announcement[],
  id: string,
  draft: AnnouncementDraft,
): Announcement[] {
  return list.map((a) => (a.id === id ? { ...tidy(draft), id, revision: a.revision + 1 } : a));
}

/** Turns a notice on or off without editing it, so whoever dismissed it doesn't see it again. */
export function setAnnouncementOn(list: readonly Announcement[], id: string, on: boolean): Announcement[] {
  return list.map((a) => (a.id === id ? { ...a, on } : a));
}

export function deleteAnnouncement(list: readonly Announcement[], id: string): Announcement[] {
  return list.filter((a) => a.id !== id);
}

function tidy(d: AnnouncementDraft): AnnouncementDraft {
  return { type: d.type, message: d.message.trim(), startsOn: d.startsOn, endsOn: d.endsOn, on: d.on };
}

/** When a notice shows, in words: "Always", "From Nov 3, 2026", "Nov 3, 2026 to Nov 5, 2026". */
export function describeSchedule(a: Pick<Announcement, 'startsOn' | 'endsOn'>): string {
  if (a.startsOn && a.endsOn) {
    return a.startsOn === a.endsOn
      ? `On ${formatDate(a.startsOn)}`
      : `${formatDate(a.startsOn)} to ${formatDate(a.endsOn)}`;
  }
  if (a.startsOn) return `From ${formatDate(a.startsOn)}`;
  if (a.endsOn) return `Until ${formatDate(a.endsOn)}`;
  return 'Always';
}
