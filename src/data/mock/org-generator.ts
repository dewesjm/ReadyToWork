import {
  Announcement,
  DEFAULT_CONFIG,
  IsoDate,
  Person,
  Program,
  ReadinessConfig,
  STATUSES,
  SourceRecord,
  Status,
  addDays,
} from '../../core';
import { CatalogItem, Persona } from '../data-source';
import { SeededRandom } from '../random';
import {
  CATALOG,
  CRANE_PROGRAM_ID,
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_PROGRAMS,
  FIRST_NAMES,
  LAST_NAMES,
  NETWORK_ACCOUNT,
  QUALIFICATIONS,
  ROLES,
  SAFETY_REFRESHER,
  SAP_PASSWORD,
  TITLES,
  TOOL_TYPES,
  TRAININGS,
} from './fake-catalog';
import { MOCK_CONFIG, MockConfig } from './mock-config';

/** Ids of the people behind the planted demo scenarios. */
export interface PlantedScenarios {
  /** Foreman whose crew has a cluster of expired tool calibrations. */
  toolCrewForemanId: string;
  /** Foreman whose crew's SAP passwords expire next week. */
  sapCrewForemanId: string;
  /** All green, but lacks the crane qualification: assigning Ridgeline R-01 turns them red. */
  craneCandidateId: string;
}

export interface FakeOrg {
  people: Person[];
  records: SourceRecord[];
  catalog: CatalogItem[];
  personas: Persona[];
  programs: Program[];
  /** Program ids per person id. */
  assignments: Record<string, string[]>;
  /** Banner notices the demo starts with. */
  announcements: Announcement[];
  /** The status each person was generated to have, on the anchor date. */
  targets: Map<string, Status>;
  scenarios: PlantedScenarios;
}

type Level = 'director' | 'manager' | 'generalForeman' | 'foreman' | 'crew';

interface Node {
  person: Person;
  level: Level;
  crewHealth: number;
}

/** What kind of record a slot is; decides how ready / expiring / not-ready dates look. */
type SlotKind = 'expiry' | 'training' | 'device' | 'yubikey' | 'role';

interface Slot {
  record: SourceRecord;
  kind: SlotKind;
}

/**
 * Builds a believable fake org. The same seed and anchor date always give the same org; all
 * dates are relative to the anchor (the real date the demo is opened).
 */
export function generateOrg(
  anchor: IsoDate,
  config: MockConfig = MOCK_CONFIG,
  readiness: ReadinessConfig = DEFAULT_CONFIG,
): FakeOrg {
  return new OrgGenerator(anchor, config, readiness).build();
}

class OrgGenerator {
  private readonly rng: SeededRandom;
  private readonly nodes: Node[] = [];
  private readonly crews = new Map<string, Node[]>();
  private readonly usedNames = new Set<string>();
  private serial = 40000;

  constructor(
    private readonly anchor: IsoDate,
    private readonly config: MockConfig,
    private readonly readiness: ReadinessConfig,
  ) {
    this.rng = new SeededRandom(config.seed);
  }

  build(): FakeOrg {
    this.buildPeople();
    const scenarios = this.pickScenarios();
    const targets = this.assignTargets(scenarios);
    const assignments = this.assignPrograms(scenarios);
    const records = this.nodes.flatMap((n) =>
      this.recordsFor(n, targets.get(n.person.id)!, assignments[n.person.id] ?? [], scenarios),
    );
    return {
      people: this.nodes.map((n) => n.person),
      records,
      catalog: CATALOG,
      personas: this.personas(scenarios),
      programs: DEFAULT_PROGRAMS,
      assignments,
      announcements: DEFAULT_ANNOUNCEMENTS,
      targets,
      scenarios,
    };
  }

  // People and reporting tree

