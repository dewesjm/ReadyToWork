import { STATUS_META, Status } from '../../../core';

// Full class names written out so Tailwind finds them when scanning the source.
const BADGE: Record<string, string> = {
  error: 'badge-error',
  warning: 'badge-warning',
  neutral: 'badge-neutral',
  success: 'badge-success',
};

const TEXT: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  neutral: 'text-neutral',
  success: 'text-success',
};

/** daisyUI badge color class for a status, e.g. 'badge-error'. */
export function badgeClass(status: Status): string {
  return BADGE[STATUS_META[status].color];
}

/** Text color class for a status, e.g. 'text-error'. */
export function textClass(status: Status): string {
  return TEXT[STATUS_META[status].color];
}

/** Plain-English meaning of each status, for the legend. */
export const STATUS_MEANING: Record<Status, string> = {
  'not-ready': 'Expired, overdue, missing, lost or revoked. Not allowed to work on it.',
  expiring: 'Still valid, but due inside its warning window.',
  unknown: 'No data, or the source system has not synced recently.',
  ready: 'Valid, with nothing due soon.',
};
