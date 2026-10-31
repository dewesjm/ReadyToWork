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
    new: [
      'A change log, under the avatar menu.',
      "Click a person's issue chips (or \"3 issues\" in the list) to see what they're missing right under their row.",
      'Export: download the people shown as a file for Excel, from the tree or the list.',
      'A General Foreman under View as in the avatar menu.',
      "Each superintendent's crews now share a trade (welding, electrical, pipefitting, shipfitting), with matching job titles and qualifications.",
    ],
    fixes: [
      'If you opened the demo before today, you now get the new sample programs without resetting anything.',
      'The side panel has a clear Close button.',
      'Search finds anyone in view, even people who are ready while Issues only is on.',
      'The dropdowns in the avatar menu have a visible outline.',
    ],
    changes: [
      'In the tree, only the Details button opens a person. Clicking a row opens or closes a team.',
      'The list shows one row per person, with a column for each category.',
      'More realistic sample data: new sample programs, job titles, training and tools.',
      'Admins add program requirements by typing a course, qual or role ID. A requirement can list several IDs where any one will do.',
    ],
  },
];