  private buildPeople(): void {
    const { shape } = this.config;
    const director = this.addPerson('director', null, TITLES.director);
    for (let m = 0; m < shape.managers; m++) {
      const manager = this.addPerson('manager', director, TITLES.manager[m % TITLES.manager.length]);
      for (let g = 0; g < this.rng.int(...shape.generalForemenPerManager); g++) {
        const gf = this.addPerson('generalForeman', manager, TITLES.generalForeman);
        for (let f = 0; f < this.rng.int(...shape.foremenPerGeneralForeman); f++) {
          const foreman = this.addPerson('foreman', gf, TITLES.foreman);
          // Crew health: >1 means more problems than average, <1 fewer.
          const health = Math.exp(this.config.crewHealthSpread * (this.rng.next() * 2 - 1));
          foreman.crewHealth = health;
          const crew: Node[] = [];
          for (let c = 0; c < this.rng.int(...shape.crewPerForeman); c++) {
            const member = this.addPerson('crew', foreman, this.rng.pick(TITLES.crew));
            member.crewHealth = health;
            crew.push(member);
          }
          this.crews.set(foreman.person.id, crew);
        }
      }
    }
  }

  private addPerson(level: Level, manager: Node | null, title: string): Node {
    const index = this.nodes.length + 1;
    const node: Node = {
      person: {
        id: `p${String(index).padStart(3, '0')}`,
        employeeId: `E${10000 + index * 7 + this.rng.int(0, 6)}`,
        name: this.uniqueName(),
        title,
        managerId: manager?.person.id ?? null,
      },
      level,
      crewHealth: 1,
    };
    this.nodes.push(node);
    return node;
  }

  private uniqueName(): string {
    for (;;) {
      const name = `${this.rng.pick(FIRST_NAMES)} ${this.rng.pick(LAST_NAMES)}`;
      if (!this.usedNames.has(name)) {
        this.usedNames.add(name);
        return name;
      }
    }
  }

  // Planted scenarios and target statuses

  private pickScenarios(): PlantedScenarios {
    const foremen = this.rng.shuffle([...this.crews.keys()]);
    const [toolCrewForemanId, sapCrewForemanId, craneCrewForemanId] = foremen;
    const craneCandidateId = this.crews.get(craneCrewForemanId)![0].person.id;
    return { toolCrewForemanId, sapCrewForemanId, craneCandidateId };
  }

  private assignTargets(s: PlantedScenarios): Map<string, Status> {
    const n = this.nodes.length;
    const quota = Object.fromEntries(
      STATUSES.map((st) => [st, Math.round(this.config.statusMix[st] * n)]),
    ) as Record<Status, number>;
    const targets = new Map<string, Status>();
    const plant = (id: string, status: Status) => {
      targets.set(id, status);
      quota[status] = Math.max(0, quota[status] - 1);
    };

    for (const m of this.crews.get(s.sapCrewForemanId)!) plant(m.person.id, 'expiring');
    for (const m of this.crews.get(s.toolCrewForemanId)!.slice(0, this.config.expiredToolPeople)) {
      plant(m.person.id, 'not-ready');
    }
    plant(s.craneCandidateId, 'ready');

    // Weighted sampling without replacement (Efraimidis-Spirakis): unhealthy crews get more.
    const pool = this.nodes
      .filter((nd) => !targets.has(nd.person.id))
      .map((nd) => ({ id: nd.person.id, key: this.rng.next() ** (1 / nd.crewHealth) }))
      .sort((a, b) => b.key - a.key);
    let i = 0;
    for (const status of ['not-ready', 'expiring'] as const) {
      for (let k = 0; k < quota[status] && i < pool.length; k++) targets.set(pool[i++].id, status);
    }
    for (; i < pool.length; i++) targets.set(pool[i].id, 'ready');
    return targets;
  }

  private assignPrograms(s: PlantedScenarios): Record<string, string[]> {
    const assignments: Record<string, string[]> = {};
    for (const node of this.nodes) {
      if (node.person.id === s.craneCandidateId) continue;
      const rate =
        node.level === 'crew' ? this.config.programAssignmentRate : this.config.programAssignmentRate / 2;
      if (node.level !== 'director' && this.rng.chance(rate)) {
        assignments[node.person.id] = [this.rng.pick(DEFAULT_PROGRAMS).id];
      }
    }
    return assignments;
  }

