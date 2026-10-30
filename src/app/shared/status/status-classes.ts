import { STATUS_META, Status } from '../../../core';

// Full class names written out so Tailwind finds them when scanning the source.
const BADGE: Record<string, string> = {
  error: 'badge-error',
  warning: 'badge-warning',
  success: 'badge-success',
};

const TEXT: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  success: 'text-success',
};

const BUTTON: Record<string, string> = {
  error: 'btn-error',
  warning: 'btn-warning',
  success: 'btn-success',
};

/** daisyUI button color class for a status, e.g. 'btn-error'. */
export function buttonClass(status: Status): string {
  return BUTTON[STATUS_META[status].color];
}

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
  'not-ready': 'Expired, overdue, missing, lost, revoked or no data. Not allowed to work on it.',
  expiring: 'Still valid, but due inside its warning window.',
  ready: 'Valid, with nothing due soon.',
};
