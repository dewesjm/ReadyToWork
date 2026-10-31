import { CategoryId, SourceId, Status } from './model';

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  /** Icon name, resolved by the UI's icon set. */
  icon: string;
  /** Days before the due date that an item turns yellow. */
  warningDays: number;
  /** Show the item's ID (course ID, qual ID) next to its name. */
  showsItemId?: boolean;
}

export interface ReadinessConfig {
  categories: CategoryConfig[];
  /** Used when a record's category isn't in the table. */
  defaultWarningDays: number;
  deviceCheckIn: {
    /** Days without a check-in before a device turns yellow. */
    expiringAfterDays: number;
    /** Days without a check-in before a device turns red. */
    notReadyAfterDays: number;
  };
  /** Days since a source last synced before its data is marked out of date (a note only). */
  staleAfterDays: Record<SourceId, number>;
  defaultStaleAfterDays: number;
}

export const DEFAULT_CONFIG: ReadinessConfig = {
  categories: [
    { id: 'network', label: 'Network access', icon: 'network', warningDays: 30, showsItemId: true },
    { id: 'sap-password', label: 'SAP password', icon: 'key-round', warningDays: 14, showsItemId: true },
    { id: 'device', label: 'Devices', icon: 'laptop', warningDays: 14 },
    { id: 'training', label: 'Training', icon: 'graduation-cap', warningDays: 30, showsItemId: true },
    { id: 'access-role', label: 'Access and roles', icon: 'shield-check', warningDays: 30 },
    { id: 'qualification', label: 'Qualifications', icon: 'award', warningDays: 60, showsItemId: true },
    { id: 'yubikey', label: 'Yubikeys', icon: 'usb', warningDays: 30 },
    { id: 'tool', label: 'Tools', icon: 'wrench', warningDays: 30 },
  ],
  defaultWarningDays: 30,
  deviceCheckIn: { expiringAfterDays: 14, notReadyAfterDays: 30 },
  staleAfterDays: {},
  defaultStaleAfterDays: 3,
};

/** Display names for source systems. 'program' marks a required item the person doesn't hold. */
export const SOURCE_LABELS: Record<SourceId, string> = {
  ad: 'Active Directory',
  sap: 'SAP',
  mdm: 'Device management',
  lms: 'Learning system',
  quals: 'Qualifications register',
  yubikey: 'Yubikey register',
  assets: 'Asset management',
  program: 'Program requirement',
};

/** A source's display name, or its id when it isn't in the table. */
export function sourceLabel(id: SourceId): string {
  return SOURCE_LABELS[id] ?? id;
}

export interface StatusMeta {
  label: string;
  /** Higher is worse. A person's status is their highest-ranked check. */
  rank: number;
  /** daisyUI color name. */
  color: 'error' | 'warning' | 'success';
  icon: string;
}

export const STATUS_META: Record<Status, StatusMeta> = {
  'not-ready': { label: 'Not ready', rank: 2, color: 'error', icon: 'circle-x' },
  expiring: { label: 'Expiring', rank: 1, color: 'warning', icon: 'triangle-alert' },
  ready: { label: 'Ready', rank: 0, color: 'success', icon: 'circle-check' },
};

/** Worst first. */
export const STATUSES: readonly Status[] = ['not-ready', 'expiring', 'ready'];

/** A category's settings (label, icon, warning window), or undefined for an unknown id. */
export function categoryConfig(
  id: string,
  categories: readonly CategoryConfig[] = DEFAULT_CONFIG.categories,
): CategoryConfig | undefined {
  return categories.find((c) => c.id === id);
}
