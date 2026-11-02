import { OrgIndex } from './org-index';
import { TEST_ORG } from './test-org';

const ids = (people: { id: string }[]) => people.map((p) => p.id);

describe('OrgIndex', () => {
  const org = new OrgIndex(TEST_ORG);

  it('finds roots and children', () => {
    expect(ids([...org.roots()])).toEqual(['dir']);
    expect(ids([...org.childrenOf('m1')])).toEqual(['f1', 'f2']);
    expect(org.childrenOf('c1')).toEqual([]);
  });

  it('builds the manager chain top first', () => {
    expect(ids(org.managerChain('c1'))).toEqual(['dir', 'm1', 'f1']);
    expect(org.managerChain('dir')).toEqual([]);
  });

  it('lists a subtree depth first, with or without the root', () => {
    expect(ids(org.subtree('dir'))).toEqual(['dir', 'm1', 'f1', 'c1', 'c2', 'f2', 'm2', 'f3']);
    expect(ids(org.subtree('m1', false))).toEqual(['f1', 'c1', 'c2', 'f2']);
    expect(org.subtree('nobody')).toEqual([]);
  });

  it('answers whether someone is in a subtree', () => {
    expect(org.isInSubtree('m1', 'c2')).toBe(true);
    expect(org.isInSubtree('m1', 'm1')).toBe(true);
    expect(org.isInSubtree('m1', 'f3')).toBe(false);
  });

  it('treats an unknown manager as a root', () => {
    const o = new OrgIndex([{ id: 'x', employeeId: 'x', userId: 'x', name: 'X', title: '', managerId: 'gone' }]);
    expect(ids([...o.roots()])).toEqual(['x']);
  });

  it('does not loop forever on a reporting cycle', () => {
    const o = new OrgIndex([
      { id: 'a', employeeId: 'a', userId: 'a', name: 'A', title: '', managerId: 'b' },
      { id: 'b', employeeId: 'b', userId: 'b', name: 'B', title: '', managerId: 'a' },
    ]);
    expect(ids(o.managerChain('a'))).toEqual(['b']);
    expect(ids(o.subtree('a'))).toEqual(['a', 'b']);
  });
});
