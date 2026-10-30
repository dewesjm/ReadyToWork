import { Person } from './model';

/**
 * Small org shared by core specs:
 *
 *   dir
 *   ├─ m1
 *   │  ├─ f1
 *   │  │  ├─ c1
 *   │  │  └─ c2
 *   │  └─ f2
 *   └─ m2
 *      └─ f3
 */
export const TEST_ORG: Person[] = [
  person('dir', null),
  person('m1', 'dir'),
  person('f1', 'm1'),
  person('c1', 'f1'),
  person('c2', 'f1'),
  person('f2', 'm1'),
  person('m2', 'dir'),
  person('f3', 'm2'),
];

function person(id: string, managerId: string | null): Person {
  return { id, employeeId: `E-${id}`, name: `Person ${id}`, title: 'Test', managerId };
}
