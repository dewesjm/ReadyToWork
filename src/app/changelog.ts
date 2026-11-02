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
    date: '2026-11-02',
    changes: ['The demo now opens as the Superintendent, Tyler Mitchell. View as still switches to anyone else.'],
  },
  {
    date: '2026-11-01',
    changes: [
      'The tree no longer moves with the arrow keys. Click or tap a row to open a team; Tab reaches the Items and Details buttons.',
      'People with no issues no longer have an Items button; Details still shows their full list.',
      'The Legend button is now just its info icon.',
      "Notices at the top can't be closed any more, and any you closed before are back.",
    ],
    fixes: [
      'Faint text is easier to read: managers shown for context, table headings, Admin tabs and the change log headings.',
      'In the dark theme, red badges and the Outage notice are a deeper red so the white text is readable.',
      'The Issues only switch is easy to see in the dark theme.',
      'On a phone, the Admin tabs stay on one line and scroll sideways.',
      'Screen readers read the person on each Items button.',
      'On a phone, buttons, links and switches are bigger and easier to tap.',
      'On a phone, the top bar fits on one line, and tree rows are tidier, with Details always at the right.',
      'In the tree, Details no longer drops to the left on rows with a long list of counts.',
    ],
  },
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
      'The list no longer makes the page scroll sideways; on smaller screens the manager shows under the name.',
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
