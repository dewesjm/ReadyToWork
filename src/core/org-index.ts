import { Person } from './model';

/**
 * Reporting structure lookups over a flat list of people. A manager id that isn't in the list
 * makes that person a root. Cycles in the data are cut rather than looping forever.
 */
export class OrgIndex {
  private readonly byId = new Map<string, Person>();
  private readonly children = new Map<string, Person[]>();
  private readonly rootList: Person[] = [];

  constructor(people: readonly Person[]) {
    for (const p of people) this.byId.set(p.id, p);
    for (const p of people) {
      const managerId = p.managerId !== null && this.byId.has(p.managerId) ? p.managerId : null;
      if (managerId === null) this.rootList.push(p);
      else {
        const list = this.children.get(managerId) ?? [];
        list.push(p);
        this.children.set(managerId, list);
      }
    }
  }

  get size(): number {
    return this.byId.size;
  }

  get(id: string): Person | undefined {
    return this.byId.get(id);
  }

  roots(): readonly Person[] {
    return this.rootList;
  }

  childrenOf(id: string): readonly Person[] {
    return this.children.get(id) ?? [];
  }

  /** Managers above a person, top of the org first, direct manager last. */
  managerChain(id: string): Person[] {
    const chain: Person[] = [];
    const seen = new Set([id]);
    let managerId = this.byId.get(id)?.managerId ?? null;
    while (managerId !== null && !seen.has(managerId)) {
      const manager = this.byId.get(managerId);
      if (!manager) break;
      chain.unshift(manager);
      seen.add(managerId);
      managerId = manager.managerId;
    }
    return chain;
  }

  /** Everyone at and below a person, depth first, in display order. */
  subtree(id: string, includeSelf = true): Person[] {
    const root = this.byId.get(id);
    if (!root) return [];
    const out: Person[] = [];
    const seen = new Set<string>();
    const stack: Person[] = [root];
    while (stack.length > 0) {
      const p = stack.pop()!;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      if (includeSelf || p.id !== id) out.push(p);
      const kids = this.childrenOf(p.id);
      for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
    }
    return out;
  }

  /** True when `id` is `rootId` or anywhere below it. */
  isInSubtree(rootId: string, id: string): boolean {
    return id === rootId || this.managerChain(id).some((m) => m.id === rootId);
  }
}
