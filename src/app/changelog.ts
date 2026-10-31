import { IsoDate } from '../core';

/**
 * The change log shown at /changelog. Newest entry first, one entry per day with changes users
 * would notice. Keep each line short and plain: what changed for the user, not how.
 */
export interface ChangelogEntry {
  date: IsoDate;
  new?: readonly string[];
  changes?: readonly string[];
  fixes?: readonly string[];
}

export const CHANGELOG: readonly ChangelogEntry[] = [
  {
    date: '2026-10-31',
    new: ['A change log, under the avatar menu.'],
    changes: [
      'In the tree, only the Details button opens a person. Clicking a row opens or closes a team.',
      'The list shows one row per person, with a column for each category.',
      'Sample data now looks like a shipyard: programs are ships and ship classes, with shipyard jobs, training and tools.',
    ],
  },
];
