import Papa from 'papaparse';
import { CategoryConfig, STATUS_META, categoryConfig } from './config';
import { describeDays } from './format';
import { PersonListResult } from './readiness-filter';

/**
 * CSV text Excel opens as UTF-8: a byte-order mark, then rows joined with CRLF. Papa Parse does
 * the quoting; `escapeFormulae` puts an apostrophe before a leading = + - or @ so a spreadsheet
 * never runs a value as a formula.
 */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return '﻿' + Papa.unparse(rows as string[][], { escapeFormulae: true, newline: '\r\n' }) + '\r\n';
}

/**
 * The Readiness export: a header, then one row per person in the list order. Each category
 * shown has a status column and a days column (days only for an issue with a date).
 */
export function readinessExportRows(
  result: PersonListResult,
  categories: readonly CategoryConfig[],
): string[][] {
  const label = (id: string) => categoryConfig(id, categories)?.label ?? id;
  const header = ['Name', 'Employee ID', 'User ID', 'Title', 'Reports to', 'Overall'];
  for (const id of result.columns) header.push(label(id), `${label(id)}: days left`);

  const rows = result.rows.map((r) => {
    const row = [r.person.name, r.person.employeeId, r.person.userId, r.person.title, r.manager?.name ?? '', STATUS_META[r.status].label];
    for (const cell of r.cells) {
      const days = cell && cell.status !== 'ready' && cell.daysRemaining !== undefined ? describeDays(cell.daysRemaining) : '';
      row.push(cell ? STATUS_META[cell.status].label : '', days);
    }
    return row;
  });
  return [header, ...rows];
}