  // Records

  private recordsFor(
    node: Node,
    target: Status,
    programIds: string[],
    s: PlantedScenarios,
  ): SourceRecord[] {
    const id = node.person.id;
    const leader = node.level !== 'crew';
    const slots: Slot[] = [];
    const add = (item: CatalogItem, source: string, kind: SlotKind) =>
      slots.push({ record: this.record(id, item, source), kind });

    add(NETWORK_ACCOUNT, 'ad', 'expiry');
    const onSapCrew = this.inCrew(id, s.sapCrewForemanId);
    if (leader || onSapCrew || this.rng.chance(0.6)) add(SAP_PASSWORD, 'sap', 'expiry');

    const devices = leader ? 1 + (this.rng.chance(0.3) ? 1 : 0) : this.rng.chance(0.7) ? 1 : 0;
    for (let d = 0; d < devices; d++) {
      const laptop = leader || this.rng.chance(0.3);
      const tag = `${laptop ? 'LT' : 'TB'}-${this.nextSerial()}`;
      add({ category: 'device', itemId: `dev:${tag}`, itemName: `${laptop ? 'Laptop' : 'Tablet'} ${tag}` }, 'mdm', 'device');
    }

    const required = programIds.flatMap(
      (pid) => DEFAULT_PROGRAMS.find((p) => p.id === pid)?.requirements ?? [],
    );
    const trainings = new Set([SAFETY_REFRESHER, ...this.rng.sample(TRAININGS.slice(1), this.rng.int(2, 4))]);
    const quals = new Set(leader ? [] : this.rng.sample(QUALIFICATIONS, this.rng.int(0, 2)));
    const roles = new Set(this.rng.sample(ROLES, leader ? this.rng.int(1, 2) : this.rng.int(0, 1)));
    for (const r of required) {
      const set = r.category === 'training' ? trainings : r.category === 'qualification' ? quals : roles;
      set.add(CATALOG.find((c) => c.itemId === r.itemId)!);
    }
    if (id === s.craneCandidateId) quals.delete(QUALIFICATIONS.find((q) => q.itemId === 'qual:crane')!);
    for (const t of trainings) add(t, 'lms', 'training');
    for (const q of quals) add(q, 'quals', 'expiry');
    for (const r of roles) add(r, 'sap', 'role');

    const serial = `18${this.nextSerial()}${this.rng.int(10, 99)}`;
    add({ category: 'yubikey', itemId: `yk:${serial}`, itemName: `Yubikey ${serial}` }, 'yubikey', 'yubikey');

    if (!leader) {
      const toolCount = this.inCrew(id, s.toolCrewForemanId) ? this.rng.int(2, 3) : this.rng.int(1, 3);
      for (const t of this.rng.sample(TOOL_TYPES, toolCount)) {
        const tag = `${t.prefix}-${this.rng.int(100, 999)}`;
        add({ category: 'tool', itemId: `tool:${tag}`, itemName: `${t.name} ${tag}` }, 'assets', 'expiry');
      }
    }

    for (const slot of slots) this.makeReady(slot);
    this.applyTarget(id, target, slots, s);
    return slots.map((sl) => sl.record);
  }

  private applyTarget(id: string, target: Status, slots: Slot[], s: PlantedScenarios): void {
    const find = (category: string) => slots.filter((sl) => sl.record.category === category);
    if (target === 'ready') return;

    if (this.inCrew(id, s.sapCrewForemanId)) {
      find('sap-password')[0].record.expires = addDays(this.anchor, this.rng.int(6, 9));
      return;
    }
    if (target === 'not-ready' && this.inCrew(id, s.toolCrewForemanId)) {
      for (const t of find('tool')) t.record.expires = addDays(this.anchor, -this.rng.int(3, 40));
      return;
    }

    const bad = this.rng.sample(slots, this.rng.chance(0.7) ? 1 : 2);
    for (const slot of bad) {
      if (target === 'expiring') this.makeExpiring(slot);
      else this.makeNotReady(slot);
    }
    if (target === 'not-ready' && this.rng.chance(0.3)) {
      const extra = slots.find((sl) => !bad.includes(sl));
      if (extra) this.makeExpiring(extra);
    }
  }

