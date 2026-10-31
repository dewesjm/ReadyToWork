import { Requirement } from './model';
import { itemKey, itemNames, normalizeId, optionLabel, requirementKey, requirementLabel } from './requirements';

const names = itemNames([
  { category: 'training', itemId: 'HW-210', itemName: 'Hot Work and Fire Watch' },
  { category: 'access-role', itemId: 'PS_PLANNER', itemName: 'PS_PLANNER' },
]);

describe('requirements', () => {
  it('normalizes IDs: case and surrounding spaces do not matter', () => {
    expect(normalizeId('  Hw-210 ')).toBe('hw-210');
    expect(itemKey('training', 'hw-210')).toBe(itemKey('training', ' HW-210'));
    expect(itemKey('training', 'HW-210')).not.toBe(itemKey('qualification', 'HW-210'));
  });

  it('treats the same options in any order as the same requirement', () => {
    const a = { anyOf: [{ category: 'training', itemId: 'A' }, { category: 'training', itemId: 'b' }] };
    const b = { anyOf: [{ category: 'training', itemId: 'B' }, { category: 'training', itemId: 'a' }] };
    expect(requirementKey(a)).toBe(requirementKey(b));
  });

  it('labels an option with its name from the data when known', () => {
    expect(optionLabel({ category: 'training', itemId: 'hw-210' }, names)).toBe('Hot Work and Fire Watch (hw-210)');
    expect(optionLabel({ category: 'access-role', itemId: 'PS_PLANNER' }, names)).toBe('PS_PLANNER');
    expect(optionLabel({ category: 'training', itemId: 'NEW-1' }, names)).toBe('NEW-1');
  });

  it('labels a requirement by its name, its one option, or its options', () => {
    const one: Requirement = { id: 'r1', anyOf: [{ category: 'training', itemId: 'HW-210' }] };
    const two: Requirement = {
      id: 'r2',
      anyOf: [
        { category: 'training', itemId: 'ELEC-101' },
        { category: 'qualification', itemId: 'QL-MEL-01' },
      ],
    };
    expect(requirementLabel(one, names)).toBe('Hot Work and Fire Watch (HW-210)');
    expect(requirementLabel({ ...one, name: 'Hot work' }, names)).toBe('Hot work: Hot Work and Fire Watch (HW-210)');
    expect(requirementLabel(two, names)).toBe('Any of ELEC-101, QL-MEL-01');
    expect(requirementLabel({ ...two, name: 'Electrical safety' }, names)).toBe(
      'Electrical safety: any of ELEC-101, QL-MEL-01',
    );
  });
});
