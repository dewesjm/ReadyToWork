import {
  CategoryId,
  DEFAULT_CONFIG,
  IsoDate,
  Program,
  ProgramSetup,
  ReadinessConfig,
  isIsoDate,
  pruneAssignments,
} from '../core';

export const SETTINGS_SCHEMA_VERSION = 1;

export type Layout = 'dashboard' | 'drilldown';

/** Per-viewer choices: theme, demo controls, default scope. */
export interface Preferences {
  theme: string;
  /** Demo "View as" persona; null means the first persona. */
  personaId: string | null;
  /** Default scope on the Readiness page; null means the viewer themselves. */
  defaultSupervisorId: string | null;
  /** Default program filter; null means all programs. */
  defaultProgramId: string | null;
  layout: Layout;
  /** Demo date override; null means the real date. */
  demoToday: IsoDate | null;
}

/** Everything admins and viewers can change. Saved in the browser and exportable as JSON. */
export interface Settings {
  schemaVersion: number;
  programs: Program[];
  /** Program ids per person id. */
  assignments: Record<string, string[]>;
  /** Warning window overrides per category; categories not listed use the config default. */
  warningDays: Record<CategoryId, number>;
  preferences: Preferences;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'navy',
  personaId: null,
  defaultSupervisorId: null,
  defaultProgramId: null,
  layout: 'dashboard',
  demoToday: null,
};

export function createDefaultSettings(
  programs: Program[],
  assignments: Record<string, string[]>,
): Settings {
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    programs: structuredClone(programs),
    assignments: structuredClone(assignments),
    warningDays: {},
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

/** Core config with the settings' warning-window overrides applied. */
export function readinessConfigFrom(
  settings: Settings,
  base: ReadinessConfig = DEFAULT_CONFIG,
): ReadinessConfig {
  return {
    ...base,
    categories: base.categories.map((c) => ({
      ...c,
      warningDays: settings.warningDays[c.id] ?? c.warningDays,
    })),
  };
}

/** Upgrades saved settings one version at a time. Key: the version being upgraded from. */
export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;
export const MIGRATIONS: Record<number, Migration> = {};

export class SettingsError extends Error {}

/**
 * The settings file: admin settings only (programs, assignments, warning windows). Preferences
 * belong to each viewer and stay out of it.
 */
export function exportSettings(settings: Settings): string {
  const { schemaVersion, programs, assignments, warningDays } = settings;
  return JSON.stringify({ schemaVersion, programs, assignments, warningDays }, null, 2);
}

/**
 * Parses a settings file. The viewer keeps `preferences` (any in the file are ignored); missing
 * sections come from `defaults`; assignments to programs not in the file are dropped. Throws
 * SettingsError with a readable message.
 */
export function importSettings(text: string, defaults: Settings, preferences: Preferences): Settings {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SettingsError('The file is not valid JSON.');
  }
  if (isObject(raw)) {
    const { preferences: _ignored, ...rest } = raw;
    raw = rest;
  }
  const parsed = parseSettings(raw, defaults);
  const ids = new Set(parsed.programs.map((p) => p.id));
  return {
    ...parsed,
    assignments: pruneAssignments(parsed.assignments, (id) => ids.has(id)),
    preferences: { ...preferences },
  };
}

/** Admin settings back to the defaults; the viewer's preferences are kept. */
export function resetAdminSettings(settings: Settings, defaults: Settings): Settings {
  return { ...structuredClone(defaults), preferences: { ...settings.preferences } };
}

/** Applies edited programs and assignments. A default program that no longer exists is cleared. */
export function withProgramSetup(settings: Settings, setup: ProgramSetup): Settings {
  const prog = settings.preferences.defaultProgramId;
  const keepDefault = prog === null || setup.programs.some((p) => p.id === prog);
  return {
    ...settings,
    programs: setup.programs,
    assignments: setup.assignments,
    preferences: keepDefault ? settings.preferences : { ...settings.preferences, defaultProgramId: null },
  };
}

export const MAX_WARNING_DAYS = 3650;

/** Why a warning window can't be used, or null when it can. */
export function warningDaysProblem(days: number): string | null {
  return Number.isInteger(days) && days >= 0 && days <= MAX_WARNING_DAYS
    ? null
    : `Enter a whole number of days from 0 to ${MAX_WARNING_DAYS}.`;
}

export function setWarningDays(settings: Settings, category: CategoryId, days: number): Settings {
  return { ...settings, warningDays: { ...settings.warningDays, [category]: days } };
}

/** Goes back to the config default for the category. */
export function clearWarningDays(settings: Settings, category: CategoryId): Settings {
  const { [category]: _removed, ...rest } = settings.warningDays;
  return { ...settings, warningDays: rest };
}

