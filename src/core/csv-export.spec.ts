import { DEFAULT_CONFIG } from './config';
import { readinessExportRows, toCsv } from './csv-export';
import { Person } from './model';
import { PersonListResult } from './readiness-filter';

const person = (id: string, name: string, title: string): Person => ({
  id,
  name,
  title,
  employeeId: `E-${id}`,
  managerId: null,
});

describe('csv export', () => {
  it('quotes only what needs it and never starts a formula', () => {
    const cells = ['Hot Work', 'Smith, Jo', 'the "best"', 'two\nlines', ' padded', '=SUM(A1)', '-5', ''];
    expect(toCsv([cells])).toBe(`﻿Hot Work,"Smith, Jo","the ""best""","two\nlines"," padded","'=SUM(A1)","'-5",\r\n`);
  });

  it('starts with a byte-order mark and uses CRLF line ends', () => {
    expect(toCsv([['a', 'b'], ['c', 'd']])).toBe('\uFEFFa,b\r\nc,d\r\n');
  });

  it('writes a header and one row per person, with status and days per category', () => {
    const boss = person('b', 'Pat Boss', 'Foreman');
    const result: PersonListResult = {
      columns: ['training', 'tool'],
      rows: [
        {
          person: person('a', 'Ana Ruiz', 'Welder'),
          manager: boss,
          status: 'not-ready',
          cells: [{ status: 'expiring', daysRemaining: 12 }, { status: 'not-ready', daysRemaining: -3 }],
          match: false,
        },
        { person: boss, manager: null, status: 'ready', cells: [{ status: 'ready', daysRemaining: 90 }, null], match: false },
      ],
    };
    expect(readinessExportRows(result, DEFAULT_CONFIG.categories)).toEqual([
      ['Name', 'Employee ID', 'Title', 'Reports to', 'Overall', 'Training', 'Training: days left', 'Tools', 'Tools: days left'],
      ['Ana Ruiz', 'E-a', 'Welder', 'Pat Boss', 'Not ready', 'Expiring', '12 days', 'Not ready', '3 days overdue'],
      ['Pat Boss', 'E-b', 'Foreman', '', 'Ready', 'Ready', '', '', ''],
    ]);
  });
});
