import { IsoDate } from './dates';

/** Ranked worst to best: not-ready > expiring > ready. See STATUS_META in config.ts. */
export type Status = 'not-ready' | 'expiring' | 'ready';

/** Category ids are config-driven (config.ts) so categories can be added without code changes. */
export type CategoryId = string;

/** The system a record came from, e.g. 'sap' or 'lms'. Staleness limits are set per source. */
export type SourceId = string;

export interface Person {
  id: string;
  employeeId: string;
  name: string;
  title: string;
  /** Null for the top of the org. */
  managerId: string | null;
}

/** Hard problems that make an item not ready regardless of dates. */
export type RecordProblem = 'missing' | 'lost' | 'revoked';

/**
 * One fact from a source system about one item a person holds or is assigned. Which fields are
 * set depends on the item: a password has `expires`, training has `completed`/`due`, a device
 * may have both `expires` and `lastCheckIn`.
 */
export interface SourceRecord {
  personId: string;
  category: CategoryId;
  /** Stable key for the item, shared by everyone who holds it, e.g. 'training:export-control'. */
  itemId: string;
  itemName: string;
  source: SourceId;
  /** When the source last synced this data. */
  lastSynced: IsoDate;
  /** Valid through this date (inclusive). */
  expires?: IsoDate;
  /** Training and similar: done or not. */
  completed?: boolean;
  /** Training and similar: due date while not completed (inclusive). */
  due?: IsoDate;
  /** Devices: last time the device checked in. */
  lastCheckIn?: IsoDate;
  problem?: RecordProblem;
}

/** One person, one requirement, one status: the evaluated form of a record or requirement. */
export interface Check {
  personId: string;
  category: CategoryId;
  itemId: string;
  itemName: string;
  /** Source system, or 'program' for a required item the person doesn't hold. */
  source: SourceId;
  status: Status;
  /** Plain-English reason, e.g. "Expires in 12 days". */
  reason: string;
  /** The date that drives the status: last valid day, due date, or check-in deadline. */
  dueDate?: IsoDate;
  /** Days from today to dueDate; 0 is today, negative is overdue. */
  daysRemaining?: number;
  lastSynced?: IsoDate;
  /** The source hasn't synced within its limit. Shown as a note; it doesn't change the status. */
  stale: boolean;
  /** Ids of programs that require this item. */
  requiredBy: string[];
}

/** One item that can fulfill a requirement: its type and its ID in the source system. */
export interface RequirementOption {
  category: CategoryId;
  /** Course ID, qual ID, role name and so on, as the admin typed it. */
  itemId: string;
}

/** Fulfilled by holding any one of its options. */
export interface Requirement {
  /** Unique within its program. */
  id: string;
  /** Optional name the admin gives it, e.g. "Electrical safety". */
  name?: string;
  anyOf: RequirementOption[];
}

/** A program's requirements are "all of"; each requirement is "any of" its options. */
export interface Program {
  id: string;
  name: string;
  requirements: Requirement[];
}

export type StatusCounts = Record<Status, number>;

/** Counts for everyone below a manager (not including the manager). */
export interface Rollup {
  total: number;
  counts: StatusCounts;
  /** Worst status in the subtree, or null when there is no one below. */
  worst: Status | null;
}