/** What a settings file holds, e.g. "5 programs, 61 assignments, 2 warning windows". */
export function describeSettings(settings: Settings): string {
  const assignments = Object.values(settings.assignments).reduce((n, ids) => n + ids.length, 0);
  return [
    count(settings.programs.length, 'program'),
    count(assignments, 'assignment'),
    count(Object.keys(settings.warningDays).length, 'warning window'),
  ].join(', ');
}

function count(n: number, noun: string): string {
  return `${n.toLocaleString('en-US')} ${noun}${n === 1 ? '' : 's'}`;
}

/**
 * Checks and upgrades settings from storage or a file. Missing sections fall back to the
 * defaults; wrongly shaped ones are rejected.
 */
export function parseSettings(
  raw: unknown,
  defaults: Settings,
  migrations: Record<number, Migration> = MIGRATIONS,
  currentVersion = SETTINGS_SCHEMA_VERSION,
): Settings {
  if (!isObject(raw)) throw new SettingsError('Settings must be a JSON object.');
  let version = raw['schemaVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new SettingsError('Settings are missing a schemaVersion number.');
  }
  if (version > currentVersion) {
    throw new SettingsError(
      `These settings are from a newer version (${version}); this app reads up to ${currentVersion}.`,
    );
  }
  let data: Record<string, unknown> = raw;
  while (version < currentVersion) {
    const migrate = migrations[version];
    if (!migrate) throw new SettingsError(`Can't upgrade settings from version ${version}.`);
    data = migrate(data);
    version++;
  }

  const prefs = data['preferences'] === undefined ? {} : data['preferences'];
  if (!isObject(prefs)) throw new SettingsError('"preferences" must be an object.');

  return {
    schemaVersion: currentVersion,
    programs: data['programs'] === undefined ? defaults.programs : programs(data['programs']),
    assignments:
      data['assignments'] === undefined ? defaults.assignments : assignments(data['assignments']),
    warningDays:
      data['warningDays'] === undefined ? defaults.warningDays : warningDays(data['warningDays']),
    preferences: preferences(prefs, defaults.preferences),
  };
}

function programs(value: unknown): Program[] {
  if (!Array.isArray(value)) throw new SettingsError('"programs" must be a list.');
  return value.map((p, i) => {
    const at = `programs[${i}]`;
    if (!isObject(p)) throw new SettingsError(`${at} must be an object.`);
    if (!Array.isArray(p['requirements'])) throw new SettingsError(`${at}.requirements must be a list.`);
    return {
      id: str(p['id'], `${at}.id`),
      name: str(p['name'], `${at}.name`),
      requirements: p['requirements'].map((r, j) => {
        const rat = `${at}.requirements[${j}]`;
        if (!isObject(r)) throw new SettingsError(`${rat} must be an object.`);
        return {
          category: str(r['category'], `${rat}.category`),
          itemId: str(r['itemId'], `${rat}.itemId`),
          itemName: str(r['itemName'], `${rat}.itemName`),
        };
      }),
    };
  });
}

function assignments(value: unknown): Record<string, string[]> {
  if (!isObject(value)) throw new SettingsError('"assignments" must be an object.');
  const out: Record<string, string[]> = {};
  for (const [personId, ids] of Object.entries(value)) {
    if (!Array.isArray(ids)) throw new SettingsError(`assignments.${personId} must be a list.`);
    out[personId] = ids.map((id, i) => str(id, `assignments.${personId}[${i}]`));
  }
  return out;
}

function warningDays(value: unknown): Record<string, number> {
  if (!isObject(value)) throw new SettingsError('"warningDays" must be an object.');
  const out: Record<string, number> = {};
  for (const [category, days] of Object.entries(value)) {
    if (typeof days !== 'number' || warningDaysProblem(days) !== null) {
      throw new SettingsError(
        `warningDays.${category} must be a whole number of days (0 to ${MAX_WARNING_DAYS}).`,
      );
    }
    out[category] = days;
  }
  return out;
}

function preferences(raw: Record<string, unknown>, defaults: Preferences): Preferences {
  const optional = (key: keyof Preferences) => {
    const v = raw[key];
    if (v === undefined) return defaults[key] as string | null;
    if (v === null) return null;
    return str(v, `preferences.${key}`);
  };
  const layout = raw['layout'] ?? defaults.layout;
  if (layout !== 'dashboard' && layout !== 'drilldown') {
    throw new SettingsError('preferences.layout must be "dashboard" or "drilldown".');
  }
  const demoToday = optional('demoToday');
  if (demoToday !== null && !isIsoDate(demoToday)) {
    throw new SettingsError('preferences.demoToday must be a date like 2026-10-30.');
  }
  return {
    theme: raw['theme'] === undefined ? defaults.theme : str(raw['theme'], 'preferences.theme'),
    personaId: optional('personaId'),
    defaultSupervisorId: optional('defaultSupervisorId'),
    defaultProgramId: optional('defaultProgramId'),
    layout,
    demoToday,
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, at: string): string {
  if (typeof v !== 'string') throw new SettingsError(`${at} must be text.`);
  return v;
}
