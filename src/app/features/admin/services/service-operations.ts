import { DEFAULT_CONFIG } from '../../../../core';
import { AdminService } from '../admin-service';

interface Call {
  text: string;
  run(): unknown;
}

export interface ServiceOperation {
  name: string;
  description: string;
  writes?: boolean;
  prepare(categoryId: string, days: string): Call;
}

/** The same arguments are used for the preview and the actual invocation. */
function call<T extends unknown[]>(name: string, fn: (...args: T) => unknown, ...args: T): Call {
  return {
    text: `${name}(${args.map((arg) => JSON.stringify(arg)).join(', ')})`,
    run: () => fn(...args),
  };
}

export function serviceOperations(admin: AdminService): ServiceOperation[] {
  return [
    {
      name: 'AdminService.warningWindows',
      description: 'Read the current and default warning windows for every category.',
      prepare: () => call('AdminService.warningWindows', admin.warningWindows),
    },
    {
      name: 'AdminService.programs',
      description: 'Read the saved demo programs and their requirements.',
      prepare: () => call('AdminService.programs', admin.programs),
    },
    {
      name: 'AdminService.announcements',
      description: 'Read all saved demo announcements, including those that are off.',
      prepare: () => call('AdminService.announcements', admin.announcements),
    },
    {
      name: 'AdminService.setWarningWindow',
      description: 'Save a warning window in this browser. Leave days blank to use the default.',
      writes: true,
      prepare: (categoryId, days) =>
        call(
          'AdminService.setWarningWindow',
          (id, value) => admin.setWarningWindow(id, value),
          categoryId,
          days.trim() ? Number(days) : null,
        ),
    },
  ];
}

export const SERVICE_CATEGORIES = DEFAULT_CONFIG.categories;