  private record(personId: string, item: CatalogItem, source: string): SourceRecord {
    return {
      personId,
      category: item.category,
      itemId: item.itemId,
      itemName: item.itemName,
      source,
      lastSynced: addDays(this.anchor, -this.rng.int(0, 1)),
    };
  }

  private warn(slot: Slot): number {
    const c = this.readiness.categories.find((cat) => cat.id === slot.record.category);
    return c?.warningDays ?? this.readiness.defaultWarningDays;
  }

  private future(slot: Slot, min: number, max: number): IsoDate {
    return addDays(this.anchor, this.warn(slot) + this.rng.int(min, max));
  }

  private makeReady(slot: Slot): void {
    const r = slot.record;
    switch (slot.kind) {
      case 'training':
        r.completed = true;
        if (this.rng.chance(0.4)) r.expires = this.future(slot, 10, 300);
        break;
      case 'device':
        r.expires = this.future(slot, 30, 300);
        r.lastCheckIn = addDays(this.anchor, -this.rng.int(0, 5));
        break;
      case 'yubikey':
        r.expires = this.future(slot, 30, 700);
        break;
      default:
        r.expires = this.future(slot, 10, 400);
    }
  }

  private makeExpiring(slot: Slot): void {
    const r = slot.record;
    const soon = () => addDays(this.anchor, this.rng.int(1, this.warn(slot)));
    if (slot.kind === 'training') {
      r.completed = false;
      delete r.expires;
      r.due = soon();
    } else if (slot.kind === 'device' && this.rng.chance(0.5)) {
      const { expiringAfterDays, notReadyAfterDays } = this.readiness.deviceCheckIn;
      r.lastCheckIn = addDays(this.anchor, -this.rng.int(expiringAfterDays, notReadyAfterDays - 1));
    } else {
      r.expires = soon();
    }
  }

  private makeNotReady(slot: Slot): void {
    const r = slot.record;
    const past = () => addDays(this.anchor, -this.rng.int(1, 60));
    switch (slot.kind) {
      case 'training':
        r.completed = false;
        delete r.expires;
        r.due = past();
        break;
      case 'device':
        if (this.rng.chance(0.5)) {
          const { notReadyAfterDays } = this.readiness.deviceCheckIn;
          r.lastCheckIn = addDays(this.anchor, -this.rng.int(notReadyAfterDays, notReadyAfterDays + 40));
        } else r.expires = past();
        break;
      case 'yubikey':
        if (this.rng.chance(0.5)) r.problem = 'lost';
        else r.expires = past();
        break;
      case 'role':
        r.problem = 'missing';
        break;
      default:
        r.expires = past();
    }
  }

  // Helpers

  private inCrew(personId: string, foremanId: string): boolean {
    return this.crews.get(foremanId)!.some((m) => m.person.id === personId);
  }

  private nextSerial(): number {
    this.serial += this.rng.int(1, 97);
    return this.serial;
  }

  private personas(s: PlantedScenarios): Persona[] {
    const director = this.nodes[0].person;
    const superintendent = this.nodes.find((n) => n.level === 'manager')!.person;
    const foreman = this.nodes.find((n) => n.person.id === s.toolCrewForemanId)!.person;
    return [
      { id: 'foreman', label: `Foreman: ${foreman.name}`, personId: foreman.id, isAdmin: false },
      { id: 'superintendent', label: `Superintendent: ${superintendent.name}`, personId: superintendent.id, isAdmin: false },
      { id: 'director', label: `Director: ${director.name}`, personId: director.id, isAdmin: false },
      { id: 'admin', label: `Admin: ${director.name}`, personId: director.id, isAdmin: true },
    ];
  }
}
