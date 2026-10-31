import { CategoryId, Requirement, RequirementOption } from './model';

/** IDs match ignoring upper and lower case and spaces around them. */
export function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}

/** Lookup key for an item: its category and normalized ID. */
export function itemKey(category: CategoryId, itemId: string): string {
  return `${category}|${normalizeId(itemId)}`;
}

export function optionMatches(
  option: RequirementOption,
  category: CategoryId,
  itemId: string,
): boolean {
  return option.category === category && normalizeId(option.itemId) === normalizeId(itemId);
}

/** Same options, in any order and case, means the same requirement. */
export function requirementKey(req: Pick<Requirement, 'anyOf'>): string {
  return [...new Set(req.anyOf.map((o) => itemKey(o.category, o.itemId)))].sort().join(' or ');
}

/** Item names seen in the source data, by itemKey. */
export type ItemNames = ReadonlyMap<string, string>;

export function itemNames(
  items: Iterable<{ category: CategoryId; itemId: string; itemName: string }>,
): Map<string, string> {
  const names = new Map<string, string>();
  for (const i of items) {
    const key = itemKey(i.category, i.itemId);
    if (!names.has(key)) names.set(key, i.itemName);
  }
  return names;
}

/**
 * One option for display: "Hot Work and Fire Watch (HW-210)"; just the name when it already
 * contains the ID ("SAP role PS_PLANNER"); the ID alone when no record has it.
 */
export function optionLabel(option: RequirementOption, names: ItemNames): string {
  const id = option.itemId.trim();
  const name = names.get(itemKey(option.category, id));
  if (!name) return id;
  return name.toLowerCase().includes(id.toLowerCase()) ? name : `${name} (${id})`;
}

/**
 * A requirement for display: its name, the single option, or "Any of A, B". The IDs alone come
 * after the name of a multi-option requirement: "Electrical safety: any of ELEC-101, ELEC-201".
 */
export function requirementLabel(req: Requirement, names: ItemNames): string {
  const ids = req.anyOf.map((o) => o.itemId.trim());
  if (req.anyOf.length === 1) {
    const single = optionLabel(req.anyOf[0], names);
    return req.name ? `${req.name}: ${single}` : single;
  }
  return req.name ? `${req.name}: any of ${ids.join(', ')}` : `Any of ${ids.join(', ')}`;
}
