import { CategoryId, SourceId, Status } from './model';

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  /** Icon name, resolved by the UI's icon set. */
  icon: string;
  /** Days before the due date that an item turns yellow. */
  warningDays: number;
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
  /** Days since a source last synced before its data counts as out of date. */
  staleAfterDays: Record<SourceId, number>;
  defaultStaleAfterDays: number;
}

export const DEFAULT_CONFIG: ReadinessConfig = {
  categories: [
    { id: 'network', label: 'Network access', icon: 'network', warningDays: 30 },
    { id: 'sap-password', label: 'SAP password', icon: 'key-round', warningDays: 14 },
    { id: 'device', label: 'Devices', icon: 'laptop', warningDays: 14 },
    { id: 'training', label: 'Training', icon: 'graduation-cap', warningDays: 30 },
    { id: 'access-role', label: 'Access and roles', icon: 'shield-check', warningDays: 30 },
    { id: 'qualification', label: 'Qualifications', icon: 'award', warningDays: 60 },
    { id: 'yubikey', label: 'Yubikeys', icon: 'usb', warningDays: 30 },
    { id: 'tool', label: 'Tools', icon: 'wrench', warningDays: 30 },
  ],
  defaultWarningDays: 30,
  deviceCheckIn: { expiringAfterDays: 14, notReadyAfterDays: 30 },
  staleAfterDays: {},
  defaultStaleAfterDays: 3,
};

export interface StatusMeta {
  label: string;
  /** Higher is worse. A person's status is their highest-ranked check. */
  rank: number;
  /** daisyUI color name. */
  color: 'error' | 'warning' | 'neutral' | 'success';
  icon: string;
}

/** Unknown ranks above ready so missing data never looks like "all good". */
export const STATUS_META: Record<Status, StatusMeta> = {
  'not-ready': { label: 'Not ready', rank: 3, color: 'error', icon: 'circle-x' },
  expiring: { label: 'Expiring', rank: 2, color: 'warning', icon: 'triangle-alert' },
  unknown: { label: 'Unknown', rank: 1, color: 'neutral', icon: 'circle-help' },
  ready: { label: 'Ready', rank: 0, color: 'success', icon: 'circle-check' },
};

/** Worst first. */
export const STATUSES: readonly Status[] = ['not-ready', 'expiring', 'unknown', 'ready'];
