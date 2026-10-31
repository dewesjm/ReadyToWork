import { compareByUrgency } from './check-order';
import { CategoryConfig, categoryConfig } from './config';
import { CategoryId, Check } from './model';

/** One category of a person's items, for showing them in place under their row. */
export interface ItemGroup {
  category: CategoryId;
  label: string;
  icon: string;
  /** Worst first, then soonest due. */
  checks: Check[];
}

/**
 * A person's checks grouped by category in config order (unknown categories last), worst first
 * within each. With `issuesOnly`, ready checks are left out and empty groups dropped.
 */
export function itemGroups(
  checks: readonly Check[],
  categories: readonly CategoryConfig[],
  issuesOnly: boolean,
): ItemGroup[] {
  const shown = issuesOnly ? checks.filter((c) => c.status !== 'ready') : checks;
  const byCategory = new Map<CategoryId, Check[]>();
  for (const c of shown) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c]);
  const order = (id: CategoryId) => {
    const i = categories.findIndex((c) => c.id === id);
    return i < 0 ? Infinity : i;
  };
  return [...byCategory]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
    .map(([category, list]) => {
      const config = categoryConfig(category, categories);
      return {
        category,
        label: config?.label ?? category,
        icon: config?.icon ?? 'info',
        checks: [...list].sort(compareByUrgency),
      };
    });
}

/** The course or qual ID to show next to a held item's name, or null (a missing item's label has it). */
export function shownItemId(c: Check, categories: readonly CategoryConfig[]): string | null {
  const config = categoryConfig(c.category, categories);
  return config?.showsItemId && c.source !== 'program' && !c.itemName.includes(c.itemId) ? c.itemId : null;
}
